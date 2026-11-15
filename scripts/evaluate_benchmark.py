"""
AgriVision AI — Benchmark Evaluation Script (Phase C, Task 3.2)
==============================================================
Evaluates the production MobileNetV3 V2 ONNX tomato disease classifier
on the standardized read-only benchmark dataset (PlantVillage + PlantDoc).

Strict Restrictions Enforced:
- Model loaded in strictly read-only mode.
- Does not modify, retrain, replace, or overwrite any model weights.
- Does not modify production application code or thresholds.
- Does not move benchmark images into training or correction directories.
- Verifies SHA-256 hashes of models and manifest before and after execution.
- Separates evaluation between PlantVillage (lab) and PlantDoc (in-field).
"""

import os
import sys
import json
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
from PIL import Image, ImageFile
import onnxruntime as ort

ImageFile.LOAD_TRUNCATED_IMAGES = True

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx')
YOLO_MODEL_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'yolo11n_leaf_v1_best.onnx')
MANIFEST_PATH = os.path.join(REPO_ROOT, 'data', 'benchmark', 'benchmark_manifest.json')
RESULTS_DIR = os.path.join(REPO_ROOT, 'data', 'benchmark', 'results')

SCRIPT_VERSION = "1.0.0"

# Exact 10 tomato disease classes matching src/services/onnx/classMapper.ts
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
SHORT_NAMES = [
    "0:BactSpot",
    "1:EarlyBlight",
    "2:LateBlight",
    "3:LeafMold",
    "4:Septoria",
    "5:SpiderMite",
    "6:TargetSpot",
    "7:TYLCV",
    "8:ToMV",
    "9:Healthy"
]

# Uncertainty rules from src/services/onnx/resultFormatter.ts
PROVISIONAL_CONFIDENCE_THRESHOLD = 60.0  # %
PROVISIONAL_MARGIN_THRESHOLD = 10.0      # percentage points (pp)

def compute_sha256(file_path: str) -> str:
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def preprocess_image(image_path: str, target_width: int = 224, target_height: int = 224) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Exact replication of production preprocessing from src/services/onnx/imagePreprocessor.ts:
    1. Aspect-preserving center crop.
    2. Resized to target_width x target_height.
    3. RGB color layout.
    4. ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225].
    5. Layout: Float32 NCHW tensor of shape [1, 3, 224, 224].
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

        # Normalize to [0, 1]
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

def evaluate_single_sample(session: ort.InferenceSession, sample: Dict[str, Any]) -> Dict[str, Any]:
    """Runs single image inference and uncertainty evaluation."""
    rel_path = sample['relative_path']
    abs_path = os.path.join(REPO_ROOT, rel_path)

    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"Benchmark image not found on disk: {rel_path}")

    # File integrity check against manifest sha256
    file_sha256 = compute_sha256(abs_path)
    if file_sha256 != sample['sha256']:
        raise ValueError(f"SHA-256 mismatch for {rel_path}: manifest={sample['sha256']} actual={file_sha256}")

    t0 = time.perf_counter()
    tensor, prep_meta = preprocess_image(abs_path, 224, 224)
    prep_time_ms = (time.perf_counter() - t0) * 1000.0

    t1 = time.perf_counter()
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    outputs = session.run([output_name], {input_name: tensor})
    infer_time_ms = (time.perf_counter() - t1) * 1000.0

    logits = outputs[0][0].astype(float)
    probs = compute_softmax(logits)

    # Class probabilities in percentages rounded to 1 decimal place matching resultFormatter.ts
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

    true_idx = int(sample['mapped_class_index'])
    is_top1_correct = bool(top_idx == true_idx)
    is_top2_correct = bool(true_idx in [top_idx, second_idx])

    all_probabilities = {
        CLASS_NAMES[i]: round(float(probs[i]) * 1000.0) / 10.0 for i in range(len(CLASS_NAMES))
    }

    return {
        'id': sample['id'],
        'dataset_source': sample['dataset_source'],
        'relative_path': rel_path,
        'original_label': sample.get('original_label'),
        'true_class_index': true_idx,
        'true_class_name': sample['mapped_class_name'],
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
        'probabilities_percent': all_probabilities,
        'preprocessing_meta': prep_meta,
        'prep_time_ms': round(prep_time_ms, 2),
        'infer_time_ms': round(infer_time_ms, 2)
    }

def calculate_dataset_metrics(records: List[Dict[str, Any]], manifest_entries_count: int, exclusions: List[Dict[str, Any]]) -> Dict[str, Any]:
    n_evaluated = len(records)
    n_usable = n_evaluated + len(exclusions)

    if n_evaluated == 0:
        return {
            'manifest_entries': manifest_entries_count,
            'usable_images': n_usable,
            'evaluated_images': 0,
            'exclusions': exclusions,
            'top1_accuracy_percent': 0.0,
            'top2_accuracy_percent': 0.0
        }

    # Top-1 and Top-2 accuracy
    correct_top1 = sum(1 for r in records if r['is_top1_correct'])
    correct_top2 = sum(1 for r in records if r['is_top2_correct'])
    top1_acc = (correct_top1 / n_evaluated) * 100.0
    top2_acc = (correct_top2 / n_evaluated) * 100.0

    # 10x10 Confusion Matrix: cm[true_idx][pred_idx]
    cm = [[0 for _ in range(10)] for _ in range(10)]
    for r in records:
        cm[r['true_class_index']][r['predicted_class_index']] += 1

    # Per-class metrics
    per_class = []
    for c_idx in range(10):
        c_name = CLASS_NAMES[c_idx]
        tp = cm[c_idx][c_idx]
        fp = sum(cm[i][c_idx] for i in range(10) if i != c_idx)
        fn = sum(cm[c_idx][j] for j in range(10) if j != c_idx)
        support = sum(cm[c_idx])

        precision = (tp / (tp + fp)) * 100.0 if (tp + fp) > 0 else None
        recall = (tp / (tp + fn)) * 100.0 if (tp + fn) > 0 else None
        if precision is not None and recall is not None and (precision + recall) > 0:
            f1 = (2 * precision * recall) / (precision + recall)
        else:
            f1 = None if support == 0 else 0.0

        per_class.append({
            'class_index': c_idx,
            'class_name': c_name,
            'display_name': TOMATO_CLASSES[c_idx]['displayName'],
            'support': support,
            'true_positives': tp,
            'false_positives': fp,
            'false_negatives': fn,
            'precision_percent': round(precision, 2) if precision is not None else None,
            'recall_percent': round(recall, 2) if recall is not None else None,
            'f1_score_percent': round(f1, 2) if f1 is not None else None,
            'note': 'Zero support in dataset split' if support == 0 else None
        })

    # Confidence statistics
    correct_confidences = [r['top_confidence_percent'] for r in records if r['is_top1_correct']]
    incorrect_confidences = [r['top_confidence_percent'] for r in records if not r['is_top1_correct']]

    avg_conf_correct = float(np.mean(correct_confidences)) if correct_confidences else None
    std_conf_correct = float(np.std(correct_confidences)) if correct_confidences else None
    avg_conf_incorrect = float(np.mean(incorrect_confidences)) if incorrect_confidences else None
    std_conf_incorrect = float(np.std(incorrect_confidences)) if incorrect_confidences else None

    # Uncertainty rule statistics
    flagged_uncertain = [r for r in records if r['is_uncertain']]
    n_flagged = len(flagged_uncertain)
    pct_flagged = (n_flagged / n_evaluated) * 100.0

    flagged_weak_conf = sum(1 for r in records if r['is_weak_confidence'])
    flagged_ambiguous = sum(1 for r in records if r['is_ambiguous'])
    flagged_both = sum(1 for r in records if r['is_weak_confidence'] and r['is_ambiguous'])
    flagged_weak_only = sum(1 for r in records if r['is_weak_confidence'] and not r['is_ambiguous'])
    flagged_ambig_only = sum(1 for r in records if r['is_ambiguous'] and not r['is_weak_confidence'])

    # Uncertainty error interception analysis
    tp_uncertain = sum(1 for r in records if r['is_uncertain'] and not r['is_top1_correct'])
    fp_uncertain = sum(1 for r in records if r['is_uncertain'] and r['is_top1_correct'])
    fn_uncertain = sum(1 for r in records if not r['is_uncertain'] and not r['is_top1_correct'])
    tn_uncertain = sum(1 for r in records if not r['is_uncertain'] and r['is_top1_correct'])

    total_incorrect = len(incorrect_confidences)
    error_interception_rate = (tp_uncertain / total_incorrect * 100.0) if total_incorrect > 0 else None

    # Performance on unflagged (clean) subset
    clean_records = [r for r in records if not r['is_uncertain']]
    clean_count = len(clean_records)
    clean_correct = sum(1 for r in clean_records if r['is_top1_correct'])
    clean_accuracy_pct = (clean_correct / clean_count * 100.0) if clean_count > 0 else None

    return {
        'manifest_entries': manifest_entries_count,
        'usable_images': n_usable,
        'evaluated_images': n_evaluated,
        'exclusions': exclusions,
        'exclusion_count': len(exclusions),
        'top1_accuracy_percent': round(top1_acc, 2),
        'top1_correct_count': correct_top1,
        'top2_accuracy_percent': round(top2_acc, 2),
        'top2_correct_count': correct_top2,
        'per_class_metrics': per_class,
        'confusion_matrix': cm,
        'confidence_statistics': {
            'correct_predictions': {
                'count': len(correct_confidences),
                'mean_percent': round(avg_conf_correct, 2) if avg_conf_correct is not None else None,
                'std_percent': round(std_conf_correct, 2) if std_conf_correct is not None else None,
                'min_percent': round(float(np.min(correct_confidences)), 2) if correct_confidences else None,
                'max_percent': round(float(np.max(correct_confidences)), 2) if correct_confidences else None
            },
            'incorrect_predictions': {
                'count': len(incorrect_confidences),
                'mean_percent': round(avg_conf_incorrect, 2) if avg_conf_incorrect is not None else None,
                'std_percent': round(std_conf_incorrect, 2) if std_conf_incorrect is not None else None,
                'min_percent': round(float(np.min(incorrect_confidences)), 2) if incorrect_confidences else None,
                'max_percent': round(float(np.max(incorrect_confidences)), 2) if incorrect_confidences else None
            }
        },
        'uncertainty_evaluation': {
            'rules': {
                'confidence_threshold_percent': PROVISIONAL_CONFIDENCE_THRESHOLD,
                'margin_threshold_pp': PROVISIONAL_MARGIN_THRESHOLD
            },
            'flagged_count': n_flagged,
            'flagged_percent': round(pct_flagged, 2),
            'flag_breakdown': {
                'weak_confidence_count': flagged_weak_conf,
                'ambiguous_margin_count': flagged_ambiguous,
                'both_reasons_count': flagged_both,
                'weak_confidence_only_count': flagged_weak_only,
                'ambiguous_margin_only_count': flagged_ambig_only
            },
            'error_interception_contingency': {
                'true_positives_error_caught': tp_uncertain,
                'false_positives_false_alarm': fp_uncertain,
                'false_negatives_silent_error': fn_uncertain,
                'true_negatives_clean_correct': tn_uncertain,
                'error_interception_rate_percent': round(error_interception_rate, 2) if error_interception_rate is not None else None
            },
            'clean_subset_performance': {
                'sample_count': clean_count,
                'percentage_of_dataset': round((clean_count / n_evaluated) * 100.0, 2),
                'correct_count': clean_correct,
                'accuracy_percent': round(clean_accuracy_pct, 2) if clean_accuracy_pct is not None else None
            }
        }
    }

def print_confusion_matrix(title: str, cm: List[List[int]]):
    print(f"\n--- {title}: 10x10 Confusion Matrix (Rows: True, Cols: Pred) ---")
    headers = [f"c{i}" for i in range(10)]
    header_line = f"{'True Class':<18} | " + " ".join(f"{h:>4}" for h in headers) + " | Total"
    sep_line = "-" * len(header_line)
    print(header_line)
    print(sep_line)
    for i in range(10):
        row_str = " ".join(f"{cm[i][j]:>4}" for j in range(10))
        total_row = sum(cm[i])
        print(f"{SHORT_NAMES[i]:<18} | {row_str} | {total_row:>5}")
    print(sep_line)
    col_totals = [sum(cm[i][j] for i in range(10)) for j in range(10)]
    pred_row = " ".join(f"{col_totals[j]:>4}" for j in range(10))
    print(f"{'Pred Totals':<18} | {pred_row} | {sum(col_totals):>5}")

def print_dataset_summary(title: str, m: Dict[str, Any]):
    print(f"\n================================================================================")
    print(f" DATASET SUMMARY: {title}")
    print(f"================================================================================")
    print(f"Manifest Entries:     {m['manifest_entries']}")
    print(f"Usable Images:        {m['usable_images']}")
    print(f"Evaluated Images:     {m['evaluated_images']}")
    print(f"Exclusions:           {m['exclusion_count']}")
    print(f"Top-1 Accuracy:       {m['top1_accuracy_percent']:.2f}% ({m['top1_correct_count']}/{m['evaluated_images']})")
    print(f"Top-2 Accuracy:       {m['top2_accuracy_percent']:.2f}% ({m['top2_correct_count']}/{m['evaluated_images']})")

    conf = m['confidence_statistics']
    corr = conf['correct_predictions']
    inc = conf['incorrect_predictions']
    print(f"\nConfidence Distributions:")
    if corr['count'] > 0:
        print(f"  - Correct Predictions   (N={corr['count']:>3}): Mean = {corr['mean_percent']:>5.2f}% (Std: {corr['std_percent']:>5.2f}%, Range: {corr['min_percent']:.1f}% - {corr['max_percent']:.1f}%)")
    else:
        print(f"  - Correct Predictions   (N=  0): N/A")
    if inc['count'] > 0:
        print(f"  - Incorrect Predictions (N={inc['count']:>3}): Mean = {inc['mean_percent']:>5.2f}% (Std: {inc['std_percent']:>5.2f}%, Range: {inc['min_percent']:.1f}% - {inc['max_percent']:.1f}%)")
    else:
        print(f"  - Incorrect Predictions (N=  0): None (0 errors)")

    unc = m['uncertainty_evaluation']
    print(f"\nUncertainty Rule Evaluation (Conf < 60.0% OR Margin < 10.0 pp):")
    print(f"  - Flagged as Uncertain: {unc['flagged_count']} / {m['evaluated_images']} ({unc['flagged_percent']:.2f}%)")
    fb = unc['flag_breakdown']
    print(f"    * Weak confidence only: {fb['weak_confidence_only_count']}")
    print(f"    * Ambiguous margin only: {fb['ambig_only_count'] if 'ambig_only_count' in fb else fb.get('ambiguous_margin_only_count', 0)}")
    print(f"    * Both weak & ambiguous: {fb['both_reasons_count']}")

    ec = unc['error_interception_contingency']
    print(f"  - Warning vs Error Contingency:")
    print(f"    * Error Intercepted (Flagged & Incorrect):  {ec['true_positives_error_caught']}")
    print(f"    * False Alarm (Flagged & Correct):          {ec['false_positives_false_alarm']}")
    print(f"    * Silent Failure (Unflagged & Incorrect):   {ec['false_negatives_silent_error']}")
    print(f"    * Clean Confident (Unflagged & Correct):    {ec['true_negatives_clean_correct']}")
    if ec['error_interception_rate_percent'] is not None:
        print(f"    * Actual Error Interception Sensitivity:   {ec['error_interception_rate_percent']:.2f}% of incorrect predictions flagged")

    clean = unc['clean_subset_performance']
    print(f"\nPerformance on Unflagged Clean Subset:")
    print(f"  - Sample Count: {clean['sample_count']} ({clean['percentage_of_dataset']:.1f}% of evaluated images)")
    if clean['accuracy_percent'] is not None:
        print(f"  - Clean Accuracy: {clean['accuracy_percent']:.2f}% ({clean['correct_count']}/{clean['sample_count']})")
    else:
        print(f"  - Clean Accuracy: N/A (0 clean samples)")

    # Per-class table
    print(f"\nPer-Class Metrics:")
    print(f"{'Class':<18} | {'Support':>7} | {'TP':>4} | {'FP':>4} | {'FN':>4} | {'Precision':>9} | {'Recall':>9} | {'F1-Score':>9}")
    print("-" * 80)
    for p in m['per_class_metrics']:
        prec_str = f"{p['precision_percent']:>8.2f}%" if p['precision_percent'] is not None else "     N/A"
        rec_str = f"{p['recall_percent']:>8.2f}%" if p['recall_percent'] is not None else "     N/A"
        f1_str = f"{p['f1_score_percent']:>8.2f}%" if p['f1_score_percent'] is not None else "     N/A"
        print(f"{SHORT_NAMES[p['class_index']]:<18} | {p['support']:>7} | {p['true_positives']:>4} | {p['false_positives']:>4} | {p['false_negatives']:>4} | {prec_str} | {rec_str} | {f1_str}")

def run_benchmark():
    timestamp_start = datetime.now(timezone.utc).isoformat()
    print("=" * 80)
    print("AGRIVISION AI -- PHASE C, TASK 3.2: READ-ONLY BENCHMARK EVALUATION")
    print("=" * 80)
    print(f"Start Timestamp (UTC): {timestamp_start}")
    print(f"Evaluator Version:    {SCRIPT_VERSION}")
    print(f"Production Model:     {os.path.relpath(MODEL_PATH, REPO_ROOT)}")
    print(f"Benchmark Manifest:   {os.path.relpath(MANIFEST_PATH, REPO_ROOT)}")

    # 1. Pre-execution Hash Integrity Verification
    print("\n[Step 1/5] Pre-execution Cryptographic Hash Integrity Verification...")
    pre_tomato_hash = compute_sha256(MODEL_PATH)
    pre_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    pre_manifest_hash = compute_sha256(MANIFEST_PATH)

    print(f"  - tomato_mobilenetv3_v2.onnx SHA-256: {pre_tomato_hash}")
    print(f"  - yolo11n_leaf_v1_best.onnx   SHA-256: {pre_yolo_hash}")
    print(f"  - benchmark_manifest.json     SHA-256: {pre_manifest_hash}")

    # 2. Manifest Loading & Validation
    print("\n[Step 2/5] Loading Benchmark Manifest...")
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    manifest_records = manifest.get('records', [])
    total_manifest = len(manifest_records)
    print(f"  - Total entries listed in manifest: {total_manifest}")

    pv_entries = [r for r in manifest_records if r.get('dataset_source') == 'PlantVillage']
    pd_entries = [r for r in manifest_records if r.get('dataset_source') == 'PlantDoc']
    print(f"  - PlantVillage entries: {len(pv_entries)}")
    print(f"  - PlantDoc entries:     {len(pd_entries)}")

    # 3. Model Session Initialization (Read-Only)
    print("\n[Step 3/5] Initializing ONNX Runtime Session (Read-Only Mode)...")
    opts = ort.SessionOptions()
    opts.enable_mem_pattern = False
    opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    session = ort.InferenceSession(MODEL_PATH, sess_options=opts, providers=['CPUExecutionProvider'])

    inp = session.get_inputs()[0]
    out = session.get_outputs()[0]
    print(f"  - Provider:         {session.get_providers()[0]}")
    print(f"  - Input Node:       {inp.name} shape={inp.shape} type={inp.type}")
    print(f"  - Output Node:      {out.name} shape={out.shape} type={out.type}")

    # 4. Sequential Evaluation
    print("\n[Step 4/5] Running Sequential Evaluation on Benchmark Samples...")
    all_results: List[Dict[str, Any]] = []
    pv_results: List[Dict[str, Any]] = []
    pd_results: List[Dict[str, Any]] = []

    exclusions: Dict[str, List[Dict[str, Any]]] = {
        'PlantVillage': [],
        'PlantDoc': [],
        'Combined': []
    }

    t_eval_start = time.perf_counter()

    for idx, sample in enumerate(manifest_records):
        src = sample.get('dataset_source', 'Unknown')
        sample_id = sample.get('id', f'sample-{idx}')
        rel_path = sample.get('relative_path', '')

        try:
            res = evaluate_single_sample(session, sample)
            all_results.append(res)
            if src == 'PlantVillage':
                pv_results.append(res)
            elif src == 'PlantDoc':
                pd_results.append(res)
            else:
                exclusion_entry = {
                    'id': sample_id,
                    'relative_path': rel_path,
                    'reason': f"Unrecognized dataset source: {src}"
                }
                exclusions['Combined'].append(exclusion_entry)
        except Exception as e:
            exclusion_entry = {
                'id': sample_id,
                'relative_path': rel_path,
                'dataset_source': src,
                'reason': f"Inference/loading error: {str(e)}"
            }
            exclusions['Combined'].append(exclusion_entry)
            if src in exclusions:
                exclusions[src].append(exclusion_entry)
            print(f"  [EXCLUSION] Sample {sample_id} excluded: {str(e)}")

        if (idx + 1) % 40 == 0 or (idx + 1) == total_manifest:
            print(f"  - Processed {idx + 1}/{total_manifest} images...")

    eval_duration_sec = time.perf_counter() - t_eval_start
    print(f"  Completed evaluation of {len(all_results)} images in {eval_duration_sec:.2f}s")

    # Compute Metrics Separately
    pv_metrics = calculate_dataset_metrics(pv_results, len(pv_entries), exclusions['PlantVillage'])
    pd_metrics = calculate_dataset_metrics(pd_results, len(pd_entries), exclusions['PlantDoc'])
    combined_metrics = calculate_dataset_metrics(all_results, total_manifest, exclusions['Combined'])

    # Print Full Diagnostic Reports
    print_dataset_summary("PlantVillage (Laboratory Benchmark)", pv_metrics)
    print_confusion_matrix("PlantVillage", pv_metrics['confusion_matrix'])

    print_dataset_summary("PlantDoc (In-Field Benchmark)", pd_metrics)
    print_confusion_matrix("PlantDoc", pd_metrics['confusion_matrix'])

    print_dataset_summary("Combined Benchmark (PlantVillage + PlantDoc)", combined_metrics)
    print_confusion_matrix("Combined Benchmark", combined_metrics['confusion_matrix'])

    # 5. Post-execution Hash Integrity Verification
    print("\n[Step 5/5] Post-execution Cryptographic Hash Integrity Verification...")
    post_tomato_hash = compute_sha256(MODEL_PATH)
    post_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    post_manifest_hash = compute_sha256(MANIFEST_PATH)

    print(f"  - Post tomato_mobilenetv3_v2.onnx SHA-256: {post_tomato_hash}")
    print(f"  - Post yolo11n_leaf_v1_best.onnx   SHA-256: {post_yolo_hash}")
    print(f"  - Post benchmark_manifest.json     SHA-256: {post_manifest_hash}")

    assert pre_tomato_hash == post_tomato_hash, "INTEGRITY CRITICAL FAILURE: tomato ONNX model hash changed!"
    assert pre_yolo_hash == post_yolo_hash, "INTEGRITY CRITICAL FAILURE: yolo ONNX model hash changed!"
    assert pre_manifest_hash == post_manifest_hash, "INTEGRITY CRITICAL FAILURE: benchmark manifest hash changed!"

    print("  [OK] Verification confirmed: ALL models and manifest are BITWISE UNMODIFIED.")

    timestamp_end = datetime.now(timezone.utc).isoformat()

    # Save Machine-Readable Artifacts
    os.makedirs(RESULTS_DIR, exist_ok=True)

    summary_output = {
        'meta': {
            'script_version': SCRIPT_VERSION,
            'timestamp_start_utc': timestamp_start,
            'timestamp_end_utc': timestamp_end,
            'evaluation_duration_seconds': round(eval_duration_sec, 2),
            'model_evaluated': 'tomato_mobilenetv3_v2.onnx',
            'model_sha256': pre_tomato_hash,
            'yolo_companion_sha256': pre_yolo_hash,
            'manifest_sha256': pre_manifest_hash,
            'hashes_verified_unchanged': True,
            'preprocessing_configuration': {
                'resize_method': 'aspect_preserving_center_crop',
                'target_width': 224,
                'target_height': 224,
                'interpolation': 'BILINEAR',
                'channel_order': 'RGB',
                'normalization_mean': [0.485, 0.456, 0.406],
                'normalization_std': [0.229, 0.224, 0.225],
                'tensor_layout': 'NCHW [1, 3, 224, 224]'
            },
            'classes': TOMATO_CLASSES,
            'uncertainty_rules': {
                'confidence_threshold_percent': PROVISIONAL_CONFIDENCE_THRESHOLD,
                'margin_threshold_pp': PROVISIONAL_MARGIN_THRESHOLD
            }
        },
        'datasets': {
            'PlantVillage': pv_metrics,
            'PlantDoc': pd_metrics,
            'Combined': combined_metrics
        }
    }

    summary_file = os.path.join(RESULTS_DIR, 'benchmark_summary.json')
    summary_file_alt = os.path.join(RESULTS_DIR, 'summary_metrics.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary_output, f, indent=2)
    with open(summary_file_alt, 'w', encoding='utf-8') as f:
        json.dump(summary_output, f, indent=2)

    per_image_file = os.path.join(RESULTS_DIR, 'per_image_predictions.json')
    with open(per_image_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2)

    print(f"\nMachine-readable results saved to:")
    print(f"  - {os.path.relpath(summary_file, REPO_ROOT)}")
    print(f"  - {os.path.relpath(summary_file_alt, REPO_ROOT)}")
    print(f"  - {os.path.relpath(per_image_file, REPO_ROOT)}")

    return summary_output

if __name__ == '__main__':
    run_benchmark()
