"""
AgriVision AI — Read-Only Crop Pipeline Comparison (Phase C, Task 3.4)
=====================================================================
Evaluates and compares three preprocessing/inference paths on the standardized
benchmark dataset (PlantVillage + PlantDoc):

Method A: Standalone Center-Crop Baseline
          (Direct aspect-preserving center-crop to 224x224, ImageNet norm)
Method B: YOLO-Detected Leaf Crop + Classifier Preprocessing
          (YOLO11n leaf ROI extraction, then aspect-preserving center crop, 224x224, ImageNet norm)
Method C: Full Production Pipeline
          (Image Quality Validation -> YOLO11n Leaf Detection -> Mock SAM Pass-Through -> Classifier)

Strict Restrictions Enforced:
- No weights, thresholds, production code, or benchmark data modified.
- SAM verified as a pass-through mock (no genuine segmentation model exists).
- Detection and quality failures counted in the denominator (never silently skipped).
- SHA-256 hashes verified before and after execution.
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
PROVISIONAL_BLUR_THRESHOLD = 35.0
DEFAULT_MIN_BRIGHTNESS = 18
DEFAULT_MAX_BRIGHTNESS = 248
DEFAULT_MIN_CONTRAST = 5

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

def check_image_quality(img: Image.Image) -> Tuple[bool, List[str], Dict[str, float]]:
    """
    Exact replication of imageQualityCheck.ts logic:
    - 4-neighbor interior Laplacian variance for blur (threshold: >= 35.0)
    - Mean luminance [18, 248]
    - Luminance stddev >= 5.0
    """
    w, h = img.size
    gray = np.array(img.convert('L'))
    
    if w < 3 or h < 3:
        return False, ["Image too small for convolution"], {'blur': 0.0, 'brightness': 0.0, 'contrast': 0.0}

    num_interior = (w - 2) * (h - 2)
    if num_interior <= 0:
        return False, ["Empty interior region"], {'blur': 0.0, 'brightness': 0.0, 'contrast': 0.0}

    gray_f = gray.astype(np.float64)
    # interior 4-neighbor laplacian
    lap = -4.0 * gray_f[1:-1, 1:-1] + gray_f[:-2, 1:-1] + gray_f[2:, 1:-1] + gray_f[1:-1, :-2] + gray_f[1:-1, 2:]
    blur_score = float(np.var(lap))
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    issues = []
    if blur_score < PROVISIONAL_BLUR_THRESHOLD:
        issues.append(f"Blurry image (Laplacian variance {blur_score:.1f} < {PROVISIONAL_BLUR_THRESHOLD})")
    if brightness < DEFAULT_MIN_BRIGHTNESS:
        issues.append(f"Underexposed (Brightness {brightness:.1f} < {DEFAULT_MIN_BRIGHTNESS})")
    elif brightness > DEFAULT_MAX_BRIGHTNESS:
        issues.append(f"Overexposed (Brightness {brightness:.1f} > {DEFAULT_MAX_BRIGHTNESS})")
    if contrast < DEFAULT_MIN_CONTRAST:
        issues.append(f"Low contrast (Stddev {contrast:.1f} < {DEFAULT_MIN_CONTRAST})")

    is_suitable = len(issues) == 0
    return is_suitable, issues, {'blur': round(blur_score, 1), 'brightness': round(brightness, 1), 'contrast': round(contrast, 1)}

def run_yolo_detection(yolo_session: ort.InferenceSession, img: Image.Image) -> Tuple[Optional[Tuple[float, float, float, float]], float, List[Dict[str, Any]]]:
    """
    Exact replication of leafDetectionService.ts:
    1. Direct resize to 640x640, RGB, normalize by / 255.0.
    2. Input 'images' [1, 3, 640, 640].
    3. Output 'output0' [1, 300, 6] -> [x1, y1, x2, y2, confidence, classId].
    4. Filter cls == 0, conf >= 0.25.
    5. Convert back to original image dimensions.
    """
    w, h = img.size
    resized = img.resize((640, 640), Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32) / 255.0
    chw = np.transpose(arr, (2, 0, 1))
    tensor = np.expand_dims(chw, axis=0)

    input_name = yolo_session.get_inputs()[0].name
    output_name = yolo_session.get_outputs()[0].name
    out = yolo_session.run([output_name], {input_name: tensor})[0]

    boxes = out[0]  # shape: [300, 6]
    valid_boxes = []

    for b in boxes:
        cls_id = int(round(b[5]))
        conf = float(b[4])
        if cls_id == 0 and conf >= YOLO_CONFIDENCE_THRESHOLD:
            valid_boxes.append({
                'box_640': [float(b[0]), float(b[1]), float(b[2]), float(b[3])],
                'confidence': conf,
                'class_id': cls_id
            })

    if not valid_boxes:
        return None, 0.0, []

    # Sort descending by confidence
    valid_boxes.sort(key=lambda x: x['confidence'], reverse=True)
    top_box = valid_boxes[0]

    scale_x = w / 640.0
    scale_y = h / 640.0

    b640 = top_box['box_640']
    clamped_x1 = max(0.0, min(float(w), b640[0] * scale_x))
    clamped_y1 = max(0.0, min(float(h), b640[1] * scale_y))
    clamped_x2 = max(0.0, min(float(w), b640[2] * scale_x))
    clamped_y2 = max(0.0, min(float(h), b640[3] * scale_y))

    # Box width and height minimum 16px matching imageUtils.ts
    box_w = max(16.0, clamped_x2 - clamped_x1)
    box_h = max(16.0, clamped_y2 - clamped_y1)

    crop_coords = (clamped_x1, clamped_y1, clamped_x1 + box_w, clamped_y1 + box_h)
    return crop_coords, top_box['confidence'], valid_boxes

def preprocess_classifier_tensor(img: Image.Image, target_w=224, target_h=224) -> np.ndarray:
    """
    Exact replication of imagePreprocessor.ts:
    1. Aspect-preserving square center-crop of the input image.
    2. Resized to target_w x target_h.
    3. ImageNet mean/std normalization.
    4. NCHW Float32 tensor [1, 3, 224, 224].
    """
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

def run_classifier_inference(cls_session: ort.InferenceSession, tensor: np.ndarray) -> Tuple[int, int, float, float, float, bool, List[float]]:
    input_name = cls_session.get_inputs()[0].name
    output_name = cls_session.get_outputs()[0].name
    out = cls_session.run([output_name], {input_name: tensor})[0]
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

    return top_idx, second_idx, top_conf, second_conf, margin, is_uncertain, logits.tolist()

def evaluate_method_a(sample: Dict[str, Any], cls_session: ort.InferenceSession) -> Dict[str, Any]:
    """Method A: Existing Center-Crop Baseline"""
    path = os.path.join(REPO_ROOT, sample['relative_path'])
    im = Image.open(path).convert('RGB')
    tensor = preprocess_classifier_tensor(im, 224, 224)
    top_idx, second_idx, top_conf, second_conf, margin, is_uncertain, logits = run_classifier_inference(cls_session, tensor)
    true_idx = sample['mapped_class_index']

    return {
        'status': 'success',
        'is_failure': False,
        'failure_stage': None,
        'failure_reason': None,
        'true_class_index': true_idx,
        'predicted_class_index': top_idx,
        'predicted_class_name': CLASS_NAMES[top_idx],
        'second_predicted_class_index': second_idx,
        'second_predicted_class_name': CLASS_NAMES[second_idx],
        'top_confidence_percent': top_conf,
        'second_confidence_percent': second_conf,
        'top_margin_pp': margin,
        'is_top1_correct': bool(top_idx == true_idx),
        'is_top2_correct': bool(true_idx in [top_idx, second_idx]),
        'is_uncertain': is_uncertain
    }

def evaluate_method_b(sample: Dict[str, Any], yolo_session: ort.InferenceSession, cls_session: ort.InferenceSession) -> Dict[str, Any]:
    """Method B: YOLO-detected Leaf Crop + Classifier Preprocessing"""
    path = os.path.join(REPO_ROOT, sample['relative_path'])
    im = Image.open(path).convert('RGB')
    crop_coords, yolo_conf, all_boxes = run_yolo_detection(yolo_session, im)

    true_idx = sample['mapped_class_index']

    if crop_coords is None:
        return {
            'status': 'failed',
            'is_failure': True,
            'failure_stage': 'detection',
            'failure_reason': f'No leaf detected by YOLO11n (confidence < {YOLO_CONFIDENCE_THRESHOLD})',
            'true_class_index': true_idx,
            'predicted_class_index': None,
            'predicted_class_name': None,
            'second_predicted_class_index': None,
            'second_predicted_class_name': None,
            'top_confidence_percent': 0.0,
            'second_confidence_percent': 0.0,
            'top_margin_pp': 0.0,
            'is_top1_correct': False,
            'is_top2_correct': False,
            'is_uncertain': True,
            'yolo_confidence': 0.0,
            'yolo_crop_coords': None
        }

    leaf_crop = im.crop(crop_coords)
    tensor = preprocess_classifier_tensor(leaf_crop, 224, 224)
    top_idx, second_idx, top_conf, second_conf, margin, is_uncertain, logits = run_classifier_inference(cls_session, tensor)

    return {
        'status': 'success',
        'is_failure': False,
        'failure_stage': None,
        'failure_reason': None,
        'true_class_index': true_idx,
        'predicted_class_index': top_idx,
        'predicted_class_name': CLASS_NAMES[top_idx],
        'second_predicted_class_index': second_idx,
        'second_predicted_class_name': CLASS_NAMES[second_idx],
        'top_confidence_percent': top_conf,
        'second_confidence_percent': second_conf,
        'top_margin_pp': margin,
        'is_top1_correct': bool(top_idx == true_idx),
        'is_top2_correct': bool(true_idx in [top_idx, second_idx]),
        'is_uncertain': is_uncertain,
        'yolo_confidence': round(yolo_conf * 100.0, 1),
        'yolo_crop_coords': [round(x, 1) for x in crop_coords]
    }

def evaluate_method_c(sample: Dict[str, Any], yolo_session: ort.InferenceSession, cls_session: ort.InferenceSession) -> Dict[str, Any]:
    """
    Method C: Full Production Pipeline
    1. Image Quality Check (Laplacian blur variance >= 35.0, Brightness in [18, 248], Contrast >= 5)
    2. YOLO11n Leaf Detection & ROI
    3. SAM Leaf Segmentation (Verified as PassThroughLeafSegmenter mock)
    4. MobileNetV3 Classifier
    """
    path = os.path.join(REPO_ROOT, sample['relative_path'])
    im = Image.open(path).convert('RGB')
    true_idx = sample['mapped_class_index']

    # Stage 1: Quality Check
    is_suitable, issues, qstats = check_image_quality(im)
    if not is_suitable:
        return {
            'status': 'rejected',
            'is_failure': True,
            'failure_stage': 'quality_check',
            'failure_reason': "; ".join(issues),
            'true_class_index': true_idx,
            'predicted_class_index': None,
            'predicted_class_name': None,
            'second_predicted_class_index': None,
            'second_predicted_class_name': None,
            'top_confidence_percent': 0.0,
            'second_confidence_percent': 0.0,
            'top_margin_pp': 0.0,
            'is_top1_correct': False,
            'is_top2_correct': False,
            'is_uncertain': True,
            'quality_stats': qstats
        }

    # Stage 2: YOLO Detection
    crop_coords, yolo_conf, all_boxes = run_yolo_detection(yolo_session, im)
    if crop_coords is None:
        return {
            'status': 'failed',
            'is_failure': True,
            'failure_stage': 'detection',
            'failure_reason': f'No leaf detected by YOLO11n (confidence < {YOLO_CONFIDENCE_THRESHOLD})',
            'true_class_index': true_idx,
            'predicted_class_index': None,
            'predicted_class_name': None,
            'second_predicted_class_index': None,
            'second_predicted_class_name': None,
            'top_confidence_percent': 0.0,
            'second_confidence_percent': 0.0,
            'top_margin_pp': 0.0,
            'is_top1_correct': False,
            'is_top2_correct': False,
            'is_uncertain': True,
            'quality_stats': qstats,
            'yolo_confidence': 0.0,
            'yolo_crop_coords': None
        }

    # Stage 3: PassThrough SAM Segmenter
    # Verified in leafSegmentationService.ts as:
    # return { detectionId, isolatedLeafImageUrl: detection.croppedImageUrl || imageDataUrl, areaRatio: 0.85 }
    leaf_crop = im.crop(crop_coords)

    # Stage 4: Classifier
    tensor = preprocess_classifier_tensor(leaf_crop, 224, 224)
    top_idx, second_idx, top_conf, second_conf, margin, is_uncertain, logits = run_classifier_inference(cls_session, tensor)

    return {
        'status': 'success',
        'is_failure': False,
        'failure_stage': None,
        'failure_reason': None,
        'true_class_index': true_idx,
        'predicted_class_index': top_idx,
        'predicted_class_name': CLASS_NAMES[top_idx],
        'second_predicted_class_index': second_idx,
        'second_predicted_class_name': CLASS_NAMES[second_idx],
        'top_confidence_percent': top_conf,
        'second_confidence_percent': second_conf,
        'top_margin_pp': margin,
        'is_top1_correct': bool(top_idx == true_idx),
        'is_top2_correct': bool(true_idx in [top_idx, second_idx]),
        'is_uncertain': is_uncertain,
        'quality_stats': qstats,
        'yolo_confidence': round(yolo_conf * 100.0, 1),
        'yolo_crop_coords': [round(x, 1) for x in crop_coords],
        'segmentation_verified_type': 'PassThroughMock'
    }

def calculate_method_metrics(results: List[Dict[str, Any]], total_count: int) -> Dict[str, Any]:
    n_total = total_count
    n_success = sum(1 for r in results if not r['is_failure'])
    n_failures = sum(1 for r in results if r['is_failure'])

    # Failures count as incorrect in total denominator
    top1_correct = sum(1 for r in results if r.get('is_top1_correct', False))
    top2_correct = sum(1 for r in results if r.get('is_top2_correct', False))

    top1_acc = (top1_correct / n_total) * 100.0 if n_total > 0 else 0.0
    top2_acc = (top2_correct / n_total) * 100.0 if n_total > 0 else 0.0

    # 10x10 Confusion Matrix (failures placed in unclassified/failed column or mapped)
    cm = [[0 for _ in range(10)] for _ in range(10)]
    for r in results:
        t_idx = r['true_class_index']
        p_idx = r.get('predicted_class_index')
        if p_idx is not None and 0 <= p_idx <= 9:
            cm[t_idx][p_idx] += 1

    # Healthy class recall & Healthy false positives
    healthy_idx = 9
    healthy_support = sum(1 for r in results if r['true_class_index'] == healthy_idx)
    healthy_tp = sum(1 for r in results if r['true_class_index'] == healthy_idx and r.get('is_top1_correct', False))
    healthy_recall = (healthy_tp / healthy_support * 100.0) if healthy_support > 0 else 0.0

    # Healthy false positives (true != healthy but predicted == healthy)
    healthy_fp = sum(1 for r in results if r['true_class_index'] != healthy_idx and r.get('predicted_class_index') == healthy_idx)

    # Healthy-as-diseased false alarms (true == healthy but predicted == diseased)
    healthy_as_diseased = sum(1 for r in results if r['true_class_index'] == healthy_idx and r.get('predicted_class_index') != healthy_idx and r.get('predicted_class_index') is not None)

    # Uncertainty evaluation
    flagged_count = sum(1 for r in results if r.get('is_uncertain', True))
    pct_flagged = (flagged_count / n_total) * 100.0 if n_total > 0 else 0.0

    # Error interception rate: % of actual errors intercepted by uncertainty rule
    total_errors = n_total - top1_correct
    errors_intercepted = sum(1 for r in results if not r.get('is_top1_correct', False) and r.get('is_uncertain', True))
    error_interception_rate = (errors_intercepted / total_errors * 100.0) if total_errors > 0 else 0.0

    # Per-class metrics
    per_class = []
    for c in range(10):
        tp = cm[c][c]
        fp = sum(cm[i][c] for i in range(10) if i != c)
        fn = sum(cm[c][j] for j in range(10) if j != c)
        # Note: if sample was rejected in quality, fn includes that failure
        unclassified_failures = sum(1 for r in results if r['true_class_index'] == c and r.get('is_failure', False))
        fn += unclassified_failures
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
            'healthy_support': healthy_support,
            'healthy_tp': healthy_tp,
            'healthy_recall_percent': round(healthy_recall, 2),
            'healthy_to_disease_false_alarms': healthy_as_diseased,
            'disease_to_healthy_false_positives': healthy_fp
        },
        'uncertainty_metrics': {
            'flagged_count': flagged_count,
            'flagged_percent': round(pct_flagged, 2),
            'total_errors': total_errors,
            'errors_intercepted': errors_intercepted,
            'error_interception_rate_percent': round(error_interception_rate, 2)
        },
        'per_class_metrics': per_class,
        'confusion_matrix': cm
    }

def run_comparison():
    t_start = datetime.now(timezone.utc).isoformat()
    print("=" * 85)
    print("AGRIVISION AI -- PHASE C, TASK 3.4: READ-ONLY CROP PIPELINE COMPARISON")
    print("=" * 85)
    print(f"Timestamp UTC:     {t_start}")
    print(f"Classifier Model:  public/models/tomato_mobilenetv3_v2.onnx")
    print(f"YOLO Detector:     public/models/yolo11n_leaf_v1_best.onnx")
    print(f"Manifest:          data/benchmark/benchmark_manifest.json")

    # Step 4 Integrity Pre-check
    print("\n[Step 1/5] Pre-execution Hash Integrity Verification...")
    pre_cls_hash = compute_sha256(MODEL_PATH)
    pre_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    pre_manifest_hash = compute_sha256(MANIFEST_PATH)

    print(f"  - MobileNetV3 ONNX: {pre_cls_hash}")
    print(f"  - YOLO11n ONNX:    {pre_yolo_hash}")
    print(f"  - Manifest SHA-256: {pre_manifest_hash}")

    # Load sessions
    print("\n[Step 2/5] Initializing ONNX Sessions (Read-Only Mode)...")
    cls_session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    yolo_session = ort.InferenceSession(YOLO_MODEL_PATH, providers=['CPUExecutionProvider'])

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    records = manifest['records']
    pv_records = [r for r in records if r['dataset_source'] == 'PlantVillage']
    pd_records = [r for r in records if r['dataset_source'] == 'PlantDoc']
    print(f"  Total Benchmark: {len(records)} (PlantVillage: {len(pv_records)}, PlantDoc: {len(pd_records)})")

    # Run evaluations
    print("\n[Step 3/5] Processing All 163 Samples through Available Pipelines...")
    comparison_records = []

    for idx, r in enumerate(records, 1):
        res_a = evaluate_method_a(r, cls_session)
        res_b = evaluate_method_b(r, yolo_session, cls_session)
        res_c = evaluate_method_c(r, yolo_session, cls_session)

        comparison_records.append({
            'id': r['id'],
            'dataset_source': r['dataset_source'],
            'relative_path': r['relative_path'],
            'true_class_index': r['mapped_class_index'],
            'true_class_name': r['mapped_class_name'],
            'method_a_center_crop': res_a,
            'method_b_yolo_crop': res_b,
            'method_c_production_pipeline': res_c
        })
        if idx % 40 == 0 or idx == len(records):
            print(f"  - Completed sample {idx}/{len(records)}...")

    # Post integrity check
    print("\n[Step 4/5] Post-execution Hash Integrity Verification...")
    post_cls_hash = compute_sha256(MODEL_PATH)
    post_yolo_hash = compute_sha256(YOLO_MODEL_PATH)
    post_manifest_hash = compute_sha256(MANIFEST_PATH)

    assert pre_cls_hash == post_cls_hash, "INTEGRITY CRITICAL: MobileNetV3 hash altered!"
    assert pre_yolo_hash == post_yolo_hash, "INTEGRITY CRITICAL: YOLO11n hash altered!"
    assert pre_manifest_hash == post_manifest_hash, "INTEGRITY CRITICAL: Manifest hash altered!"
    print("  [PASS] All model weights and benchmark files confirmed bitwise unchanged.")

    # Compute metrics per dataset and method
    print("\n[Step 5/5] Computing Multi-Pipeline Comparative Metrics...")

    pv_recs = [c for c in comparison_records if c['dataset_source'] == 'PlantVillage']
    pd_recs = [c for c in comparison_records if c['dataset_source'] == 'PlantDoc']

    summary = {
        'meta': {
            'script_version': SCRIPT_VERSION,
            'timestamp_utc': t_start,
            'classifier_hash': pre_cls_hash,
            'yolo_hash': pre_yolo_hash,
            'manifest_hash': pre_manifest_hash,
            'methods_evaluated': {
                'Method_A': 'Center-crop baseline (224x224 square crop, ImageNet norm)',
                'Method_B': 'YOLO11n-detected leaf crop (clamped ROI, 224x224 square crop, ImageNet norm)',
                'Method_C': 'Production Pipeline (Quality Check -> YOLO11n -> PassThrough SAM -> MobileNetV3)'
            },
            'sam_segmentation_status': 'PassThrough Mock (PassThroughLeafSegmenter; no active SAM model in repo)'
        },
        'PlantVillage': {
            'Method_A': calculate_method_metrics([c['method_a_center_crop'] for c in pv_recs], len(pv_recs)),
            'Method_B': calculate_method_metrics([c['method_b_yolo_crop'] for c in pv_recs], len(pv_recs)),
            'Method_C': calculate_method_metrics([c['method_c_production_pipeline'] for c in pv_recs], len(pv_recs))
        },
        'PlantDoc': {
            'Method_A': calculate_method_metrics([c['method_a_center_crop'] for c in pd_recs], len(pd_recs)),
            'Method_B': calculate_method_metrics([c['method_b_yolo_crop'] for c in pd_recs], len(pd_recs)),
            'Method_C': calculate_method_metrics([c['method_c_production_pipeline'] for c in pd_recs], len(pd_recs))
        },
        'Combined': {
            'Method_A': calculate_method_metrics([c['method_a_center_crop'] for c in comparison_records], len(comparison_records)),
            'Method_B': calculate_method_metrics([c['method_b_yolo_crop'] for c in comparison_records], len(comparison_records)),
            'Method_C': calculate_method_metrics([c['method_c_production_pipeline'] for c in comparison_records], len(comparison_records))
        }
    }

    # Extract Healthy PlantDoc samples comparison
    healthy_pd_comp = [c for c in pd_recs if c['true_class_name'] == 'Tomato___healthy']
    healthy_table = []
    for h in healthy_pd_comp:
        a = h['method_a_center_crop']
        b = h['method_b_yolo_crop']
        c = h['method_c_production_pipeline']
        healthy_table.append({
            'id': h['id'],
            'path': h['relative_path'],
            'method_a': {
                'pred': a['predicted_class_name'],
                'conf': a['top_confidence_percent'],
                'correct': a['is_top1_correct'],
                'uncertain': a['is_uncertain']
            },
            'method_b': {
                'pred': b['predicted_class_name'],
                'conf': b['top_confidence_percent'],
                'correct': b['is_top1_correct'],
                'uncertain': b['is_uncertain'],
                'yolo_conf': b.get('yolo_confidence')
            },
            'method_c': {
                'status': c['status'],
                'pred': c.get('predicted_class_name'),
                'conf': c.get('top_confidence_percent', 0.0),
                'correct': c.get('is_top1_correct', False),
                'failure_reason': c.get('failure_reason')
            }
        })
    summary['healthy_plantdoc_comparison'] = healthy_table

    # Save output artifacts
    out_summary = os.path.join(RESULTS_DIR, 'crop_pipeline_comparison.json')
    out_per_img = os.path.join(RESULTS_DIR, 'pipeline_comparison_per_image.json')

    with open(out_summary, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    with open(out_per_img, 'w', encoding='utf-8') as f:
        json.dump(comparison_records, f, indent=2)

    print(f"\nMachine-readable comparison saved to:")
    print(f"  - {os.path.relpath(out_summary, REPO_ROOT)}")
    print(f"  - {os.path.relpath(out_per_img, REPO_ROOT)}")

    # Print Comparative Console Summary
    print("\n" + "=" * 85)
    print("COMPARATIVE SUMMARY TABLE: PLANTDOC (IN-FIELD BENCHMARK, N=63)")
    print("=" * 85)
    print(f"{'Metric':<38} | {'Method A (Center)':>12} | {'Method B (YOLO)':>12} | {'Method C (Prod)':>12}")
    print("-" * 85)

    pda = summary['PlantDoc']['Method_A']
    pdb = summary['PlantDoc']['Method_B']
    pdc = summary['PlantDoc']['Method_C']

    print(f"{'Total Evaluated Denominator':<38} | {pda['total_samples']:>12} | {pdb['total_samples']:>12} | {pdc['total_samples']:>12}")
    print(f"{'Successfully Processed':<38} | {pda['successfully_processed']:>12} | {pdb['successfully_processed']:>12} | {pdc['successfully_processed']:>12}")
    print(f"{'Pipeline Failures / Rejections':<38} | {pda['failures_count']:>12} | {pdb['failures_count']:>12} | {pdc['failures_count']:>12}")
    print(f"{'Top-1 Correct Count':<38} | {pda['top1_correct']:>12} | {pdb['top1_correct']:>12} | {pdc['top1_correct']:>12}")
    print(f"{'Top-1 Accuracy':<38} | {pda['top1_accuracy_percent']:>11.2f}% | {pdb['top1_accuracy_percent']:>11.2f}% | {pdc['top1_accuracy_percent']:>11.2f}%")
    print(f"{'Top-2 Correct Count':<38} | {pda['top2_correct']:>12} | {pdb['top2_correct']:>12} | {pdc['top2_correct']:>12}")
    print(f"{'Top-2 Accuracy':<38} | {pda['top2_accuracy_percent']:>11.2f}% | {pdb['top2_accuracy_percent']:>11.2f}% | {pdc['top2_accuracy_percent']:>11.2f}%")
    print(f"{'Healthy Recall (N=8)':<38} | {pda['healthy_metrics']['healthy_recall_percent']:>11.2f}% | {pdb['healthy_metrics']['healthy_recall_percent']:>11.2f}% | {pdc['healthy_metrics']['healthy_recall_percent']:>11.2f}%")
    print(f"{'Healthy False Alarms (as diseased)':<38} | {pda['healthy_metrics']['healthy_to_disease_false_alarms']:>12} | {pdb['healthy_metrics']['healthy_to_disease_false_alarms']:>12} | {pdc['healthy_metrics']['healthy_to_disease_false_alarms']:>12}")
    print(f"{'Disease -> Healthy False Positives':<38} | {pda['healthy_metrics']['disease_to_healthy_false_positives']:>12} | {pdb['healthy_metrics']['disease_to_healthy_false_positives']:>12} | {pdc['healthy_metrics']['disease_to_healthy_false_positives']:>12}")
    print(f"{'Uncertainty Warning Rate':<38} | {pda['uncertainty_metrics']['flagged_percent']:>11.2f}% | {pdb['uncertainty_metrics']['flagged_percent']:>11.2f}% | {pdc['uncertainty_metrics']['flagged_percent']:>11.2f}%")
    print(f"{'Error Interception Rate':<38} | {pda['uncertainty_metrics']['error_interception_rate_percent']:>11.2f}% | {pdb['uncertainty_metrics']['error_interception_rate_percent']:>11.2f}% | {pdc['uncertainty_metrics']['error_interception_rate_percent']:>11.2f}%")

    print("\n" + "=" * 85)
    print("COMPARATIVE SUMMARY TABLE: PLANTVILLAGE (LAB BENCHMARK, N=100)")
    print("=" * 85)
    pva = summary['PlantVillage']['Method_A']
    pvb = summary['PlantVillage']['Method_B']
    pvc = summary['PlantVillage']['Method_C']
    print(f"{'Metric':<38} | {'Method A (Center)':>12} | {'Method B (YOLO)':>12} | {'Method C (Prod)':>12}")
    print("-" * 85)
    print(f"{'Top-1 Accuracy':<38} | {pva['top1_accuracy_percent']:>11.2f}% | {pvb['top1_accuracy_percent']:>11.2f}% | {pvc['top1_accuracy_percent']:>11.2f}%")
    print(f"{'Top-2 Accuracy':<38} | {pva['top2_accuracy_percent']:>11.2f}% | {pvb['top2_accuracy_percent']:>11.2f}% | {pvc['top2_accuracy_percent']:>11.2f}%")
    print(f"{'Pipeline Failures':<38} | {pva['failures_count']:>12} | {pvb['failures_count']:>12} | {pvc['failures_count']:>12}")

    return summary

if __name__ == '__main__':
    run_comparison()
