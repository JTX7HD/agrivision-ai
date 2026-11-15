"""
AgriVision AI — Field Misclassification Analysis (Phase C, Task 3.3)
===================================================================
Script to extract, categorize, and inspect the 34 field misclassifications
from the read-only benchmark results.
"""

import os
import sys
import json
from typing import Dict, Any, List
import numpy as np
from PIL import Image, ImageStat

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREDS_FILE = os.path.join(REPO_ROOT, 'data', 'benchmark', 'results', 'per_image_predictions.json')
SUMMARY_FILE = os.path.join(REPO_ROOT, 'data', 'benchmark', 'results', 'benchmark_summary.json')

def get_image_visual_stats(abs_path: str) -> Dict[str, Any]:
    if not os.path.exists(abs_path):
        return {'error': 'File not found'}
    with Image.open(abs_path) as img:
        img_rgb = img.convert('RGB')
        w, h = img_rgb.size
        stat = ImageStat.Stat(img_rgb)
        mean_rgb = [round(x, 1) for x in stat.mean]
        std_rgb = [round(x, 1) for x in stat.stddev]
        # Aspect ratio
        aspect = round(w / h, 2)
        return {
            'width': w,
            'height': h,
            'aspect_ratio': aspect,
            'mean_rgb': mean_rgb,
            'stddev_rgb': std_rgb
        }

def run_analysis():
    with open(PREDS_FILE, 'r', encoding='utf-8') as f:
        all_preds = json.load(f)

    pd_preds = [p for p in all_preds if p['dataset_source'] == 'PlantDoc']
    pd_errors = [p for p in pd_preds if not p['is_top1_correct']]
    pd_unflagged_errors = [p for p in pd_errors if not p['is_uncertain']]
    pd_healthy = [p for p in pd_preds if p['true_class_name'] == 'Tomato___healthy']

    print(f"Total PlantDoc Images: {len(pd_preds)}")
    print(f"Total PlantDoc Errors: {len(pd_errors)}")
    print(f"High-Confidence (Unflagged) Errors: {len(pd_unflagged_errors)}")
    print(f"Healthy Field Samples: {len(pd_healthy)} (Errors: {sum(1 for p in pd_healthy if not p['is_top1_correct'])})")

    # Grouping by error patterns
    # 1. Healthy classified as disease
    # 2. Disease classified as Healthy
    # 3. Bacterial Spot vs Septoria / Early Blight
    # 4. Blight confusion (Early Blight vs Late Blight)
    # 5. Viral / Yellowing confusion (TYLCV vs ToMV vs Mold)
    # 6. Other

    print("\n" + "=" * 90)
    print("ALL 34 PLANTDOC ERRORS (Ordered by True Class and ID)")
    print("=" * 90)

    for idx, e in enumerate(pd_errors, 1):
        rel_path = e['relative_path']
        abs_path = os.path.join(REPO_ROOT, rel_path)
        stats = get_image_visual_stats(abs_path)
        status = "UNCERTAIN" if e['is_uncertain'] else "HIGH-CONF (UNFLAGGED)"
        reasons = []
        if e['is_weak_confidence']:
            reasons.append("Conf<60%")
        if e['is_ambiguous']:
            reasons.append("Margin<10pp")
        reason_str = ", ".join(reasons) if reasons else "None (Clean)"

        print(f"[{idx:02d}] ID: {e['id']}")
        print(f"     Path:        {rel_path}")
        print(f"     True Class:  {e['true_class_name']} (Index {e['true_class_index']})")
        print(f"     Pred Class:  {e['predicted_class_name']} (Index {e['predicted_class_index']}) @ {e['top_confidence_percent']:.1f}%")
        print(f"     Runner-Up:   {e['second_predicted_class_name']} (Index {e['second_predicted_class_index']}) @ {e['second_confidence_percent']:.1f}%")
        print(f"     Margin:      {e['top_margin_pp']:.1f} pp | Status: {status} [{reason_str}]")
        print(f"     Image Props: {stats.get('width')}x{stats.get('height')} (aspect={stats.get('aspect_ratio')}), meanRGB={stats.get('mean_rgb')}")
        print("-" * 90)

    print("\n" + "=" * 90)
    print(f"THE 17 HIGH-CONFIDENCE (UNFLAGGED / SILENT) ERRORS (Conf >= 60.0% AND Margin >= 10.0 pp)")
    print("=" * 90)
    for idx, e in enumerate(pd_unflagged_errors, 1):
        print(f"[{idx:02d}] ID: {e['id']}")
        print(f"     True Class:  {e['true_class_name']} (Index {e['true_class_index']})")
        print(f"     Pred Class:  {e['predicted_class_name']} (Index {e['predicted_class_index']}) @ {e['top_confidence_percent']:.1f}%")
        print(f"     Runner-Up:   {e['second_predicted_class_name']} (Index {e['second_predicted_class_index']}) @ {e['second_confidence_percent']:.1f}% | Margin: {e['top_margin_pp']:.1f} pp")
        print(f"     Path:        {e['relative_path']}")
        print("-" * 90)

    print("\n" + "=" * 90)
    print(f"THE 8 HEALTHY TOMATO FIELD SAMPLES (Class 9) — ALL MISCLASSIFIED")
    print("=" * 90)
    for idx, e in enumerate(pd_healthy, 1):
        status = "UNCERTAIN" if e['is_uncertain'] else "HIGH-CONF (UNFLAGGED)"
    # Detailed visual inspection of the 8 healthy images
    print("\n" + "=" * 90)
    print("DETAILED VISUAL & PHOTOGRAPHIC INSPECTION OF THE 8 HEALTHY PLANTDOC SAMPLES")
    print("=" * 90)

    for idx, h in enumerate(pd_healthy, 1):
        path = h['relative_path']
        abs_p = os.path.join(REPO_ROOT, path)
        im = Image.open(abs_p).convert('RGB')
        w, h_px = im.size
        crop_box = h['preprocessing_meta']['crop_box']
        cropped = im.crop(crop_box)

        # Laplacian variance
        gray = np.array(cropped.convert('L'), dtype=np.float32)
        lap = -4 * gray + np.roll(gray, 1, 0) + np.roll(gray, -1, 0) + np.roll(gray, 1, 1) + np.roll(gray, -1, 1)
        lap_var = float(np.var(lap))

        # HSV stats
        hsv = np.array(cropped.convert('HSV'), dtype=np.float32)
        mean_sat = float(np.mean(hsv[:, :, 1]))
        mean_val = float(np.mean(hsv[:, :, 2]))

        # Dominant color / background estimation:
        # Check fraction of pixels that are non-green (leaf vs background)
        # Green hue roughly in 35..85 in 0..179 PIL HSV scale (or 70..170 in 0..255)
        hue = hsv[:, :, 0]
        sat = hsv[:, :, 1]
        green_mask = (hue >= 25) & (hue <= 85) & (sat >= 40)
        green_pct = float(np.mean(green_mask)) * 100.0

        print(f"Healthy Sample #{idx:02d}: {os.path.basename(path)}")
        print(f"  - Full Resolution:    {w} x {h_px} (Aspect Ratio: {w/h_px:.2f})")
        print(f"  - Center Crop Box:    {crop_box} -> Resized to 224x224")
        print(f"  - Green Foliage Area: {green_pct:.1f}% of cropped frame")
        print(f"  - Sharpness (LapVar): {lap_var:.1f}")
        print(f"  - Mean Saturation:    {mean_sat:.1f} / 255 | Brightness: {mean_val:.1f} / 255")
        print(f"  - Model Prediction:   {h['predicted_class_name']} ({h['top_confidence_percent']}%)")
        print(f"  - Runner-Up Class:    {h['second_predicted_class_name']} ({h['second_confidence_percent']}%)")
        print(f"  - Margin:             {h['top_margin_pp']} pp | Uncertain: {h['is_uncertain']}")
        print("-" * 90)

    # Categorize errors
    categories = {
        'healthy_as_diseased': [],
        'bacterial_vs_septoria': [],
        'early_vs_late_blight': [],
        'leaf_mold_false_positive': [],
        'viral_mosaic_curl_confusion': [],
        'other': []
    }

    for e in pd_errors:
        t_idx = e['true_class_index']
        p_idx = e['predicted_class_index']
        if t_idx == 9:
            categories['healthy_as_diseased'].append(e)
        elif (t_idx == 0 and p_idx == 4) or (t_idx == 4 and p_idx == 0):
            categories['bacterial_vs_septoria'].append(e)
        elif (t_idx == 1 and p_idx == 2) or (t_idx == 2 and p_idx == 1):
            categories['early_vs_late_blight'].append(e)
        elif p_idx == 3:  # Predicted as leaf mold
            categories['leaf_mold_false_positive'].append(e)
        elif (t_idx in [7, 8] and p_idx in [7, 8]):
            categories['viral_mosaic_curl_confusion'].append(e)
        else:
            categories['other'].append(e)

    analysis_data = {
        'total_plantdoc_samples': len(pd_preds),
        'total_errors': len(pd_errors),
        'unflagged_high_conf_errors': len(pd_unflagged_errors),
        'flagged_uncertain_errors': len(pd_errors) - len(pd_unflagged_errors),
        'category_counts': {k: len(v) for k, v in categories.items()},
        'all_34_errors': pd_errors,
        'unflagged_17_errors': pd_unflagged_errors,
        'healthy_8_errors': pd_healthy
    }

    # Markdown Table Generators
    print("\n" + "=" * 90)
    print("MARKDOWN TABLE: ALL 34 PLANTDOC ERRORS")
    print("=" * 90)
    print("| # | Sample ID | True Class | Predicted Class (Conf) | Runner-Up (Conf) | Margin | Flagged Uncertain? |")
    print("| :-: | :--- | :--- | :--- | :--- | :-: | :-: |")
    for idx, e in enumerate(pd_errors, 1):
        unc_str = "Yes" if e['is_uncertain'] else "**No (High-Conf)**"
        true_short = e['true_class_name'].replace('Tomato___', '')
        pred_short = e['predicted_class_name'].replace('Tomato___', '')
        second_short = e['second_predicted_class_name'].replace('Tomato___', '')
        print(f"| {idx:02d} | `{e['id']}` | {true_short} | {pred_short} ({e['top_confidence_percent']:.1f}%) | {second_short} ({e['second_confidence_percent']:.1f}%) | {e['top_margin_pp']:.1f} pp | {unc_str} |")

    print("\n" + "=" * 90)
    print("MARKDOWN TABLE: 17 HIGH-CONFIDENCE ERRORS (UNFLAGGED)")
    print("=" * 90)
    print("| # | Sample ID | True Class | Erroneous Prediction | Top Conf | Runner-Up | Margin | Image Properties & Context |")
    print("| :-: | :--- | :--- | :--- | :-: | :--- | :-: | :--- |")
    for idx, e in enumerate(pd_unflagged_errors, 1):
        rel_p = e['relative_path']
        abs_p = os.path.join(REPO_ROOT, rel_p)
        st = get_image_visual_stats(abs_p)
        true_short = e['true_class_name'].replace('Tomato___', '')
        pred_short = e['predicted_class_name'].replace('Tomato___', '')
        second_short = e['second_predicted_class_name'].replace('Tomato___', '')
        props = f"{st.get('width')}x{st.get('height')}, AR={st.get('aspect_ratio')}"
        print(f"| {idx:02d} | `{e['id']}` | {true_short} | **{pred_short}** | {e['top_confidence_percent']:.1f}% | {second_short} ({e['second_confidence_percent']:.1f}%) | {e['top_margin_pp']:.1f} pp | {props} |")

    out_json = os.path.join(REPO_ROOT, 'data', 'benchmark', 'results', 'field_misclassifications.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, indent=2)
    print(f"\nSaved structured analysis to {os.path.relpath(out_json, REPO_ROOT)}")

if __name__ == '__main__':
    run_analysis()
