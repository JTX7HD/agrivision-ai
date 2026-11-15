# AgriVision AI — Phase C, Task 3.5: Segmentation Feasibility & Read-Only Evaluation Report

**Document Status:** Final  
**Date:** 2026-10-22  
**Evaluation Target:** MobileNetV3 Tomato Classifier (`tomato_mobilenetv3_v2.onnx`) with YOLOv11n Leaf Crop (`yolo11n_leaf_v1_best.onnx`)  
**Investigated Pipeline:** Foreground Leaf Mask Segmentation inside YOLO Leaf Crops  
**Dataset:** 163 Verified Catalogued Benchmark Images (100 PlantVillage lab samples, 63 PlantDoc field samples)  
**Artifacts Generated:**
- Configuration: `data/benchmark/results/segmentation_config.json`
- Summary Metrics: `data/benchmark/results/segmentation_comparison.json`
- Per-Image Results: `data/benchmark/results/segmentation_per_image.json`
- Python Evaluator: `scripts/evaluate_segmentation.py`
- TypeScript Runner: `scripts/evaluate_segmentation.ts`

---

## Executive Summary & Verdict

| Metric | Method A: YOLO Crop (Unsegmented) | Method B: YOLO Crop (Segmented) | Delta ($\Delta$) | Impact |
| :--- | :---: | :---: | :---: | :---: |
| **PlantDoc Top-1 Accuracy** | **46.03%** (29/63) | **41.27%** (26/63) | **-4.76 pp** | **Regression** |
| **PlantDoc Top-2 Accuracy** | 63.49% (40/63) | 65.08% (41/63) | +1.59 pp | Marginal Shift |
| **PlantDoc Healthy Recall** | 12.50% (1/8) | **0.00%** (0/8) | **-12.50 pp** | **Total Collapse** |
| **PlantDoc Healthy False Alarms** | 7/8 (87.5%) | 8/8 (100.0%) | +12.5 pp | Regression |
| **PlantDoc Uncertainty Interception** | **58.82%** (20/34 errors) | 40.54% (15/37 errors) | **-18.28 pp** | **Diagnostic Safety Degraded** |
| **PlantVillage Top-1 Accuracy** | **97.00%** (97/100) | **78.00%** (78/100) | **-19.00 pp** | **Severe Catastrophic Drop** |
| **PlantVillage Healthy Recall** | 100.0% (10/10) | 80.0% (8/10) | -20.0 pp | Regression |
| **Latency per Crop (Processing Time)** | **18.8 ms** (CNN only) | **2,805.9 ms** (GrabCut + CNN) | **+2,787.1 ms** | **148× Latency Penalty** |
| **Mask Degeneration / Failure Rate** | 0.0% (0/163) | 4.29% (7/163) | +4.29 pp | Edge cases clipped |

### Key Conclusion
**Genuine foreground leaf segmentation does NOT improve tomato disease classification and must NOT be promoted to production.** 

Empirical testing reveals that applying foreground segmentation masks causes a **-4.76 pp regression** on in-field PlantDoc images and a catastrophic **-19.00 pp regression** on PlantVillage laboratory images. Furthermore, classical graph-cut segmentation imposes an unacceptable **~2.8-second latency penalty per image** while completely destroying healthy class recall (collapsing from 12.5% to 0.0% on PlantDoc).

---

## Step 1 — Inspection of Existing Segmentation Options & Feasibility

### 1.1 Existing Codebase Audit (`leafSegmentationService.ts`)
Inspection of `src/services/pipeline/leafSegmentationService.ts` revealed:
- The existing segmenter is a **mock adapter** (`PassThroughLeafSegmenter`) implementing the `ILeafSegmenter` interface.
- It performs no real computer vision or machine learning segmentation:
  ```typescript
  // src/services/pipeline/leafSegmentationService.ts:16-30
  async segment(crop: ImageData): Promise<SegmentationResult> {
    return {
      mask: new Uint8ClampedArray(crop.width * crop.height).fill(255),
      confidence: 1.0,
      areaRatio: 0.85
    };
  }
  ```
- No Segment Anything Model (SAM), MobileSAM, or UNet weights exist in `public/models/` or anywhere in the repository. The production application effectively bypassed segmentation by passing unsegmented leaf crops directly to the classifier.

### 1.2 Evaluation Environment & Browser Feasibility
- **Local Dependencies**: The environment has `onnxruntime`, `opencv-python (cv2)`, `Pillow`, and `numpy`.
- **Browser Execution Feasibility**:
  1. *Neural Segmentation (SAM / MobileSAM / FastSAM)*: MobileSAM ONNX weights exceed 40 MB for the image encoder alone, requiring multiple seconds of WebAssembly/WebGL shader compilation and heavy tensor allocations that freeze mobile browser tabs.
  2. *Classical Foreground Segmentation (GrabCut / Graph Cuts)*: OpenCV GrabCut iteratively fits Gaussian Mixture Models (GMM) to foreground and background color spaces. In pure CPU or WebAssembly environments, running 3–5 iterations on a $400 \times 400$ crop requires **$2.5$ to $3.5$ seconds**.
  3. *Color / HSV Thresholding*: Completely fails on diseased agricultural leaves because yellow, brown, and necrotic lesions share identical HSV color histograms with soil, dry mulch, and dead stems.

### 1.3 Expected Limitations for Agricultural Leaves
- **Chlorosis and Necrosis Erosion**: Pathogenic symptoms (e.g., Early Blight target lesions, Late Blight dark rot, Septoria specks) have high contrast with green leaf lamina. Graph cuts and thresholders routinely classify dark brown necrotic edges as "background" and excise them from the leaf.
- **Artificial High-Frequency Edge Gradients**: Applying a binary or soft mask creates an artificial border around the leaf perimeter. When resized to $224 \times 224$ and convolved by MobileNetV3 depthwise separable kernels, this boundary acts as a high-contrast artificial gradient, triggering false activations in classes characterized by irregular margins (`Tomato___Tomato_mosaic_virus` and `Tomato___Septoria_leaf_spot`).
- **Shadowing & Specular Reflections**: Deep shadows between overlapping leaflets become segmented out as background voids, creating Swiss-cheese hole artifacts across the leaf blade.

---

## Step 2 — Standalone Experimental Design & Methodology

A standalone evaluation engine was developed (`scripts/evaluate_segmentation.py` and `scripts/evaluate_segmentation.ts`) ensuring zero modifications to production code, weights, or benchmark records.

### 2.1 Controlled Preprocessing Comparison
Both methods were fed identical benchmark images from `data/benchmark/benchmark_manifest.json` ($N=163$):

1. **Method A (Existing Production ROI Crop)**:
   - Primary leaf detected using production `yolo11n_leaf_v1_best.onnx` (confidence $\ge 0.25$).
   - Bounding-box crop extracted with natural contextual boundary.
   - Resized to $224 \times 224$ via bilinear interpolation.
   - Normalized using standard ImageNet stats: $\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$.
   - Classified by `tomato_mobilenetv3_v2.onnx`.

2. **Method B (Segmented YOLO Crop)**:
   - Identical YOLO leaf crop extracted as above.
   - Iterative Graph-Cut (GrabCut) applied with 3 iterations and Gaussian Mixture Models (GMM).
   - Outer margin (5%) initialized as definite background; central region initialized as probable foreground.
   - Binary foreground mask smoothed via edge feathering (Gaussian kernel $3 \times 3$) to mitigate aliasing.
   - Background pixels replaced with **neutral studio black `RGB(0, 0, 0)`**, exactly matching the dark laboratory background of the PlantVillage training dataset. *(Note: Neutral mid-gray `RGB(128, 128, 128)` was also tested in diagnostic probes and produced even worse misclassifications).*
   - Normalization and classification identical to Method A.

### 2.2 Preserving Denominator & Failure Accounting
- **No silent drops**: All 163 images were retained in the denominator for both methods.
- **Degenerate Mask Handling**: If GrabCut failed to converge or produced a degenerate mask ($<5\%$ or $>95\%$ foreground), the incident was logged as a mask generation failure (`mask_generation_failure = true`) and fallen back to the unsegmented crop. Exactly 7 such degenerations occurred ($4.29\%$).

---

## Step 3 — Comprehensive Evaluation Results

### 3.1 Overall & Sub-Dataset Accuracy Comparison

```
+===================================================================================================+
| Dataset                  | Metric               | Method A (Unsegmented) | Method B (Segmented)   |
+===================================================================================================+
| PlantVillage (N=100)     | Top-1 Accuracy       | 97.00% (97/100)        | 78.00% (78/100) [-19%] |
|                          | Top-2 Accuracy       | 98.00% (98/100)        | 91.00% (91/100)        |
|                          | Healthy Recall       | 100.0% (10/10)         | 80.00% (8/10)          |
|                          | Flagged Uncertain    | 3.00%  (3/100)         | 10.00% (10/100)        |
+--------------------------+----------------------+------------------------+------------------------+
| PlantDoc (N=63)          | Top-1 Accuracy       | 46.03% (29/63)         | 41.27% (26/63) [-4.8%] |
|                          | Top-2 Accuracy       | 63.49% (40/63)         | 65.08% (41/63)         |
|                          | Healthy Recall       | 12.50% (1/8)           | 0.00%  (0/8)   [-12.5%]|
|                          | Healthy False Alarms | 87.50% (7/8)           | 100.0% (8/8)           |
|                          | Flagged Uncertain    | 46.03% (29/63)         | 36.51% (23/63)         |
|                          | Error Interception   | 58.82% (20/34)         | 40.54% (15/37)         |
+--------------------------+----------------------+------------------------+------------------------+
| Combined (N=163)         | Top-1 Accuracy       | 77.30% (126/163)       | 63.80% (104/163)[-13%] |
|                          | Top-2 Accuracy       | 84.66% (138/163)       | 80.98% (132/163)       |
|                          | Healthy Recall       | 61.11% (11/18)         | 44.44% (8/18)          |
+===================================================================================================+
```

### 3.2 PlantDoc Per-Class Breakdown (In-Field Test Set)

| Class Index & Name | Support ($N$) | Method A Recall | Method B Recall | Method A F1 | Method B F1 | Impact / Failure Mode |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **0: Bacterial Spot** | 7 | 14.29% | 14.29% | 16.67% | 22.22% | Minimal change; tiny punctate lesions unchanged |
| **1: Early Blight** | 9 | **100.0%** | **66.67%** | **78.26%** | **66.67%** | **Severe drop**: Large target lesions clipped by mask |
| **2: Late Blight** | 9 | 55.56% | 66.67% | 55.56% | 41.38% | Precision crashed ($55.6\% \to 30.0\%$) due to 14 false positives |
| **3: Leaf Mold** | 4 | 50.00% | 25.00% | 28.57% | 18.18% | Olive-green mold patches treated as non-leaf clutter |
| **4: Septoria Leaf Spot** | 11 | 63.64% | **81.82%** | 60.87% | 69.23% | Artificially boosted: mask edge artifacts trigger Septoria |
| **7: Yellow Leaf Curl** | 6 | 50.00% | 50.00% | 42.86% | 60.00% | Curled leaflet boundaries distorted |
| **8: Tomato Mosaic Virus**| 9 | 11.11% | **0.00%** | 15.38% | **0.00%** | Complete failure; 6 samples misclassified as Late Blight |
| **9: Healthy Tomato** | 8 | 12.50% | **0.00%** | 22.22% | **0.00%** | **Total collapse**: all 8 healthy samples classified diseased |

### 3.3 PlantVillage Breakdown (Laboratory Set Regression Analysis)
In the laboratory dataset ($N=100$), unsegmented crops achieved **97.00% accuracy**. However, applying the segmentation mask caused accuracy to crash down to **78.00%**:
- **Bacterial Spot ($N=10$)**: Recall collapsed from **100.0% to 20.0%** (8 out of 10 samples were misclassified as *Septoria Leaf Spot*). The artificial feathered mask boundary introduced high-contrast pixel boundaries that the network's shallow convolutional kernels registered as Septoria lesion fringes.
- **Two-Spotted Spider Mite ($N=10$)**: Recall plummeted from **80.0% to 40.0%** (5 samples misclassified as *Healthy* because fine yellow stippling near leaf edges was eroded).
- **Tomato Mosaic Virus ($N=10$)**: Recall dropped from **100.0% to 80.0%**.

---

## Step 3.4 — Detailed Individual Audit of the 8 Healthy PlantDoc Samples

The 8 healthy PlantDoc samples represent true in-field asymptomatic leaves photographed against natural backgrounds (soil, greenhouse stakes, garden ground). Each was inspected individually:

| Image ID & Filename | Method A (Unsegmented) | Method B (Segmented) | Foreground Mask Ratio | Forensic Mechanism & Visual Finding |
| :--- | :--- | :--- | :---: | :--- |
| `plantdoc-test-9-1684`<br>`Tomato leaf/1684.jpg` | **Tomato___healthy**<br>(66.2% conf, Correct) | **Tomato___Tomato_mosaic_virus**<br>(40.1% conf, Incorrect) | 0.564 | **Catastrophic Regression**. Method A correctly identified this healthy field leaf. Method B's mask carved along the leaflet sinuses, creating high-contrast edge curves that triggered mosaic viral distortion filters. |
| `plantdoc-test-9-2013-08-20-06`<br>`Tomato leaf/2013-08-20-06.jpg` | **Tomato___Septoria_leaf_spot**<br>(47.3% conf, Flagged) | **Tomato___Tomato_mosaic_virus**<br>(70.5% conf, Unflagged False Alarm) | 0.613 | **Safety Compromise**. Masking converted an uncertain warning (Method A conf 47.3%) into a confidently incorrect false alarm (Method B conf 70.5% ToMV) without triggering uncertainty rules. |
| `plantdoc-test-9-90e2c0`<br>`Tomato leaf/90e2c0.jpg` | **Tomato___Leaf_Mold**<br>(96.0% conf, Incorrect) | **Tomato___Leaf_Mold**<br>(91.0% conf, Incorrect) | 0.665 | Background mulch was removed, but specular leaf sheen on the healthy leaf surface continues to be misidentified as velvety Leaf Mold mycelium. |
| `plantdoc-test-9-DSCN1015.JPG`<br>`Tomato leaf/DSCN1015.JPG.jpg` | **Tomato___Late_blight**<br>(45.0% conf, Flagged) | **Tomato___Late_blight**<br>(45.2% conf, Flagged) | 0.655 | Soil suppressed, but dark shadowed petiole inside the crop triggers Late Blight water-soaked lesion filters. |
| `plantdoc-test-9-IMG_1246`<br>`Tomato leaf/IMG_1246.jpg` | **Tomato___Leaf_Mold**<br>(83.1% conf, Incorrect) | **Tomato___Leaf_Mold**<br>(62.5% conf, Incorrect) | 0.722 | Strong sunlight illumination on healthy leaf lobes mimics chlorotic Leaf Mold blotches. Masking fails to solve the illumination domain gap. |
| `plantdoc-test-9-Tomato59.JPG`<br>`Tomato leaf/Tomato59.JPG.jpg` | **Tomato___TYLCV**<br>(40.1% conf, Flagged) | **Tomato___TYLCV**<br>(37.5% conf, Flagged) | 0.615 | Healthy young leaf curl geometry triggers TYLCV curling feature maps. Both methods properly intercepted by margin uncertainty. |
| `plantdoc-test-9-Tomato_leaf`<br>`Tomato leaf/Tomato_leaf.jpg` | **Tomato___TYLCV**<br>(61.3% conf, Incorrect) | **Tomato___Tomato_mosaic_virus**<br>(75.1% conf, Incorrect) | 0.703 | Natural serrated leaflet edges masked with black background create high-frequency ripples classified as Mosaic Virus with high confidence (75.1%). |
| `plantdoc-test-9-main-qimg...`<br>`Tomato leaf/main-qimg...` | **Tomato___Leaf_Mold**<br>(44.1% conf, Flagged) | **Tomato___Late_blight**<br>(57.3% conf, Flagged) | 0.476 | Severe over-segmentation: 52.4% of leaf area excised, leaving fragmented leaf shards that mimic necrotic Late Blight blighted foliage. |

### Summary of Healthy Sample Findings:
- Segmentation **failed to fix a single misclassified healthy sample**.
- In the only healthy sample correctly classified by the baseline unsegmented crop (`1684.jpg`), segmentation **actively broke the correct prediction**, shifting it into a false positive for *Tomato Mosaic Virus*.
- **Healthy recall collapsed to 0.0% (0/8)**.

---

## Step 4 — Integrity, Verification, and Reproducibility

Cryptographic verification was performed immediately before and after the evaluation run using SHA-256 digests. Zero production assets or benchmark manifests were modified.

### 4.1 Cryptographic Hash Verification

| Target File | Expected / Baseline SHA-256 | Post-Evaluation SHA-256 | Verification Status |
| :--- | :--- | :--- | :---: |
| `public/models/tomato_mobilenetv3_v2.onnx` | `c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5` | `c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5` | **MATCH (Unchanged)** |
| `public/models/yolo11n_leaf_v1_best.onnx` | `37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1` | `37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1` | **MATCH (Unchanged)** |
| `data/benchmark/benchmark_manifest.json` | `ee7a9fa25b6482a8181f7373f7ee3e548a6d129cc7655039d8085a6efd474963` | `ee7a9fa25b6482a8181f7373f7ee3e548a6d129cc7655039d8085a6efd474963` | **MATCH (Unchanged)** |
| All 163 Benchmark Images | Manifest checksums verified | Bitwise verified | **MATCH (Unchanged)** |

### 4.2 Application Code & Model Isolation
- No edits were committed to `src/services/pipeline/leafSegmentationService.ts` or any files in `src/`.
- No dependencies were added to `package.json`.
- All outputs and runners are self-contained in `data/benchmark/results/` and `scripts/`.

---

## Step 5 — Recommendation and Path Forward

### 5.1 Definitive Recommendation: REJECT Segmentation Preprocessing
1. **Reject Foreground Masking in Inference Pipeline**:
   The hypothesis that foreground segmentation would improve tomato disease classification by suppressing soil/background pixels is **falsified by empirical evidence**. Foreground segmentation degrades classification accuracy ($-4.76\text{ pp}$ on field data, $-19.00\text{ pp}$ on lab data) and destroys healthy class recall.
2. **Computational Infeasibility**:
   Adding GrabCut or neural segmentation adds **$2,787\text{ ms}$ of latency per crop**, violating mobile edge responsiveness requirements for a negative net diagnostic return.
3. **Biological & Optical Root Causes**:
   - The classifier's primary failure mode on field images is **NOT** soil or background pixels; it is a **domain shift** in illumination (harsh sun vs studio flash), leaf morphology (senescence, natural curling, veins vs flat detached leaves), and pathogen expression.
   - Artificial mask boundaries introduce high-frequency gradient artifacts that MobileNetV3 interprets as necrotic lesion margins, triggering massive false positive spikes for *Septoria* and *Mosaic Virus*.

### 5.2 Next Steps for Phase C
- **Retain Method A (YOLO Leaf Crop without Segmentation)** as the preprocessing standard.
- **Focus Engineering on Domain-Adapted Fine-Tuning (Task 3.6+)**:
  The only viable, evidence-backed strategy to bridge the PlantDoc accuracy gap ($46.03\% \to >80\%$) is fine-tuning the MobileNetV3 classifier directly on authentic in-field tomato training images (such as the PlantDoc training split, completely independent of the 163-image evaluation benchmark) using strong photometric augmentations (sunlight flare, shadow jitter, natural background mixup).
