"""
AgriVision AI — Segmentation Feasibility & Read-Only Evaluation (Phase C, Task 3.5)
==================================================================================
Evaluates whether genuine foreground segmentation inside YOLO-detected leaf crops
improves tomato disease classification by suppressing soil and background clutter.

Compares:
Method A: Existing YOLO leaf crop (without segmentation).
Method B: YOLO leaf crop with foreground segmentation (GrabCut GMM mask + edge feathering,
          neutral studio background matching PlantVillage laboratory conditions).

Strict Restrictions Enforced:
- No weights, thresholds, production code, or benchmark data modified.
- Evaluates both PlantVillage (N=100) and PlantDoc (N=63) separately.
- Segmentation failures recorded explicitly and counted in the denominator.
- Hashes verified before and after execution.
- Machine-readable results saved to data/benchmark/results/.
"""

import os
import sys
import json
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import cv2
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

# Exact 10 tomato disease classes matching classMapper.ts
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
    "0:BactSpot", "1:EarlyBlight", "2:LateBlight", "3:LeafMold", "4:Septoria",
    "5:SpiderMite", "6:TargetSpot", "7:TYLCV", "8:ToMV", "9:Healthy"
]

PROVISIONAL_CONFIDENCE_THRESHOLD = 60.0  # %
PROVISIONAL_MARGIN_THRESHOLD = 10.0      # pp
YOLO_CONFIDENCE_THRESHOLD = 0.25

def compute_sha256(file_path: str) -> str:
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def compute_softmax(logits: np.ndarray) -> np.ndarray:
    max_logit = np.max(logits)
    exp_logits = np.exp(logits - max_logit)
    sum_exp = np.sum(exp_logits)
    if sum_exp == 0 or not np.isfinite(sum_exp):
        return np.full_like(logits, 1.0 / len(logits))
    return exp_logits / sum_exp

def run_yolo_detection(yolo_session: ort.InferenceSession, img: Image.Image) -> Tuple[Optional[Image.Image], float, float, Optional[List[float]]]:
    """Runs YOLO11n detection and returns cropped leaf ROI."""
    t0 = time.perf_counter()
    w, h = img.size
    resized = img.resize((640, 640), Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32) / 255.0
    chw = np.transpose(arr, (2, 0, 1))
    tensor = np.expand_dims(chw, axis=0)

    input_name = yolo_session.get_inputs()[0].name
    output_name = yolo_session.get_outputs()[0].name
    out = yolo_session.run([output_name], {input_name: tensor})[0]

    boxes = out[0]
    valid_boxes = [b for b in boxes if int(round(b[5])) == 0 and float(b[4]) >= YOLO_CONFIDENCE_THRESHOLD]

    if not valid_boxes:
        dt = (time.perf_counter() - t0) * 1000.0
        return None, 0.0, dt, None

    valid_boxes.sort(key=lambda x: float(x[4]), reverse=True)
    top_b = valid_boxes[0]

    scale_x = w / 640.0
    scale_y = h / 640.0
    b640 = top_b[:4]
    cx1 = max(0.0, min(float(w), float(b640[0]) * scale_x))
    cy1 = max(0.0, min(float(h), float(b640[1]) * scale_y))
    cx2 = max(0.0, min(float(w), float(b640[2]) * scale_x))
    cy2 = max(0.0, min(float(h), float(b640[3]) * scale_y))

    bw = max(16.0, cx2 - cx1)
    bh = max(16.0, cy2 - cy1)
    crop_coords = [round(cx1, 1), round(cy1, 1), round(cx1 + bw, 1), round(cy1 + bh, 1)]

    cropped = img.crop((cx1, cy1, cx1 + bw, cy1 + bh))
    dt = (time.perf_counter() - t0) * 1000.0
    return cropped, float(top_b[4]), dt, crop_coords

def generate_foreground_mask(crop_im: Image.Image, neutral_bg_rgb=(0, 0, 0)) -> Tuple[Image.Image, bool, float, float, Optional[str]]:
    """
    Lightweight, deterministic foreground segmentation:
    Uses Gaussian Mixture Model GrabCut inside the YOLO crop with edge feathering.
    Replaces non-leaf background with neutral studio tone matching PlantVillage laboratory background.
    """
    t0 = time.perf_counter()
    bgr = cv2.cvtColor(np.array(crop_im), cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]

    if h < 16 or w < 16:
        dt = (time.perf_counter() - t0) * 1000.0
        return crop_im, False, 1.0, dt, "Crop dimensions smaller than 16px minimum"

    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    margin = max(2, min(4, min(w, h) // 10))
    rect = (margin, margin, max(1, w - 2 * margin), max(1, h - 2 * margin))

    try:
        cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, 2, cv2.GC_INIT_WITH_RECT)
        fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype('uint8')
        fg_ratio = float(np.mean(fg_mask))

        # Check for degenerate masks (too small <5% or failed isolation >98%)
        if fg_ratio < 0.05:
            dt = (time.perf_counter() - t0) * 1000.0
            return crop_im, False, fg_ratio, dt, f"Degenerate mask: foreground ratio too small ({fg_ratio*100:.1f}% < 5%)"
        if fg_ratio > 0.98:
            dt = (time.perf_counter() - t0) * 1000.0
            return crop_im, False, fg_ratio, dt, f"Degenerate mask: no background isolated ({fg_ratio*100:.1f}% > 98%)"

        # Edge feathering: 5x5 Gaussian blur on mask to reduce high-frequency boundary artifacts
        feathered = cv2.GaussianBlur(fg_mask.astype(np.float32), (5, 5), 1.0)
        feathered = feathered[:, :, np.newaxis]

        bg_bgr = np.array([neutral_bg_rgb[2], neutral_bg_rgb[1], neutral_bg_rgb[0]], dtype=np.float32)
        composite = (bgr.astype(np.float32) * feathered + bg_bgr * (1.0 - feathered)).astype(np.uint8)

        masked_img = Image.fromarray(cv2.cvtColor(composite, cv2.COLOR_BGR2RGB))
        dt = (time.perf_counter() - t0) * 1000.0
        return masked_img, True, fg_ratio, dt, None

    except Exception as e:
        dt = (time.perf_counter() - t0) * 1000.0
        return crop_im, False, 1.0, dt, f"Segmentation exception: {str(e)}"

def preprocess_classifier_tensor(img: Image.Image, target_w=224, target_h=224) -> np.ndarray:
    src_w, src_h = img.size
    src_aspect = src_w / src_h
    target_aspect = target_w / target_h

    if src_aspect > target_aspect:
        sw = src_h * target_aspect
        sh = src_h
        sx = (src_w - sw) / 2.0
        sy = 0.0
    else:
        sw = src_w
        sh = src_w / target_aspect
        sx = 0.0
        sy = (src_h - sh) / 2.0

    box = (sx, sy, sx + sw, sy + sh)
    cropped = img.crop(box)
    resized = cropped.resize((target_w, target_h), Image.Resampling.BILINEAR)

    arr = np.array(resized, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (arr - mean) / std
    chw = np.transpose(norm, (2, 0, 1))
    return np.expand_dims(chw, axis=0)

def classify_tensor(cls_session: ort.InferenceSession, tensor: np.ndarray) -> Tuple[int, int, float, float, float, bool, float]:
    t0 = time.perf_counter()
    input_name = cls_session.get_inputs()[0].name
    output_name = cls_session.get_outputs()[0].name
    out = cls_session.run([output_name], {input_name: tensor})[0]
    dt = (time.perf_counter() - t0) * 1000.0

    logits = out[0].astype(float)
    probs = compute_softmax(logits)

    ranked = np.argsort(-probs)
    top_idx = int(ranked[0])
    second_idx = int(ranked[1])

    top_conf = round(float(probs[top_idx]) * 1000.0) / 10.0
    second_conf = round(float(probs[second_idx]) * 1000.0) / 10.0
    margin = round(max(0.0, top_conf - second_conf) * 10.0) / 10.0

    is_weak = top_conf < PROVISIONAL_CONFIDENCE_THRESHOLD
    is_ambig = margin < PROVISIONAL_MARGIN_THRESHOLD
    is_uncertain = is_weak or is_ambig

    return top_idx, second_idx, top_conf, second_conf, margin, is_uncertain, dt

def calculate_metrics(results: List[Dict[str, Any]], total_count: int) -> Dict[str, Any]:
    n_total = total_count
    n_success = sum(1 for r in results if not r['is_failure'])
    n_failures = sum(1 for r in results if r['is_failure'])

    top1_correct = sum(1 for r in results if r.get('is_top1_correct', False))
    top2_correct = sum(1 for r in results if r.get('is_top2_correct', False))

    top1_acc = (top1_correct / n_total) * 100.0 if n_total > 0 else 0.0
    top2_acc = (top2_correct / n_total) * 100.0 if n_total > 0 else 0.0

    # 10x10 Confusion Matrix
    cm = [[0 for _ in range(10)] for _ in range(10)]
    for r in results:
        t_idx = r['true_class_index']
        p_idx = r.get('predicted_class_index')
        if p_idx is not None and 0 <= p_idx <= 9:
            cm[t_idx][p_idx] += 1

    # Healthy metrics
    h_idx = 9
    h_support = sum(1 for r in results if r['true_class_index'] == h_idx)
    h_tp = sum(1 for r in results if r['true_class_index'] == h_idx and r.get('is_top1_correct', False))
    h_recall = (h_tp / h_support * 100.0) if h_support > 0 else 0.0
    h_false_alarms = sum(1 for r in results if r['true_class_index'] == h_idx and r.get('predicted_class_index') != h_idx)
    h_fp = sum(1 for r in results if r['true_class_index'] != h_idx and r.get('predicted_class_index') == h_idx)

    # Uncertainty
    flagged = sum(1 for r in results if r.get('is_uncertain', True))
    pct_flagged = (flagged / n_total * 100.0) if n_total > 0 else 0.0
    total_errors = n_total - top1_correct
    errors_caught = sum(1 for r in results if not r.get('is_top1_correct', False) and r.get('is_uncertain', True))
    interception_rate = (errors_caught / total_errors * 100.0) if total_errors > 0 else 0.0

    # Timing
    inference_times = [r['infer_time_ms'] for r in results if 'infer_time_ms' in r]
    avg_infer_time = float(np.mean(inference_times)) if inference_times else 0.0

    # Per-class metrics
    per_class = []
    for c in range(10):
        tp = cm[c][c]
        fp = sum(cm[i][c] for i in range(10) if i != c)
        fn = sum(cm[c][j] for j in range(10) if j != c)
        support = tp + fn
        prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else None
        rec = (tp / support * 100.0) if support > 0 else None
        f1 = (2 * prec * rec / (prec + rec)) if (prec is not None and rec is not None and (prec + rec) > 0) else (None if support == 0 else 0.0)
        per_class.append({
            'class_index': c,
            'class_name': CLASS_NAMES[c],
            'short_name': SHORT_NAMES[c],
            'support': support,
            'tp': tp,
            'fp': fp,
            'fn': fn,
            'precision': round(prec, 2) if prec is not None else None,
            'recall': round(rec, 2) if rec is not None else None,
            'f1': round(f1, 2) if f1 is not None else None
        })

    return {
        'total_samples': n_total,
        'successfully_processed': n_success,
        'failures_count': n_failures,
        'failure_rate_percent': round((n_failures / n_total) * 100.0, 2),
        'top1_correct': top1_correct,
        'top1_accuracy_percent': round(top1_acc, 2),
        'top2_correct': top2_correct,
        'top2_accuracy_percent': round(top2_acc, 2),
        'healthy_metrics': {
            'healthy_support': h_support,
            'healthy_tp': h_tp,
            'healthy_recall_percent': round(h_recall, 2),
            'healthy_to_disease_false_alarms': h_false_alarms,
            'disease_to_healthy_false_positives': h_fp
        },
        'uncertainty_metrics': {
            'flagged_count': flagged,
            'flagged_percent': round(pct_flagged, 2),
            'total_errors': total_errors,
            'errors_intercepted': errors_caught,
            'error_interception_rate_percent': round(interception_rate, 2)
        },
        'avg_inference_time_ms': round(avg_infer_time, 2),
        'per_class_metrics': per_class,
        'confusion_matrix': cm
    }

def run_evaluation():
    t_start = datetime.now(timezone.utc).isoformat()
    print("=" * 85)
    print("AGRIVISION AI -- PHASE C, TASK 3.5: SEGMENTATION FEASIBILITY & EVALUATION")
    print("=" * 85)
    print(f"Timestamp UTC:     {t_start}")
    print(f"Classifier Model:  public/models/tomato_mobilenetv3_v2.onnx")
    print(f"YOLO Detector:     public/models/yolo11n_leaf_v1_best.onnx")
    print(f"Manifest:          data/benchmark/benchmark_manifest.json")

    # Step 4 Integrity Pre-check
    print("\n[Step 1/5] Pre-execution Cryptographic Hash Integrity Verification...")
    pre_cls_hash = compute_sha256(MODEL_PATH)
    pre_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    pre_manifest_hash = compute_sha256(MANIFEST_PATH)

    print(f"  - MobileNetV3 ONNX: {pre_cls_hash}")
    print(f"  - YOLO11n ONNX:    {pre_yolo_hash}")
    print(f"  - Manifest SHA-256: {pre_manifest_hash}")

    # Load sessions
    cls_session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    yolo_session = ort.InferenceSession(YOLO_MODEL_PATH, providers=['CPUExecutionProvider'])

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    records = manifest['records']
    print(f"\n[Step 2/5] Running Comparative Evaluation on All {len(records)} Benchmark Samples...")

    all_comparison_records = []
    seg_fail_count = 0
    seg_times = []

    for idx, r in enumerate(records, 1):
        rel_path = r['relative_path']
        abs_path = os.path.join(REPO_ROOT, rel_path)
        im = Image.open(abs_path).convert('RGB')
        true_idx = r['mapped_class_index']

        # 1. YOLO Leaf Crop
        leaf_crop, yolo_conf, yolo_time_ms, yolo_coords = run_yolo_detection(yolo_session, im)
        yolo_failed = (leaf_crop is None)

        # Method A: Unsegmented YOLO Crop
        if not yolo_failed:
            tensor_a = preprocess_classifier_tensor(leaf_crop, 224, 224)
            top_a, sec_a, conf_a, sec_conf_a, margin_a, unc_a, inf_time_a = classify_tensor(cls_session, tensor_a)
            res_a = {
                'is_failure': False,
                'true_class_index': true_idx,
                'predicted_class_index': top_a,
                'predicted_class_name': CLASS_NAMES[top_a],
                'second_predicted_class_index': sec_a,
                'second_predicted_class_name': CLASS_NAMES[sec_a],
                'top_confidence_percent': conf_a,
                'second_confidence_percent': sec_conf_a,
                'top_margin_pp': margin_a,
                'is_top1_correct': bool(top_a == true_idx),
                'is_top2_correct': bool(true_idx in [top_a, sec_a]),
                'is_uncertain': unc_a,
                'infer_time_ms': round(inf_time_a, 2),
                'yolo_conf_percent': round(yolo_conf * 100.0, 1)
            }
        else:
            res_a = {
                'is_failure': True,
                'failure_reason': 'YOLO detection failed (conf < 0.25)',
                'true_class_index': true_idx,
                'predicted_class_index': None,
                'predicted_class_name': None,
                'top_confidence_percent': 0.0,
                'is_top1_correct': False,
                'is_top2_correct': False,
                'is_uncertain': True,
                'infer_time_ms': 0.0
            }

        # Method B: YOLO Crop with Foreground Mask
        if not yolo_failed:
            masked_crop, mask_ok, fg_ratio, seg_time_ms, mask_err = generate_foreground_mask(leaf_crop, neutral_bg_rgb=(0, 0, 0))
            seg_times.append(seg_time_ms)
            if not mask_ok:
                seg_fail_count += 1

            tensor_b = preprocess_classifier_tensor(masked_crop, 224, 224)
            top_b, sec_b, conf_b, sec_conf_b, margin_b, unc_b, inf_time_b = classify_tensor(cls_session, tensor_b)
            res_b = {
                'is_failure': False,
                'mask_applied_successfully': mask_ok,
                'mask_failure_reason': mask_err,
                'foreground_ratio': round(fg_ratio, 3),
                'seg_time_ms': round(seg_time_ms, 2),
                'true_class_index': true_idx,
                'predicted_class_index': top_b,
                'predicted_class_name': CLASS_NAMES[top_b],
                'second_predicted_class_index': sec_b,
                'second_predicted_class_name': CLASS_NAMES[sec_b],
                'top_confidence_percent': conf_b,
                'second_confidence_percent': sec_conf_b,
                'top_margin_pp': margin_b,
                'is_top1_correct': bool(top_b == true_idx),
                'is_top2_correct': bool(true_idx in [top_b, sec_b]),
                'is_uncertain': unc_b,
                'infer_time_ms': round(inf_time_b, 2)
            }
        else:
            res_b = {
                'is_failure': True,
                'failure_reason': 'YOLO detection failed (conf < 0.25)',
                'mask_applied_successfully': False,
                'true_class_index': true_idx,
                'predicted_class_index': None,
                'predicted_class_name': None,
                'top_confidence_percent': 0.0,
                'is_top1_correct': False,
                'is_top2_correct': False,
                'is_uncertain': True,
                'infer_time_ms': 0.0
            }

        all_comparison_records.append({
            'id': r['id'],
            'dataset_source': r['dataset_source'],
            'relative_path': r['relative_path'],
            'true_class_index': true_idx,
            'true_class_name': r['mapped_class_name'],
            'method_a_unsegmented': res_a,
            'method_b_segmented': res_b
        })

        if idx % 40 == 0 or idx == len(records):
            print(f"  - Evaluated {idx}/{len(records)} samples...")

    # Post-execution Hash Verification
    print("\n[Step 3/5] Post-execution Hash Integrity Verification...")
    post_cls_hash = compute_sha256(MODEL_PATH)
    post_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    post_manifest_hash = compute_sha256(MANIFEST_PATH)

    assert pre_cls_hash == post_cls_hash, "INTEGRITY CRITICAL: MobileNetV3 hash altered!"
    assert pre_yolo_hash == post_yolo_hash, "INTEGRITY CRITICAL: YOLO11n hash altered!"
    assert pre_manifest_hash == post_manifest_hash, "INTEGRITY CRITICAL: Manifest hash altered!"
    print("  [PASS] All model weights and benchmark files confirmed bitwise unchanged.")

    # Calculate metrics
    print("\n[Step 4/5] Computing Comparative Metrics...")
    pv_recs = [c for c in all_comparison_records if c['dataset_source'] == 'PlantVillage']
    pd_recs = [c for c in all_comparison_records if c['dataset_source'] == 'PlantDoc']

    summary = {
        'meta': {
            'script_version': SCRIPT_VERSION,
            'timestamp_utc': t_start,
            'classifier_hash': pre_cls_hash,
            'yolo_hash': pre_yolo_hash,
            'manifest_hash': pre_manifest_hash,
            'method_a': 'Unsegmented YOLO Crop (Bounding-Box ROI)',
            'method_b': 'Segmented YOLO Crop (GrabCut GMM Mask with edge feathering & studio black background [0,0,0])',
            'neutral_background_fill': 'RGB (0, 0, 0) matching PlantVillage dark laboratory background',
            'avg_segmentation_time_ms': round(float(np.mean(seg_times)), 2) if seg_times else 0.0,
            'mask_generation_failure_count': seg_fail_count,
            'mask_generation_failure_rate_percent': round((seg_fail_count / len(records)) * 100.0, 2)
        },
        'PlantVillage': {
            'Method_A_Unsegmented': calculate_metrics([c['method_a_unsegmented'] for c in pv_recs], len(pv_recs)),
            'Method_B_Segmented': calculate_metrics([c['method_b_segmented'] for c in pv_recs], len(pv_recs))
        },
        'PlantDoc': {
            'Method_A_Unsegmented': calculate_metrics([c['method_a_unsegmented'] for c in pd_recs], len(pd_recs)),
            'Method_B_Segmented': calculate_metrics([c['method_b_segmented'] for c in pd_recs], len(pd_recs))
        },
        'Combined': {
            'Method_A_Unsegmented': calculate_metrics([c['method_a_unsegmented'] for c in all_comparison_records], len(all_comparison_records)),
            'Method_B_Segmented': calculate_metrics([c['method_b_segmented'] for c in all_comparison_records], len(all_comparison_records))
        }
    }

    # Healthy PlantDoc comparison
    healthy_comp = [c for c in pd_recs if c['true_class_name'] == 'Tomato___healthy']
    healthy_table = []
    for h in healthy_comp:
        a = h['method_a_unsegmented']
        b = h['method_b_segmented']
        healthy_table.append({
            'id': h['id'],
            'path': h['relative_path'],
            'method_a_unsegmented': {
                'pred': a['predicted_class_name'],
                'conf': a['top_confidence_percent'],
                'correct': a['is_top1_correct'],
                'uncertain': a['is_uncertain']
            },
            'method_b_segmented': {
                'pred': b['predicted_class_name'],
                'conf': b['top_confidence_percent'],
                'correct': b['is_top1_correct'],
                'uncertain': b['is_uncertain'],
                'mask_applied': b['mask_applied_successfully'],
                'fg_ratio': b['foreground_ratio']
            }
        })
    summary['healthy_plantdoc_comparison'] = healthy_table

    # Save output artifacts
    os.makedirs(RESULTS_DIR, exist_ok=True)
    out_summary = os.path.join(RESULTS_DIR, 'segmentation_comparison.json')
    out_per_img = os.path.join(RESULTS_DIR, 'segmentation_per_image.json')

    with open(out_summary, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    with open(out_per_img, 'w', encoding='utf-8') as f:
        json.dump(all_comparison_records, f, indent=2)

    print(f"\n[Step 5/5] Output Artifacts Saved:")
    print(f"  - {os.path.relpath(out_summary, REPO_ROOT)}")
    print(f"  - {os.path.relpath(out_per_img, REPO_ROOT)}")

    # Print Comparative Diagnostic Tables
    print("\n" + "=" * 85)
    print("COMPARATIVE SUMMARY TABLE: PLANTDOC (IN-FIELD BENCHMARK, N=63)")
    print("=" * 85)
    pda = summary['PlantDoc']['Method_A_Unsegmented']
    pdb = summary['PlantDoc']['Method_B_Segmented']

    print(f"{'Metric':<38} | {'Method A (Unsegmented)':>22} | {'Method B (Segmented)':>20}")
    print("-" * 85)
    print(f"{'Total Evaluated Denominator':<38} | {pda['total_samples']:>22} | {pdb['total_samples']:>20}")
    print(f"{'Top-1 Correct Count':<38} | {pda['top1_correct']:>22} | {pdb['top1_correct']:>20}")
    print(f"{'Top-1 Accuracy':<38} | {pda['top1_accuracy_percent']:>21.2f}% | {pdb['top1_accuracy_percent']:>19.2f}%")
    print(f"{'Top-2 Correct Count':<38} | {pda['top2_correct']:>22} | {pdb['top2_correct']:>20}")
    print(f"{'Top-2 Accuracy':<38} | {pda['top2_accuracy_percent']:>21.2f}% | {pdb['top2_accuracy_percent']:>19.2f}%")
    print(f"{'Healthy Recall (N=8)':<38} | {pda['healthy_metrics']['healthy_recall_percent']:>21.2f}% | {pdb['healthy_metrics']['healthy_recall_percent']:>19.2f}%")
    print(f"{'Healthy False Alarms (as diseased)':<38} | {pda['healthy_metrics']['healthy_to_disease_false_alarms']:>22} | {pdb['healthy_metrics']['healthy_to_disease_false_alarms']:>20}")
    print(f"{'Disease -> Healthy False Positives':<38} | {pda['healthy_metrics']['disease_to_healthy_false_positives']:>22} | {pdb['healthy_metrics']['disease_to_healthy_false_positives']:>20}")
    print(f"{'Uncertainty Warning Rate':<38} | {pda['uncertainty_metrics']['flagged_percent']:>21.2f}% | {pdb['uncertainty_metrics']['flagged_percent']:>19.2f}%")
    print(f"{'Error Interception Rate':<38} | {pda['uncertainty_metrics']['error_interception_rate_percent']:>21.2f}% | {pdb['uncertainty_metrics']['error_interception_rate_percent']:>19.2f}%")
    print(f"{'Avg Inference Time per Image':<38} | {pda['avg_inference_time_ms']:>18.1f}ms | {pdb['avg_inference_time_ms']:>16.1f}ms")
    print(f"{'Avg Segmentation Time per Image':<38} | {'N/A':>22} | {summary['meta']['avg_segmentation_time_ms']:>16.1f}ms")

    print("\n" + "=" * 85)
    print("COMPARATIVE SUMMARY TABLE: PLANTVILLAGE (LAB BENCHMARK, N=100)")
    print("=" * 85)
    pva = summary['PlantVillage']['Method_A_Unsegmented']
    pvb = summary['PlantVillage']['Method_B_Segmented']
    print(f"{'Metric':<38} | {'Method A (Unsegmented)':>22} | {'Method B (Segmented)':>20}")
    print("-" * 85)
    print(f"{'Top-1 Accuracy':<38} | {pva['top1_accuracy_percent']:>21.2f}% | {pvb['top1_accuracy_percent']:>19.2f}%")
    print(f"{'Top-2 Accuracy':<38} | {pva['top2_accuracy_percent']:>21.2f}% | {pvb['top2_accuracy_percent']:>19.2f}%")
    print(f"{'Healthy Recall (N=10)':<38} | {pva['healthy_metrics']['healthy_recall_percent']:>21.2f}% | {pvb['healthy_metrics']['healthy_recall_percent']:>19.2f}%")

    return summary

if __name__ == '__main__':
    run_evaluation()
