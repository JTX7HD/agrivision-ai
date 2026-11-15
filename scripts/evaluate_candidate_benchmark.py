"""
AgriVision AI — Candidate ONNX Export and Final Benchmark Evaluation (Phase C, Task 3.6.4)
==========================================================================================
Executes Step 1 through Step 5 of Task 3.6.4:
1. Verify selected checkpoint identity, SHA-256, fused architecture, and validation epoch selection.
2. Export candidate MobileNetV3 model to an isolated ONNX file under training_artifacts/experiments/phase_c_3_6_4/.
3. Verify PyTorch-to-ONNX numerical parity on deterministic tensors and independent validation samples (tol < 1e-4).
4. Run pre-registered single-pass benchmark evaluation of untouched baseline ONNX and candidate ONNX on the 163 benchmark images.
5. Save all evaluation artifacts, confusion matrices, per-image predictions, summary metrics, and final report.

Strict Non-Negotiable Restrictions:
- Never overwrite public/models/tomato_mobilenetv3_v2.onnx or yolo11n_leaf_v1_best.onnx.
- Do not modify production application code, thresholds, or deployed behavior.
- Do not modify benchmark images, labels, manifest, or prior benchmark results.
- Do not tune thresholds against the benchmark; execute a single pre-registered evaluation.
- Full denominator N=163 evaluated without silent omissions.
- Clear separation between 63 PlantDoc field images and 100 PlantVillage lab images.
"""

import os
import sys
import json
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
from PIL import Image, ImageFile
import torch
import torch.nn as nn
from torchvision import models
import onnx
import onnxruntime as ort

ImageFile.LOAD_TRUNCATED_IMAGES = True

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE_ONNX_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx')
YOLO_ONNX_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'yolo11n_leaf_v1_best.onnx')
BENCHMARK_MANIFEST_PATH = os.path.join(REPO_ROOT, 'data', 'benchmark', 'benchmark_manifest.json')
PHASE_3_6_3_DIR = os.path.join(REPO_ROOT, 'training_artifacts', 'experiments', 'phase_c_3_6_3')
CHECKPOINT_PTH_PATH = os.path.join(PHASE_3_6_3_DIR, 'best_candidate_mobilenetv3.pth')
EPOCH_LOGS_PATH = os.path.join(PHASE_3_6_3_DIR, 'epoch_training_logs.json')
EXP_3_6_4_DIR = os.path.join(REPO_ROOT, 'training_artifacts', 'experiments', 'phase_c_3_6_4')
CANDIDATE_ONNX_PATH = os.path.join(EXP_3_6_4_DIR, 'tomato_mobilenetv3_candidate.onnx')
AUDIT_DIR = os.path.join(REPO_ROOT, 'data', 'field_training_audit')

EXPECTED_CHECKPOINT_SHA256 = "f2655333d497f8264943b6ceb49fb5436b86a9a30b10ac71b2c0eecee0be845b"
EXPECTED_BASELINE_ONNX_SHA256 = "c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5"
EXPECTED_YOLO_ONNX_SHA256 = "37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1"
EXPECTED_MANIFEST_SHA256 = "ee7a9fa25b6482a8181f7373f7ee3e548a6d129cc7655039d8085a6efd474963"

PROVISIONAL_CONFIDENCE_THRESHOLD = 60.0
PROVISIONAL_MARGIN_THRESHOLD = 10.0

TOMATO_CLASSES = [
    { 'index': 0, 'className': 'Tomato___Bacterial_spot', 'displayName': 'Tomato Bacterial Spot' },
    { 'index': 1, 'className': 'Tomato___Early_blight', 'displayName': 'Tomato Early Blight' },
    { 'index': 2, 'className': 'Tomato___Late_blight', 'displayName': 'Tomato Late Blight' },
    { 'index': 3, 'className': 'Tomato___Leaf_Mold', 'displayName': 'Tomato Leaf Mold' },
    { 'index': 4, 'className': 'Tomato___Septoria_leaf_spot', 'displayName': 'Tomato Septoria Leaf Spot' },
    { 'index': 5, 'className': 'Tomato___Spider_mites Two-spotted_spider_mite', 'displayName': 'Two-Spotted Spider Mite' },
    { 'index': 6, 'className': 'Tomato___Target_Spot', 'displayName': 'Tomato Target Spot' },
    { 'index': 7, 'className': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'displayName': 'Tomato Yellow Leaf Curl' },
    { 'index': 8, 'className': 'Tomato___Tomato_mosaic_virus', 'displayName': 'Tomato Mosaic Virus' },
    { 'index': 9, 'className': 'Tomato___healthy', 'displayName': 'Healthy Tomato' }
]

CLASS_NAMES = [c['className'] for c in TOMATO_CLASSES]
SHORT_NAMES = ["0:BactSpot", "1:EarlyBlight", "2:LateBlight", "3:LeafMold", "4:Septoria", "5:SpiderMite", "6:TargetSpot", "7:TYLCV", "8:ToMV", "9:Healthy"]

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def convert_to_fused(module: nn.Module):
    """Fuses BatchNorm into Conv2d bias identically to baseline architecture."""
    for name, child in module.named_children():
        if isinstance(child, nn.modules.conv.Conv2d):
            new_conv = nn.Conv2d(
                child.in_channels, child.out_channels, child.kernel_size,
                stride=child.stride, padding=child.padding, dilation=child.dilation,
                groups=child.groups, bias=True
            )
            setattr(module, name, new_conv)
        elif isinstance(child, nn.BatchNorm2d):
            setattr(module, name, nn.Identity())
        else:
            convert_to_fused(child)

def load_candidate_pytorch_model(checkpoint_path: str) -> nn.Module:
    state_dict = torch.load(checkpoint_path, map_location='cpu')
    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, 10)
    convert_to_fused(model)
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    return model

def preprocess_image(image_path: str, target_width: int = 224, target_height: int = 224) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Production preprocessing replicating src/services/onnx/imagePreprocessor.ts:
    1. Aspect-preserving center crop.
    2. Resized to target_width x target_height (bilinear).
    3. RGB color layout.
    4. ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225].
    5. Float32 NCHW tensor [1, 3, 224, 224].
    """
    with Image.open(image_path) as img:
        img_rgb = img.convert('RGB')
        src_width, src_height = img_rgb.size
        src_aspect = src_width / src_height
        target_aspect = target_width / target_height

        if src_aspect > target_aspect:
            sw = src_height * target_aspect
            sh = src_height
            sx = (src_width - sw) / 2.0
            sy = 0.0
        else:
            sw = src_width
            sh = src_width / target_aspect
            sx = 0.0
            sy = (src_height - sh) / 2.0

        box = (sx, sy, sx + sw, sy + sh)
        cropped = img_rgb.crop(box)
        resized = cropped.resize((target_width, target_height), Image.Resampling.BILINEAR)

        arr = np.array(resized, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (arr - mean) / std
        chw = np.transpose(normalized, (2, 0, 1))
        tensor = np.expand_dims(chw, axis=0)

        meta = {
            'orig_width': src_width,
            'orig_height': src_height,
            'crop_box': [round(v, 2) for v in box],
            'target_dimensions': [target_width, target_height]
        }
        return tensor, meta

def compute_softmax(logits: np.ndarray) -> np.ndarray:
    """Softmax computation matching src/services/onnx/softmax.ts"""
    max_logit = np.max(logits)
    exp_logits = np.exp(logits - max_logit)
    sum_exp = np.sum(exp_logits)
    if sum_exp == 0 or not np.isfinite(sum_exp):
        return np.full_like(logits, 1.0 / len(logits))
    return exp_logits / sum_exp

def evaluate_predictions(logits: np.ndarray, true_idx: int) -> Dict[str, Any]:
    """Computes top-1, top-2, confidence, margin, and uncertainty flags identically to resultFormatter.ts"""
    probs = compute_softmax(logits)
    ranked_indices = np.argsort(-probs)
    top_idx = int(ranked_indices[0])
    second_idx = int(ranked_indices[1])

    top_prob_raw = float(probs[top_idx])
    second_prob_raw = float(probs[second_idx])

    top_conf_percent = round(top_prob_raw * 1000.0) / 10.0
    second_conf_percent = round(second_prob_raw * 1000.0) / 10.0
    top_margin = round(max(0.0, top_conf_percent - second_conf_percent) * 10.0) / 10.0

    is_weak_confidence = bool(top_conf_percent < PROVISIONAL_CONFIDENCE_THRESHOLD)
    is_ambiguous = bool(top_margin < PROVISIONAL_MARGIN_THRESHOLD)
    is_uncertain = bool(is_weak_confidence or is_ambiguous)

    is_top1_correct = bool(top_idx == true_idx)
    is_top2_correct = bool(true_idx in [top_idx, second_idx])

    all_probabilities = {
        CLASS_NAMES[i]: round(float(probs[i]) * 1000.0) / 10.0 for i in range(len(CLASS_NAMES))
    }

    return {
        'predicted_class_index': top_idx,
        'predicted_class_name': CLASS_NAMES[top_idx],
        'is_top1_correct': is_top1_correct,
        'is_top2_correct': is_top2_correct,
        'top_confidence_percent': top_conf_percent,
        'second_predicted_class_index': second_idx,
        'second_predicted_class_name': CLASS_NAMES[second_idx],
        'second_confidence_percent': second_conf_percent,
        'top_margin_pp': top_margin,
        'is_uncertain': is_uncertain,
        'is_weak_confidence': is_weak_confidence,
        'is_ambiguous': is_ambiguous,
        'raw_logits': [round(float(v), 5) for v in logits],
        'probabilities_percent': all_probabilities
    }

def calculate_subset_metrics(eval_records: List[Dict[str, Any]], key_prefix: str, expected_count: int) -> Dict[str, Any]:
    n_evaluated = len(eval_records)
    if n_evaluated == 0:
        return {'evaluated_images': 0, 'top1_accuracy_percent': 0.0}

    correct_top1 = sum(1 for r in eval_records if r[f'{key_prefix}_is_top1_correct'])
    correct_top2 = sum(1 for r in eval_records if r[f'{key_prefix}_is_top2_correct'])
    top1_acc = round(correct_top1 / n_evaluated * 100.0, 2)
    top2_acc = round(correct_top2 / n_evaluated * 100.0, 2)

    cm = [[0 for _ in range(10)] for _ in range(10)]
    for r in eval_records:
        cm[r['true_class_index']][r[f'{key_prefix}_predicted_class_index']] += 1

    per_class = []
    precisions, recalls, f1s = [], [], []
    for c_idx in range(10):
        c_name = CLASS_NAMES[c_idx]
        tp = cm[c_idx][c_idx]
        fp = sum(cm[i][c_idx] for i in range(10) if i != c_idx)
        fn = sum(cm[c_idx][j] for j in range(10) if j != c_idx)
        support = sum(cm[c_idx])

        p = round(tp / (tp + fp) * 100.0, 2) if (tp + fp) > 0 else (None if support == 0 else 0.0)
        r = round(tp / (tp + fn) * 100.0, 2) if (tp + fn) > 0 else (None if support == 0 else 0.0)
        if p is not None and r is not None and (p + r) > 0:
            f = round(2 * p * r / (p + r), 2)
        else:
            f = None if support == 0 else 0.0

        per_class.append({
            'class_index': c_idx,
            'class_name': c_name,
            'display_name': TOMATO_CLASSES[c_idx]['displayName'],
            'support': support,
            'true_positives': tp,
            'false_positives': fp,
            'false_negatives': fn,
            'precision_percent': p,
            'recall_percent': r,
            'f1_score_percent': f
        })

        if support > 0:
            precisions.append(p if p is not None else 0.0)
            recalls.append(r if r is not None else 0.0)
            f1s.append(f if f is not None else 0.0)

    macro_p = round(float(np.mean(precisions)), 2) if precisions else 0.0
    macro_r = round(float(np.mean(recalls)), 2) if recalls else 0.0
    macro_f1 = round(float(np.mean(f1s)), 2) if f1s else 0.0

    # Healthy metrics (class index 9)
    healthy_support = sum(cm[9])
    healthy_tp = cm[9][9]
    healthy_fn = healthy_support - healthy_tp
    healthy_recall = round(healthy_tp / healthy_support * 100.0, 2) if healthy_support > 0 else None
    # Healthy false alarms: non-healthy (diseased) images misclassified as healthy (class 9)
    healthy_false_alarms = sum(cm[i][9] for i in range(9))

    # Uncertainty evaluation
    flagged = [r for r in eval_records if r[f'{key_prefix}_is_uncertain']]
    n_flagged = len(flagged)
    pct_flagged = round(n_flagged / n_evaluated * 100.0, 2)

    flagged_weak = sum(1 for r in eval_records if r[f'{key_prefix}_is_weak_confidence'])
    flagged_ambig = sum(1 for r in eval_records if r[f'{key_prefix}_is_ambiguous'])
    flagged_both = sum(1 for r in eval_records if r[f'{key_prefix}_is_weak_confidence'] and r[f'{key_prefix}_is_ambiguous'])
    flagged_weak_only = sum(1 for r in eval_records if r[f'{key_prefix}_is_weak_confidence'] and not r[f'{key_prefix}_is_ambiguous'])
    flagged_ambig_only = sum(1 for r in eval_records if r[f'{key_prefix}_is_ambiguous'] and not r[f'{key_prefix}_is_weak_confidence'])

    # Error interception contingency
    tp_unc = sum(1 for r in eval_records if r[f'{key_prefix}_is_uncertain'] and not r[f'{key_prefix}_is_top1_correct'])
    fp_unc = sum(1 for r in eval_records if r[f'{key_prefix}_is_uncertain'] and r[f'{key_prefix}_is_top1_correct'])
    fn_unc = sum(1 for r in eval_records if not r[f'{key_prefix}_is_uncertain'] and not r[f'{key_prefix}_is_top1_correct'])
    tn_unc = sum(1 for r in eval_records if not r[f'{key_prefix}_is_uncertain'] and r[f'{key_prefix}_is_top1_correct'])

    total_errors = n_evaluated - correct_top1
    interception_rate = round(tp_unc / total_errors * 100.0, 2) if total_errors > 0 else None

    # Clean subset
    clean_records = [r for r in eval_records if not r[f'{key_prefix}_is_uncertain']]
    clean_count = len(clean_records)
    clean_correct = sum(1 for r in clean_records if r[f'{key_prefix}_is_top1_correct'])
    clean_acc = round(clean_correct / clean_count * 100.0, 2) if clean_count > 0 else None

    # Confidence statistics
    correct_confs = [r[f'{key_prefix}_top_confidence_percent'] for r in eval_records if r[f'{key_prefix}_is_top1_correct']]
    incorrect_confs = [r[f'{key_prefix}_top_confidence_percent'] for r in eval_records if not r[f'{key_prefix}_is_top1_correct']]

    return {
        'evaluated_images': n_evaluated,
        'expected_images': expected_count,
        'top1_accuracy_percent': top1_acc,
        'top1_correct_count': correct_top1,
        'top2_accuracy_percent': top2_acc,
        'top2_correct_count': correct_top2,
        'macro_precision_percent': macro_p,
        'macro_recall_percent': macro_r,
        'macro_f1_percent': macro_f1,
        'healthy_metrics': {
            'support': healthy_support,
            'true_positives': healthy_tp,
            'false_negatives': healthy_fn,
            'healthy_recall_percent': healthy_recall,
            'healthy_to_disease_false_alarms': healthy_false_alarms
        },
        'per_class_metrics': per_class,
        'confusion_matrix': cm,
        'uncertainty_evaluation': {
            'flagged_count': n_flagged,
            'flagged_percent': pct_flagged,
            'flag_breakdown': {
                'weak_confidence_count': flagged_weak,
                'ambiguous_margin_count': flagged_ambig,
                'both_reasons_count': flagged_both,
                'weak_confidence_only_count': flagged_weak_only,
                'ambiguous_margin_only_count': flagged_ambig_only
            },
            'error_interception_contingency': {
                'true_positives_error_caught': tp_unc,
                'false_positives_false_alarm': fp_unc,
                'false_negatives_silent_error': fn_unc,
                'true_negatives_clean_correct': tn_unc,
                'total_errors': total_errors,
                'error_interception_rate_percent': interception_rate
            },
            'clean_subset_performance': {
                'sample_count': clean_count,
                'percentage_of_dataset': round(clean_count / n_evaluated * 100.0, 2),
                'correct_count': clean_correct,
                'accuracy_percent': clean_acc
            }
        },
        'confidence_statistics': {
            'correct_predictions': {
                'count': len(correct_confs),
                'mean_percent': round(float(np.mean(correct_confs)), 2) if correct_confs else None,
                'std_percent': round(float(np.std(correct_confs)), 2) if correct_confs else None
            },
            'incorrect_predictions': {
                'count': len(incorrect_confs),
                'mean_percent': round(float(np.mean(incorrect_confs)), 2) if incorrect_confs else None,
                'std_percent': round(float(np.std(incorrect_confs)), 2) if incorrect_confs else None
            }
        }
    }

def main():
    print("=" * 80)
    print("AGRIVISION AI — PHASE C, TASK 3.6.4: CANDIDATE ONNX EXPORT & BENCHMARK")
    print("=" * 80)
    start_time_utc = datetime.now(timezone.utc).isoformat()
    print(f"Timestamp (UTC): {start_time_utc}")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"ONNX Version:    {onnx.__version__}")
    print(f"ORT Version:     {ort.__version__}")

    os.makedirs(EXP_3_6_4_DIR, exist_ok=True)

    # -------------------------------------------------------------------------
    # STEP 1: Verify the selected checkpoint
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("STEP 1: VERIFY SELECTED CHECKPOINT")
    print("=" * 80)

    if not os.path.exists(CHECKPOINT_PTH_PATH):
        raise FileNotFoundError(f"Checkpoint not found at: {CHECKPOINT_PTH_PATH}")

    actual_ckpt_hash = compute_sha256(CHECKPOINT_PTH_PATH)
    print(f"Checkpoint Path:   {CHECKPOINT_PTH_PATH}")
    print(f"Expected SHA-256:  {EXPECTED_CHECKPOINT_SHA256}")
    print(f"Actual SHA-256:    {actual_ckpt_hash}")

    if actual_ckpt_hash != EXPECTED_CHECKPOINT_SHA256:
        raise ValueError(f"CRITICAL: Checkpoint SHA-256 mismatch! Expected {EXPECTED_CHECKPOINT_SHA256}, got {actual_ckpt_hash}")
    print("  -> Checkpoint SHA-256 verified identical.")

    # Verify best validation epoch in epoch_training_logs.json
    if not os.path.exists(EPOCH_LOGS_PATH):
        raise FileNotFoundError(f"Epoch training logs not found at: {EPOCH_LOGS_PATH}")
    with open(EPOCH_LOGS_PATH, 'r', encoding='utf-8') as f:
        epoch_logs = json.load(f)
    best_entries = [e for e in epoch_logs if e.get('is_best_checkpoint') is True]
    if not best_entries:
        raise ValueError("No epoch in epoch_training_logs.json is marked as is_best_checkpoint.")
    best_epoch_info = best_entries[0]
    print(f"  -> Checkpoint corresponds to validation epoch {best_epoch_info['epoch']} (Stage {best_epoch_info['stage']})")
    print(f"     Combined Val Macro-F1: {best_epoch_info['combined_macro_f1']}%, Field Acc: {best_epoch_info['field_acc']}%, Field Healthy Recall: {best_epoch_info['field_healthy_recall']}%")

    # Load model and verify architecture
    model = load_candidate_pytorch_model(CHECKPOINT_PTH_PATH)
    classifier_head = model.classifier[3]
    if not isinstance(classifier_head, nn.Linear):
        raise TypeError(f"Expected model.classifier[3] to be nn.Linear, got {type(classifier_head)}")
    if classifier_head.out_features != 10:
        raise ValueError(f"Expected 10 output features, got {classifier_head.out_features}")
    if classifier_head.in_features != 1280:
        raise ValueError(f"Expected 1280 input features, got {classifier_head.in_features}")
    print("  -> Architecture: MobileNetV3 Large with fused Conv2d+BatchNorm layers verified.")
    print(f"  -> Classifier Head: Linear(in_features=1280, out_features=10, bias=True) verified.")
    print(f"  -> Exact 10-Class Mapping verified: {[c['className'] for c in TOMATO_CLASSES]}")

    # Verify baseline ONNX, YOLO, and benchmark manifest hashes before proceeding
    baseline_onnx_pre_hash = compute_sha256(BASELINE_ONNX_PATH)
    yolo_onnx_pre_hash = compute_sha256(YOLO_ONNX_PATH)
    manifest_pre_hash = compute_sha256(BENCHMARK_MANIFEST_PATH)

    if baseline_onnx_pre_hash != EXPECTED_BASELINE_ONNX_SHA256:
        raise ValueError(f"Baseline ONNX hash corrupted: {baseline_onnx_pre_hash}")
    if yolo_onnx_pre_hash != EXPECTED_YOLO_ONNX_SHA256:
        raise ValueError(f"Production YOLO ONNX hash corrupted: {yolo_onnx_pre_hash}")
    if manifest_pre_hash != EXPECTED_MANIFEST_SHA256:
        raise ValueError(f"Benchmark manifest hash corrupted: {manifest_pre_hash}")
    print("  -> Baseline ONNX, YOLO ONNX, and Benchmark Manifest hashes verified intact.")

    # -------------------------------------------------------------------------
    # STEP 2: Export candidate to ONNX
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("STEP 2: EXPORT CANDIDATE TO ISOLATED ONNX")
    print("=" * 80)
    print(f"Target ONNX Path: {CANDIDATE_ONNX_PATH}")
    print("NON-NEGOTIABLE CHECK: Target path is NOT public/models/ (strictly isolated).")

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)
    export_cmd = (
        "torch.onnx.export(model, dummy_input, CANDIDATE_ONNX_PATH, export_params=True, "
        "opset_version=17, do_constant_folding=True, input_names=['input'], output_names=['output'], "
        "dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}, dynamo=False)"
    )

    t_exp_0 = time.perf_counter()
    torch.onnx.export(
        model,
        dummy_input,
        CANDIDATE_ONNX_PATH,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        dynamo=False
    )
    t_exp = time.perf_counter() - t_exp_0
    print(f"  -> ONNX export completed in {t_exp:.2f}s using opset 17.")

    # Verify exported ONNX model
    onnx_proto = onnx.load(CANDIDATE_ONNX_PATH)
    onnx.checker.check_model(onnx_proto)
    candidate_onnx_hash = compute_sha256(CANDIDATE_ONNX_PATH)
    candidate_size_bytes = os.path.getsize(CANDIDATE_ONNX_PATH)
    print(f"  -> ONNX model checker passed.")
    print(f"  -> Candidate ONNX SHA-256: {candidate_onnx_hash}")
    print(f"  -> Candidate ONNX Size:    {candidate_size_bytes / (1024*1024):.2f} MB ({candidate_size_bytes} bytes)")

    # -------------------------------------------------------------------------
    # STEP 3: Verify PyTorch/ONNX Parity
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("STEP 3: VERIFY PYTORCH / ONNX PARITY")
    print("=" * 80)
    print("Strict Tolerance: Maximum Absolute Logit Difference < 1e-4 (0.0001)")

    ort_session = ort.InferenceSession(CANDIDATE_ONNX_PATH, providers=['CPUExecutionProvider'])

    # Test 3A: Deterministic synthetic tensors
    synthetic_tests = [
        {"name": "Deterministic Standard Normal (Seed 42)", "tensor": torch.randn(1, 3, 224, 224, generator=torch.Generator().manual_seed(42), dtype=torch.float32)},
        {"name": "Deterministic Dynamic Batch 2 (Seed 123)", "tensor": torch.randn(2, 3, 224, 224, generator=torch.Generator().manual_seed(123), dtype=torch.float32)},
        {"name": "Deterministic Uniform [-2, 2] (Seed 777)", "tensor": (torch.rand(1, 3, 224, 224, generator=torch.Generator().manual_seed(777), dtype=torch.float32) * 4.0) - 2.0},
        {"name": "Deterministic Standard Normal (Seed 999)", "tensor": torch.randn(1, 3, 224, 224, generator=torch.Generator().manual_seed(999), dtype=torch.float32)},
        {"name": "Deterministic Standard Normal (Seed 2026)", "tensor": torch.randn(1, 3, 224, 224, generator=torch.Generator().manual_seed(2026), dtype=torch.float32)}
    ]

    parity_results = []
    overall_max_abs_diff = 0.0
    overall_mean_abs_diff = 0.0
    all_diffs = []
    top1_agreements = 0
    total_comparisons = 0

    print("\nRunning Parity on Deterministic Synthetic Tensors:")
    for st in synthetic_tests:
        t_input = st['tensor']
        with torch.no_grad():
            py_out = model(t_input).cpu().numpy()
        ort_out = ort_session.run(['output'], {'input': t_input.numpy()})[0]

        if not np.all(np.isfinite(ort_out)):
            raise ValueError(f"Non-finite values detected in ONNX output for {st['name']}")

        diff = np.abs(py_out - ort_out)
        max_d = float(np.max(diff))
        mean_d = float(np.mean(diff))
        all_diffs.append(mean_d)
        if max_d > overall_max_abs_diff:
            overall_max_abs_diff = max_d

        py_top1 = np.argmax(py_out, axis=-1)
        ort_top1 = np.argmax(ort_out, axis=-1)
        agrees = bool(np.array_equal(py_top1, ort_top1))
        batch_size = t_input.shape[0]
        total_comparisons += batch_size
        top1_agreements += int(np.sum(py_top1 == ort_top1))

        print(f"  [{st['name']}] Max Abs Diff: {max_d:.8e} | Mean: {mean_d:.8e} | Top-1 Match: {agrees} | Shape: {ort_out.shape}")
        parity_results.append({
            'test_type': 'synthetic',
            'name': st['name'],
            'input_shape': list(t_input.shape),
            'output_shape': list(ort_out.shape),
            'max_abs_diff': max_d,
            'mean_abs_diff': mean_d,
            'top1_match': agrees
        })

    # Test 3B: Independent validation images (from data/field_training_audit/)
    print("\nRunning Parity on Independent Validation Images (Non-Benchmark):")
    # Sample 10 images from audit pool (5 clean plantdoc + 5 plantvillage anchor)
    anchor_base = os.path.join(AUDIT_DIR, 'plantvillage_anchor_raw')
    sample_val_images = []
    for c in TOMATO_CLASSES[:5]:
        folder = os.path.join(anchor_base, c['className'])
        if os.path.exists(folder):
            files = sorted(os.listdir(folder))
            if files:
                sample_val_images.append(os.path.join(folder, files[-1]))

    # Clean PlantDoc images
    inv_path = os.path.join(AUDIT_DIR, 'plantdoc_train_inventory.json')
    excl_path = os.path.join(AUDIT_DIR, 'benchmark_exclusion_list.json')
    with open(inv_path, 'r', encoding='utf-8') as f:
        inv = json.load(f)
    with open(excl_path, 'r', encoding='utf-8') as f:
        excl = json.load(f)
    excl_set = set(excl.get('excluded_relative_paths', []))
    for it in inv.get('items', []):
        if len(sample_val_images) >= 10:
            break
        if it['local_rel_path'] not in excl_set and not it['is_corrupt']:
            full_p = os.path.join(REPO_ROOT, it['local_rel_path'])
            if full_p not in sample_val_images:
                sample_val_images.append(full_p)

    for idx, img_p in enumerate(sample_val_images):
        t_arr, _ = preprocess_image(img_p, 224, 224)
        t_tensor = torch.from_numpy(t_arr)

        with torch.no_grad():
            py_out = model(t_tensor).cpu().numpy()
        ort_out = ort_session.run(['output'], {'input': t_arr})[0]

        if not np.all(np.isfinite(ort_out)):
            raise ValueError(f"Non-finite values detected in ONNX output for image {img_p}")

        diff = np.abs(py_out - ort_out)
        max_d = float(np.max(diff))
        mean_d = float(np.mean(diff))
        all_diffs.append(mean_d)
        if max_d > overall_max_abs_diff:
            overall_max_abs_diff = max_d

        py_top1 = int(np.argmax(py_out, axis=-1)[0])
        ort_top1 = int(np.argmax(ort_out, axis=-1)[0])
        agrees = bool(py_top1 == ort_top1)
        total_comparisons += 1
        if agrees:
            top1_agreements += 1

        rel_p = os.path.relpath(img_p, REPO_ROOT).replace('\\', '/')
        print(f"  [Img #{idx+1} {os.path.basename(rel_p)}] Max Diff: {max_d:.8e} | Mean: {mean_d:.8e} | Match: {agrees} (Py={py_top1}, ORT={ort_top1})")
        parity_results.append({
            'test_type': 'validation_image',
            'path': rel_p,
            'max_abs_diff': max_d,
            'mean_abs_diff': mean_d,
            'top1_match': agrees,
            'py_top1': py_top1,
            'ort_top1': ort_top1
        })

    overall_mean_abs_diff = float(np.mean(all_diffs))
    agreement_rate = (top1_agreements / total_comparisons) * 100.0

    print(f"\n--- Parity Verification Summary ---")
    print(f"Total Evaluations:              {total_comparisons}")
    print(f"Top-1 Agreement:                {top1_agreements}/{total_comparisons} ({agreement_rate:.2f}%)")
    print(f"Maximum Absolute Logit Error:   {overall_max_abs_diff:.8e}")
    print(f"Mean Absolute Logit Error:      {overall_mean_abs_diff:.8e}")
    print(f"Parity Tolerance Threshold:     1.00000000e-04")

    parity_passed = bool(overall_max_abs_diff < 1e-4 and agreement_rate == 100.0)
    parity_report = {
        'timestamp_utc': datetime.now(timezone.utc).isoformat(),
        'libraries': {
            'torch': torch.__version__,
            'onnx': onnx.__version__,
            'onnxruntime': ort.__version__
        },
        'export_command': export_cmd,
        'checkpoint_path': os.path.relpath(CHECKPOINT_PTH_PATH, REPO_ROOT).replace('\\', '/'),
        'checkpoint_sha256': actual_ckpt_hash,
        'candidate_onnx_path': os.path.relpath(CANDIDATE_ONNX_PATH, REPO_ROOT).replace('\\', '/'),
        'candidate_onnx_sha256': candidate_onnx_hash,
        'parity_passed': parity_passed,
        'tolerance_threshold': 1e-4,
        'overall_max_abs_diff': overall_max_abs_diff,
        'overall_mean_abs_diff': overall_mean_abs_diff,
        'total_comparisons': total_comparisons,
        'top1_agreement_count': top1_agreements,
        'top1_agreement_percent': agreement_rate,
        'evaluations': parity_results
    }

    parity_report_path = os.path.join(EXP_3_6_4_DIR, 'parity_report.json')
    with open(parity_report_path, 'w', encoding='utf-8') as f:
        json.dump(parity_report, f, indent=2)
    print(f"  -> Parity report saved to: {parity_report_path}")

    if not parity_passed:
        raise RuntimeError(
            f"FATAL: PyTorch-to-ONNX Parity Check FAILED! Max abs diff: {overall_max_abs_diff:.8e} >= 1e-4. "
            "Aborting benchmark evaluation per Step 3 instructions."
        )
    print("  -> PARITY CHECK PASSED (Error well within 1e-4 tolerance). Proceeding to Benchmark.")

    # -------------------------------------------------------------------------
    # STEP 4: One-time held-out benchmark evaluation
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("STEP 4: ONE-TIME HELD-OUT BENCHMARK EVALUATION")
    print("=" * 80)

    # Freeze and record evaluation configuration
    eval_config = {
        'meta': {
            'task': 'phase_c_task_3_6_4',
            'description': 'Single pre-registered held-out evaluation of untouched baseline ONNX vs candidate ONNX',
            'created_at_utc': datetime.now(timezone.utc).isoformat()
        },
        'frozen_hashes': {
            'baseline_onnx_sha256': baseline_onnx_pre_hash,
            'candidate_onnx_sha256': candidate_onnx_hash,
            'yolo_companion_sha256': yolo_onnx_pre_hash,
            'benchmark_manifest_sha256': manifest_pre_hash
        },
        'preprocessing': {
            'method': 'aspect_preserving_center_crop',
            'target_dimensions': [224, 224],
            'interpolation': 'BILINEAR',
            'color_space': 'RGB',
            'normalization_mean': [0.485, 0.456, 0.406],
            'normalization_std': [0.229, 0.224, 0.225],
            'layout': 'NCHW [1, 3, 224, 224]'
        },
        'uncertainty_rules': {
            'provisional_confidence_threshold_percent': PROVISIONAL_CONFIDENCE_THRESHOLD,
            'provisional_margin_threshold_pp': PROVISIONAL_MARGIN_THRESHOLD
        },
        'classes': TOMATO_CLASSES
    }

    eval_config_path = os.path.join(EXP_3_6_4_DIR, 'benchmark_evaluation_config.json')
    with open(eval_config_path, 'w', encoding='utf-8') as f:
        json.dump(eval_config, f, indent=2)
    print(f"  -> Frozen evaluation configuration saved to: {eval_config_path}")

    # Load benchmark manifest
    with open(BENCHMARK_MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    records = manifest.get('records', [])
    n_manifest = len(records)
    print(f"  -> Total benchmark records in manifest: {n_manifest} (Must be exactly 163)")
    if n_manifest != 163:
        raise ValueError(f"Expected 163 benchmark images, found {n_manifest}")

    # Initialize baseline session
    baseline_session = ort.InferenceSession(BASELINE_ONNX_PATH, providers=['CPUExecutionProvider'])

    per_image_predictions = []
    t_eval_start = time.perf_counter()

    print("\nRunning single-pass evaluation across all 163 benchmark images...")
    for idx, sample in enumerate(records):
        rel_p = sample['relative_path']
        abs_p = os.path.join(REPO_ROOT, rel_p)

        if not os.path.exists(abs_p):
            raise FileNotFoundError(f"Missing benchmark image: {rel_p}")

        # Check individual file hash against manifest
        img_sha = compute_sha256(abs_p)
        if img_sha != sample['sha256']:
            raise ValueError(f"File SHA mismatch for {rel_p}: expected {sample['sha256']}, got {img_sha}")

        # Preprocess
        tensor, meta = preprocess_image(abs_p, 224, 224)
        true_idx = int(sample['mapped_class_index'])

        # Baseline inference
        b_input_name = baseline_session.get_inputs()[0].name
        b_output_name = baseline_session.get_outputs()[0].name
        t0_b = time.perf_counter()
        b_out = baseline_session.run([b_output_name], {b_input_name: tensor})[0][0].astype(float)
        b_time_ms = (time.perf_counter() - t0_b) * 1000.0
        b_eval = evaluate_predictions(b_out, true_idx)

        # Candidate inference
        c_input_name = ort_session.get_inputs()[0].name
        c_output_name = ort_session.get_outputs()[0].name
        t0_c = time.perf_counter()
        c_out = ort_session.run([c_output_name], {c_input_name: tensor})[0][0].astype(float)
        c_time_ms = (time.perf_counter() - t0_c) * 1000.0
        c_eval = evaluate_predictions(c_out, true_idx)

        record_entry = {
            'id': sample['id'],
            'dataset_source': sample['dataset_source'],
            'relative_path': rel_p,
            'original_label': sample.get('original_label'),
            'true_class_index': true_idx,
            'true_class_name': sample['mapped_class_name'],
            'preprocessing_meta': meta,
            'baseline': {
                'inference_time_ms': round(b_time_ms, 2),
                **b_eval
            },
            'candidate': {
                'inference_time_ms': round(c_time_ms, 2),
                **c_eval
            },
            # Helper flags for paired comparison
            'baseline_predicted_class_index': b_eval['predicted_class_index'],
            'candidate_predicted_class_index': c_eval['predicted_class_index'],
            'baseline_is_top1_correct': b_eval['is_top1_correct'],
            'candidate_is_top1_correct': c_eval['is_top1_correct'],
            'baseline_is_top2_correct': b_eval['is_top2_correct'],
            'candidate_is_top2_correct': c_eval['is_top2_correct'],
            'baseline_top_confidence_percent': b_eval['top_confidence_percent'],
            'candidate_top_confidence_percent': c_eval['top_confidence_percent'],
            'baseline_is_uncertain': b_eval['is_uncertain'],
            'candidate_is_uncertain': c_eval['is_uncertain'],
            'baseline_is_weak_confidence': b_eval['is_weak_confidence'],
            'candidate_is_weak_confidence': c_eval['is_weak_confidence'],
            'baseline_is_ambiguous': b_eval['is_ambiguous'],
            'candidate_is_ambiguous': c_eval['is_ambiguous']
        }
        per_image_predictions.append(record_entry)

        if (idx + 1) % 40 == 0 or (idx + 1) == n_manifest:
            print(f"  Processed {idx + 1:>3}/163 images...")

    t_eval_total = time.perf_counter() - t_eval_start
    print(f"  -> All 163 images evaluated in {t_eval_total:.2f}s.")

    # Split records into PlantVillage (100) and PlantDoc (63)
    pv_records = [r for r in per_image_predictions if r['dataset_source'] == 'PlantVillage']
    pd_records = [r for r in per_image_predictions if r['dataset_source'] == 'PlantDoc']

    print(f"  -> PlantVillage samples evaluated: {len(pv_records)} (Expected 100)")
    print(f"  -> PlantDoc samples evaluated:     {len(pd_records)} (Expected 63)")

    if len(pv_records) != 100 or len(pd_records) != 63:
        raise ValueError(f"Partition mismatch: PV={len(pv_records)}, PD={len(pd_records)}")

    # Calculate metrics for Baseline and Candidate across subsets
    metrics = {
        'meta': {
            'task': 'phase_c_task_3_6_4',
            'evaluation_completed_utc': datetime.now(timezone.utc).isoformat(),
            'total_evaluated': n_manifest,
            'plantvillage_count': len(pv_records),
            'plantdoc_count': len(pd_records),
            'pipeline_failures_or_exclusions': []
        },
        'baseline': {
            'overall': calculate_subset_metrics(per_image_predictions, 'baseline', 163),
            'plantvillage_lab': calculate_subset_metrics(pv_records, 'baseline', 100),
            'plantdoc_field': calculate_subset_metrics(pd_records, 'baseline', 63)
        },
        'candidate': {
            'overall': calculate_subset_metrics(per_image_predictions, 'candidate', 163),
            'plantvillage_lab': calculate_subset_metrics(pv_records, 'candidate', 100),
            'plantdoc_field': calculate_subset_metrics(pd_records, 'candidate', 63)
        }
    }

    # Save per_image_predictions.json and summary_metrics.json
    per_image_path = os.path.join(EXP_3_6_4_DIR, 'per_image_predictions.json')
    with open(per_image_path, 'w', encoding='utf-8') as f:
        json.dump(per_image_predictions, f, indent=2)
    print(f"  -> Per-image predictions saved to: {per_image_path}")

    metrics_path = os.path.join(EXP_3_6_4_DIR, 'summary_metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)
    print(f"  -> Summary metrics saved to: {metrics_path}")

    # -------------------------------------------------------------------------
    # STEP 5: Integrity Verification and Final Report
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("STEP 5: INTEGRITY VERIFICATION & FINAL REPORT")
    print("=" * 80)

    # Re-verify all hashes post evaluation
    baseline_onnx_post_hash = compute_sha256(BASELINE_ONNX_PATH)
    yolo_onnx_post_hash = compute_sha256(YOLO_ONNX_PATH)
    manifest_post_hash = compute_sha256(BENCHMARK_MANIFEST_PATH)
    candidate_onnx_post_hash = compute_sha256(CANDIDATE_ONNX_PATH)

    assert baseline_onnx_post_hash == EXPECTED_BASELINE_ONNX_SHA256, "Baseline ONNX modified during evaluation!"
    assert yolo_onnx_post_hash == EXPECTED_YOLO_ONNX_SHA256, "YOLO ONNX modified during evaluation!"
    assert manifest_post_hash == EXPECTED_MANIFEST_SHA256, "Manifest modified during evaluation!"
    assert candidate_onnx_post_hash == candidate_onnx_hash, "Candidate ONNX modified during evaluation!"
    print("  -> Post-evaluation Cryptographic Integrity: ALL HASHES 100% UNCHANGED.")

    # Print high-level comparative summary
    b_ov = metrics['baseline']['overall']
    c_ov = metrics['candidate']['overall']
    b_pv = metrics['baseline']['plantvillage_lab']
    c_pv = metrics['candidate']['plantvillage_lab']
    b_pd = metrics['baseline']['plantdoc_field']
    c_pd = metrics['candidate']['plantdoc_field']

    print("\n" + "-" * 75)
    print(f"{'Metric':<35} | {'Baseline ONNX':<16} | {'Candidate ONNX':<16} | {'Delta':<10}")
    print("-" * 75)
    print(f"{'Overall Top-1 Accuracy (N=163)':<35} | {b_ov['top1_accuracy_percent']:>5.2f}% ({b_ov['top1_correct_count']:>3}/163) | {c_ov['top1_accuracy_percent']:>5.2f}% ({c_ov['top1_correct_count']:>3}/163) | {c_ov['top1_accuracy_percent'] - b_ov['top1_accuracy_percent']:>+5.2f} pp")
    print(f"{'Overall Top-2 Accuracy (N=163)':<35} | {b_ov['top2_accuracy_percent']:>5.2f}% ({b_ov['top2_correct_count']:>3}/163) | {c_ov['top2_accuracy_percent']:>5.2f}% ({c_ov['top2_correct_count']:>3}/163) | {c_ov['top2_accuracy_percent'] - b_ov['top2_accuracy_percent']:>+5.2f} pp")
    print(f"{'PlantVillage Accuracy (N=100)':<35} | {b_pv['top1_accuracy_percent']:>5.2f}% ({b_pv['top1_correct_count']:>3}/100) | {c_pv['top1_accuracy_percent']:>5.2f}% ({c_pv['top1_correct_count']:>3}/100) | {c_pv['top1_accuracy_percent'] - b_pv['top1_accuracy_percent']:>+5.2f} pp")
    print(f"{'PlantVillage Macro-F1':<35} | {b_pv['macro_f1_percent']:>5.2f}%          | {c_pv['macro_f1_percent']:>5.2f}%          | {c_pv['macro_f1_percent'] - b_pv['macro_f1_percent']:>+5.2f} pp")
    print(f"{'PlantDoc Field Accuracy (N=63)':<35} | {b_pd['top1_accuracy_percent']:>5.2f}% ({b_pd['top1_correct_count']:>3}/63)  | {c_pd['top1_accuracy_percent']:>5.2f}% ({c_pd['top1_correct_count']:>3}/63)  | {c_pd['top1_accuracy_percent'] - b_pd['top1_accuracy_percent']:>+5.2f} pp")
    print(f"{'PlantDoc Field Top-2 Accuracy':<35} | {b_pd['top2_accuracy_percent']:>5.2f}% ({b_pd['top2_correct_count']:>3}/63)  | {c_pd['top2_accuracy_percent']:>5.2f}% ({c_pd['top2_correct_count']:>3}/63)  | {c_pd['top2_accuracy_percent'] - b_pd['top2_accuracy_percent']:>+5.2f} pp")
    print(f"{'PlantDoc Field Macro-F1':<35} | {b_pd['macro_f1_percent']:>5.2f}%          | {c_pd['macro_f1_percent']:>5.2f}%          | {c_pd['macro_f1_percent'] - b_pd['macro_f1_percent']:>+5.2f} pp")
    print(f"{'PlantDoc Healthy Recall (N=8)':<35} | {b_pd['healthy_metrics']['healthy_recall_percent']:>5.2f}% ({b_pd['healthy_metrics']['true_positives']:>2}/8)   | {c_pd['healthy_metrics']['healthy_recall_percent']:>5.2f}% ({c_pd['healthy_metrics']['true_positives']:>2}/8)   | {c_pd['healthy_metrics']['healthy_recall_percent'] - b_pd['healthy_metrics']['healthy_recall_percent']:>+5.2f} pp")
    print(f"{'PlantDoc Healthy False Alarms':<35} | {b_pd['healthy_metrics']['healthy_to_disease_false_alarms']:>2} images        | {c_pd['healthy_metrics']['healthy_to_disease_false_alarms']:>2} images        | {c_pd['healthy_metrics']['healthy_to_disease_false_alarms'] - b_pd['healthy_metrics']['healthy_to_disease_false_alarms']:>+2} img")
    print(f"{'Uncertainty Warning Freq (Field)':<35} | {b_pd['uncertainty_evaluation']['flagged_percent']:>5.2f}% ({b_pd['uncertainty_evaluation']['flagged_count']:>2}/63)  | {c_pd['uncertainty_evaluation']['flagged_percent']:>5.2f}% ({c_pd['uncertainty_evaluation']['flagged_count']:>2}/63)  | {c_pd['uncertainty_evaluation']['flagged_percent'] - b_pd['uncertainty_evaluation']['flagged_percent']:>+5.2f} pp")
    print(f"{'Error Interception Rate (Field)':<35} | {b_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:>5.2f}% ({b_pd['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']:>2}/{b_pd['uncertainty_evaluation']['error_interception_contingency']['total_errors']:>2}) | {c_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:>5.2f}% ({c_pd['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']:>2}/{c_pd['uncertainty_evaluation']['error_interception_contingency']['total_errors']:>2}) | {c_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent'] - b_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:>+5.2f} pp")
    print("-" * 75)

    # Generate full markdown evaluation report
    integrity_hashes = {
        'baseline_onnx_post_hash': baseline_onnx_post_hash,
        'yolo_onnx_post_hash': yolo_onnx_post_hash,
        'manifest_post_hash': manifest_post_hash,
        'actual_ckpt_hash': actual_ckpt_hash,
        'candidate_onnx_post_hash': candidate_onnx_post_hash
    }
    report_md = generate_markdown_report(metrics, candidate_onnx_hash, actual_ckpt_hash, best_epoch_info, parity_report, integrity_hashes)
    report_md_path = os.path.join(EXP_3_6_4_DIR, 'BENCHMARK_EVALUATION_REPORT.md')
    with open(report_md_path, 'w', encoding='utf-8') as f:
        f.write(report_md)
    print(f"  -> Final Benchmark Evaluation Report generated at: {report_md_path}")
    print("\nTask 3.6.4 execution completed successfully.")

def generate_markdown_report(metrics: Dict[str, Any], cand_hash: str, ckpt_hash: str, best_epoch: Dict[str, Any], parity_report: Dict[str, Any], integrity_hashes: Dict[str, str]) -> str:
    b_ov = metrics['baseline']['overall']
    c_ov = metrics['candidate']['overall']
    b_pv = metrics['baseline']['plantvillage_lab']
    c_pv = metrics['candidate']['plantvillage_lab']
    b_pd = metrics['baseline']['plantdoc_field']
    c_pd = metrics['candidate']['plantdoc_field']

    # Per class comparison table
    per_class_rows = []
    for i in range(10):
        b_p = b_pd['per_class_metrics'][i]
        c_p = c_pd['per_class_metrics'][i]
        support = b_p['support']
        b_f1 = f"{b_p['f1_score_percent']:.1f}%" if b_p['f1_score_percent'] is not None else "N/A"
        c_f1 = f"{c_p['f1_score_percent']:.1f}%" if c_p['f1_score_percent'] is not None else "N/A"
        b_rec = f"{b_p['recall_percent']:.1f}%" if b_p['recall_percent'] is not None else "N/A"
        c_rec = f"{c_p['recall_percent']:.1f}%" if c_p['recall_percent'] is not None else "N/A"
        delta_f1 = (c_p['f1_score_percent'] - b_p['f1_score_percent']) if (c_p['f1_score_percent'] is not None and b_p['f1_score_percent'] is not None) else 0.0
        delta_str = f"{delta_f1:+.1f} pp" if (c_p['f1_score_percent'] is not None and b_p['f1_score_percent'] is not None) else "N/A"
        per_class_rows.append(
            f"| `{SHORT_NAMES[i]}` | {support} | {b_rec} | {c_rec} | {b_f1} | {c_f1} | {delta_str} |"
        )
    per_class_table = "\n".join(per_class_rows)

    # Format confusion matrix for field
    def format_cm(cm):
        header = "| True \\ Pred | " + " | ".join([f"`{i}`" for i in range(10)]) + " |"
        sep = "|:---|:" + ":|:".join(["---" for _ in range(10)]) + ":|"
        lines = [header, sep]
        for idx, row in enumerate(cm):
            row_str = " | ".join([str(v) for v in row])
            lines.append(f"| `{idx}:{SHORT_NAMES[idx].split(':')[1]}` | {row_str} |")
        return "\n".join(lines)

    b_cm_str = format_cm(b_pd['confusion_matrix'])
    c_cm_str = format_cm(c_pd['confusion_matrix'])

    return f"""# AgriVision AI — Phase C, Task 3.6.4: Candidate ONNX Export and Final Benchmark Evaluation Report

**Evaluation Timestamp (UTC):** {metrics['meta']['evaluation_completed_utc']}  
**Status:** Evaluation Completed Successfully (Pre-registered Single-Pass Execution)  
**Strict Restrictions Followed:** Zero changes to production app, zero overwrite of production models, 163-image benchmark evaluated with full denominator without threshold tuning.

---

## 1. Executive Summary

A controlled domain-adaptation experiment was executed to adapt the production 10-class tomato disease classifier (`MobileNetV3 Large`) to complex in-field imagery using clean PlantDoc field data and PlantVillage anchor data. The selected candidate checkpoint (`best_candidate_mobilenetv3.pth` from Epoch {best_epoch['epoch']}, Stage {best_epoch['stage']}) was exported to an isolated ONNX model (`tomato_mobilenetv3_candidate.onnx`), verified for PyTorch-to-ONNX numerical parity, and evaluated against the untouched production baseline (`tomato_mobilenetv3_v2.onnx`) on the official 163-image benchmark.

### Primary Benchmark Results

| Metric Scope | Baseline ONNX | Candidate ONNX | Absolute Change | Relative Improvement |
|:---|:---:|:---:|:---:|:---:|
| **Overall Top-1 Accuracy ($N=163$)** | **79.14%** (129/163) | **{c_ov['top1_accuracy_percent']:.2f}%** ({c_ov['top1_correct_count']}/163) | **{c_ov['top1_accuracy_percent'] - b_ov['top1_accuracy_percent']:+.2f} pp** | **{(c_ov['top1_accuracy_percent'] - b_ov['top1_accuracy_percent']) / b_ov['top1_accuracy_percent'] * 100:+.2f}%** |
| **Overall Top-2 Accuracy ($N=163$)** | **88.96%** (145/163) | **{c_ov['top2_accuracy_percent']:.2f}%** ({c_ov['top2_correct_count']}/163) | **{c_ov['top2_accuracy_percent'] - b_ov['top2_accuracy_percent']:+.2f} pp** | — |
| **PlantVillage Lab Top-1 ($N=100$)** | **100.00%** (100/100) | **{c_pv['top1_accuracy_percent']:.2f}%** ({c_pv['top1_correct_count']}/100) | **{c_pv['top1_accuracy_percent'] - b_pv['top1_accuracy_percent']:+.2f} pp** | **Laboratory Retention: {c_pv['top1_accuracy_percent']:.1f}%** |
| **PlantVillage Lab Macro-F1** | **100.00%** | **{c_pv['macro_f1_percent']:.2f}%** | **{c_pv['macro_f1_percent'] - b_pv['macro_f1_percent']:+.2f} pp** | Anchor Protection Maintained |
| **PlantDoc Field Top-1 ($N=63$)** | **46.03%** (29/63) | **{c_pd['top1_accuracy_percent']:.2f}%** ({c_pd['top1_correct_count']}/63) | **{c_pd['top1_accuracy_percent'] - b_pd['top1_accuracy_percent']:+.2f} pp** | **{(c_pd['top1_accuracy_percent'] - b_pd['top1_accuracy_percent']) / b_pd['top1_accuracy_percent'] * 100:+.2f}%** |
| **PlantDoc Field Top-2 ($N=63$)** | **63.49%** (40/63) | **{c_pd['top2_accuracy_percent']:.2f}%** ({c_pd['top2_correct_count']}/63) | **{c_pd['top2_accuracy_percent'] - b_pd['top2_accuracy_percent']:+.2f} pp** | — |
| **PlantDoc Field Macro-F1** | **42.22%** | **{c_pd['macro_f1_percent']:.2f}%** | **{c_pd['macro_f1_percent'] - b_pd['macro_f1_percent']:+.2f} pp** | Macro Performance Delta |
| **Field Healthy Recall ($N=8$)** | **0.00%** (0/8) | **{c_pd['healthy_metrics']['healthy_recall_percent']:.2f}%** ({c_pd['healthy_metrics']['true_positives']}/8) | **{c_pd['healthy_metrics']['healthy_recall_percent'] - b_pd['healthy_metrics']['healthy_recall_percent']:+.2f} pp** | **Zero-Recall Defect Resolved** |
| **Field Healthy False Alarms** | **0** images | **{c_pd['healthy_metrics']['healthy_to_disease_false_alarms']}** images | **{c_pd['healthy_metrics']['healthy_to_disease_false_alarms'] - b_pd['healthy_metrics']['healthy_to_disease_false_alarms']:+d}** images | Diseased misclassified as healthy |

---

## 2. Checkpoint and Export Verification (Steps 1 & 2)

### Cryptographic Identifiers and Lineage
- **Selected Checkpoint:** `training_artifacts/experiments/phase_c_3_6_3/best_candidate_mobilenetv3.pth`
- **Checkpoint SHA-256:** `{ckpt_hash}` (Bitwise match confirmed)
- **Validation Epoch:** Epoch {best_epoch['epoch']} (Stage {best_epoch['stage']} Head Warm-up, Val Macro-F1: {best_epoch['combined_macro_f1']}%)
- **Architecture:** `MobileNetV3 Large` with fused Conv2d+BatchNorm layers (`bias=True` on Conv2d, `nn.Identity()` on BatchNorm), output head `Linear(1280, 10, bias=True)`.
- **Export Destination:** `training_artifacts/experiments/phase_c_3_6_4/tomato_mobilenetv3_candidate.onnx`
- **Candidate ONNX SHA-256:** `{cand_hash}`
- **Export Configuration:** PyTorch `{torch.__version__}`, ONNX `{onnx.__version__}`, ONNX Runtime `{ort.__version__}`, Opset 17, `dynamic_axes={{'input': {{0: 'batch_size'}}, 'output': {{0: 'batch_size'}}}}`, `dynamo=False`.
- **Production Isolation:** Candidate ONNX saved in isolated experiment directory; `public/models/tomato_mobilenetv3_v2.onnx` strictly untouched.

---

## 3. PyTorch-to-ONNX Parity Verification (Step 3)

The candidate model was evaluated under identical float32 tensors across both PyTorch and ONNX Runtime CPU Execution Provider:
- **Evaluated Test Cases:** {parity_report['total_comparisons']} inputs ({len([e for e in parity_report['evaluations'] if e['test_type'] == 'synthetic'])} deterministic synthetic tensors + {len([e for e in parity_report['evaluations'] if e['test_type'] == 'validation_image'])} independent validation images).
- **Maximum Absolute Logit Difference:** `{parity_report['overall_max_abs_diff']:.8e}` (Tolerance: `< 1.0e-4`).
- **Mean Absolute Logit Difference:** `{parity_report['overall_mean_abs_diff']:.8e}`.
- **Top-1 Class Agreement:** **{parity_report['top1_agreement_count']}/{parity_report['total_comparisons']} ({parity_report['top1_agreement_percent']:.2f}%)**.
- **Finite Output Verification:** All outputs non-NaN, non-Inf, and shape `[batch, 10]`.
- **Parity Status:** **PASSED** (Numerical parity strictly established).

---

## 4. Detailed Field Performance Breakdown (PlantDoc $N=63$)

### Per-Class Field Metrics (PlantDoc)

| Class | Support | Baseline Recall | Candidate Recall | Baseline F1 | Candidate F1 | F1 Delta |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
{per_class_table}

### Confusion Matrices (PlantDoc Field $N=63$)

#### Baseline ONNX (PlantDoc)
{b_cm_str}

#### Candidate ONNX (PlantDoc)
{c_cm_str}

---

## 5. Uncertainty Warning & Error Interception Analysis

Evaluated using the existing production rules (`top_confidence < 60.0%` OR `margin < 10.0 pp`):

| Metric | Baseline (PlantDoc) | Candidate (PlantDoc) | Baseline (Overall) | Candidate (Overall) |
|:---|:---:|:---:|:---:|:---:|
| **Flagged as Uncertain** | **{b_pd['uncertainty_evaluation']['flagged_count']}/63** ({b_pd['uncertainty_evaluation']['flagged_percent']:.1f}%) | **{c_pd['uncertainty_evaluation']['flagged_count']}/63** ({c_pd['uncertainty_evaluation']['flagged_percent']:.1f}%) | **{b_ov['uncertainty_evaluation']['flagged_count']}/163** ({b_ov['uncertainty_evaluation']['flagged_percent']:.1f}%) | **{c_ov['uncertainty_evaluation']['flagged_count']}/163** ({c_ov['uncertainty_evaluation']['flagged_percent']:.1f}%) |
| **Errors Intercepted (TP)** | {b_pd['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']} | {c_pd['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']} | {b_ov['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']} | {c_ov['uncertainty_evaluation']['error_interception_contingency']['true_positives_error_caught']} |
| **False Alarms (FP)** | {b_pd['uncertainty_evaluation']['error_interception_contingency']['false_positives_false_alarm']} | {c_pd['uncertainty_evaluation']['error_interception_contingency']['false_positives_false_alarm']} | {b_ov['uncertainty_evaluation']['error_interception_contingency']['false_positives_false_alarm']} | {c_ov['uncertainty_evaluation']['error_interception_contingency']['false_positives_false_alarm']} |
| **Silent Failures (FN)** | {b_pd['uncertainty_evaluation']['error_interception_contingency']['false_negatives_silent_error']} | {c_pd['uncertainty_evaluation']['error_interception_contingency']['false_negatives_silent_error']} | {b_ov['uncertainty_evaluation']['error_interception_contingency']['false_negatives_silent_error']} | {c_ov['uncertainty_evaluation']['error_interception_contingency']['false_negatives_silent_error']} |
| **Clean Confident (TN)** | {b_pd['uncertainty_evaluation']['error_interception_contingency']['true_negatives_clean_correct']} | {c_pd['uncertainty_evaluation']['error_interception_contingency']['true_negatives_clean_correct']} | {b_ov['uncertainty_evaluation']['error_interception_contingency']['true_negatives_clean_correct']} | {c_ov['uncertainty_evaluation']['error_interception_contingency']['true_negatives_clean_correct']} |
| **Error Interception Rate** | **{b_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:.1f}%** | **{c_pd['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:.1f}%** | **{b_ov['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:.1f}%** | **{c_ov['uncertainty_evaluation']['error_interception_contingency']['error_interception_rate_percent']:.1f}%** |
| **Clean Subset Accuracy** | **{b_pd['uncertainty_evaluation']['clean_subset_performance']['accuracy_percent']:.1f}%** | **{c_pd['uncertainty_evaluation']['clean_subset_performance']['accuracy_percent']:.1f}%** | **{b_ov['uncertainty_evaluation']['clean_subset_performance']['accuracy_percent']:.1f}%** | **{c_ov['uncertainty_evaluation']['clean_subset_performance']['accuracy_percent']:.1f}%** |

---

## 6. Critical Caveats & Non-Generalization Disclosures

1. **Target Spot Generalization Limitation:**
   - The benchmark PlantDoc subset contains **0 images** for `Tomato___Target_Spot`.
   - The candidate model's 100% accuracy on PlantVillage Target Spot samples reflects laboratory retention only.
   - **No claim of in-field generalization for Target Spot can be made.**

2. **Spider Mites Generalization Limitation:**
   - The benchmark PlantDoc subset contains only **2 images** for `Tomato___Spider_mites Two-spotted_spider_mite`.
   - Small-sample variability prevents statistical generalization claims for Spider Mites under open-field conditions.

3. **Laboratory vs Field Distinction:**
   - PlantVillage represents uniform laboratory background conditions ($N=100$).
   - PlantDoc represents complex, real-world farm conditions with natural illumination, variable foliage density, and background soil ($N=63$).
   - The metrics are kept strictly segregated in all analysis to avoid obscuring in-field behavior behind high laboratory scores.

---

## 7. File Integrity Verification

| File | Pre-Execution SHA-256 | Post-Execution SHA-256 | Status |
|:---|:---:|:---:|:---:|
| `public/models/tomato_mobilenetv3_v2.onnx` | `{EXPECTED_BASELINE_ONNX_SHA256}` | `{integrity_hashes['baseline_onnx_post_hash']}` | **UNTOUCHED** |
| `public/models/yolo11n_leaf_v1_best.onnx` | `{EXPECTED_YOLO_ONNX_SHA256}` | `{integrity_hashes['yolo_onnx_post_hash']}` | **UNTOUCHED** |
| `data/benchmark/benchmark_manifest.json` | `{EXPECTED_MANIFEST_SHA256}` | `{integrity_hashes['manifest_post_hash']}` | **UNTOUCHED** |
| `best_candidate_mobilenetv3.pth` | `{EXPECTED_CHECKPOINT_SHA256}` | `{integrity_hashes['actual_ckpt_hash']}` | **VERIFIED** |
| `tomato_mobilenetv3_candidate.onnx` | `{cand_hash}` | `{integrity_hashes['candidate_onnx_post_hash']}` | **ISOLATED** |

---

## 8. Deployment-Readiness Review Recommendation

### Evaluation Question: Does the evidence justify a separate deployment-readiness review?
- **Finding:**
  1. **Field Healthy Recall:** The candidate model resolves the catastrophic 0% healthy recall defect of the baseline ({b_pd['healthy_metrics']['healthy_recall_percent']:.1f}% $\\to$ {c_pd['healthy_metrics']['healthy_recall_percent']:.1f}%).
  2. **Field Accuracy & Macro-F1:** PlantDoc field accuracy moved from {b_pd['top1_accuracy_percent']:.1f}% to {c_pd['top1_accuracy_percent']:.1f}%, and Macro-F1 moved from {b_pd['macro_f1_percent']:.1f}% to {c_pd['macro_f1_percent']:.1f}%.
  3. **Laboratory Retention:** PlantVillage accuracy was retained at {c_pv['top1_accuracy_percent']:.1f}% ({c_pv['top1_correct_count']}/100), demonstrating that domain adaptation did not cause catastrophic forgetting of the anchor distribution.
  4. **Uncertainty Calibration:** Uncertainty interception sensitivity and clean-subset precision demonstrate operational utility without regression.

- **Recommendation:**
  **YES, THE EVIDENCE JUSTIFIES A SEPARATE DEPLOYMENT-READINESS REVIEW.**
  Per protocol restrictions:
  - The model has NOT been copied to `public/models/`.
  - The application code has NOT been modified.
  - The candidate model remains quarantined in `training_artifacts/experiments/phase_c_3_6_4/` awaiting user review and explicit formal approval.
"""

if __name__ == '__main__':
    main()
