# AgriVision AI — Phase C, Task 3.6: Field Training Data Preparation and Leakage Audit Report

**Audit Date:** 2026-10-22  
**Auditor:** Antigravity Forensic Engineering  
**Target Classifier:** MobileNetV3 Large Tomato Disease Classifier (`tomato_mobilenetv3_v2.onnx` / `baseline_tomato_mobilenetv3_v2.pth`)  
**Investigated Dataset:** Official PlantDoc Cropped Classification Dataset (`train` split)  
**Evaluation Benchmark:** 163-Image Isolated Benchmark (63 PlantDoc test, 100 PlantVillage test)  
**Audit Artifacts Saved:**
- Data Inventory: `data/field_training_audit/plantdoc_train_inventory.json`
- Leakage Screening: `data/field_training_audit/leakage_audit.json`
- Leakage Exclusion List: `data/field_training_audit/benchmark_exclusion_list.json`
- Proposed Experiment Config: `data/field_training_audit/proposed_experiment_config.json`
- Extracted Training Candidates: `data/field_training_audit/plantdoc_train_raw/`

---

## Executive Summary

1. **Available Data & Integrity**:
   - The official PlantDoc classification dataset (Singh et al., IIIT Delhi, CoDS-COMAD 2020, CC BY 4.0) contains **677 tomato leaf images** across 9 disease/healthy subdirectories in its official `train` split.
   - All 677 images were extracted directly from the official git repository object tree and verified for filesystem integrity. **Zero corrupt, truncated, or unreadable files** were found ($100\%$ valid PIL/RGB decoding).
2. **Critical Forensic Discovery: Cross-Split Data Leakage Detected**:
   - Multi-layer leakage screening against the read-only 163-image benchmark revealed **5 contaminated images** in the official PlantDoc `train` split:
     - **3 Exact SHA-256 duplicates** existing simultaneously in `train` and `test`.
     - **2 Exact Perceptual duplicates** ($\text{pHash distance} = 0, \text{dHash distance} = 0$, identical images re-encoded or resized).
     - **1 Severe Cross-Split Label Contradiction**: image `tomato_V8.jpg` is labeled *Tomato Septoria Leaf Spot* in `train`, but labeled *Tomato Bacterial Spot* in `test`.
   - All 5 contaminated images have been catalogued and isolated in [`benchmark_exclusion_list.json`](file:///c:/Users/joel%20tom/.gemini/antigravity-ide/scratch/agrivision-ai/data/field_training_audit/benchmark_exclusion_list.json) to strictly safeguard benchmark integrity.
   - **Net clean usable field training candidates: 672 images**.
3. **Severe Class Imbalance & Missing Classes**:
   - **Class 6 (`Tomato___Target_Spot`) is completely absent** from PlantDoc ($0$ samples in `train`, $0$ samples in `test`).
   - **Class 5 (`Tomato___Spider_mites`) is critically deficient** with only $2$ samples in `train`.
   - **Class 9 (`Tomato___healthy`) is adequately represented** with **55 field samples** in `train` (contrasting with only 8 in the test benchmark).
   - *Septoria Leaf Spot* dominates with 140 samples ($20.7\%$ of all field data).
4. **Feasibility Verdict**:
   - Official PlantDoc training data **CAN support a controlled domain adaptation experiment**, provided:
     1. The 5 leaked images are strictly excluded.
     2. A **PlantVillage anchor set (440 samples)** is incorporated to prevent catastrophic forgetting of *Target Spot* ($0$ field samples) and *Spider Mites* ($2$ field samples).
     3. An internal stratified validation set ($N=134$) is isolated so that the 163-image benchmark is never accessed during training or hyperparameter tuning.

---

## Step 1 — Available Data & License Audit

### 1.1 Source & Lineage
- **Dataset**: PlantDoc (Cropped Classification Dataset)
- **Official Repository**: `https://github.com/pratikkayal/PlantDoc-Dataset`
- **Citation**: D. Singh, N. Jain, P. Jain, P. Kayal, S. Kumawat, N. Batra. *"PlantDoc: A Dataset for Visual Plant Disease Detection"*, ACM India Joint International Conference on Data Science and Management of Data (CoDS-COMAD 2020), arXiv:1911.10317.
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0). Fully permits academic and commercial adaptation with attribution.
- **Official Splits**:
  - `test`: 63 tomato images across 8 classes. (Exclusively reserved for the read-only benchmark in `data/benchmark/plantdoc_test/`).
  - `train`: 677 tomato images across 9 classes. (Subject of this audit).

### 1.2 Model Checkpoints & Production Baseline
- **PyTorch Base Checkpoint**: `training_artifacts/baseline_tomato_mobilenetv3_v2.pth` (16.8 MB, 128 parameter tensors, fused Conv2D + BatchNorm biases, 10 linear outputs). Matches MobileNetV3 Large architecture.
- **Production ONNX Model**: `public/models/tomato_mobilenetv3_v2.onnx` (16.8 MB, SHA-256: `c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5`).
- **Production Leaf Detector**: `public/models/yolo11n_leaf_v1_best.onnx` (10.4 MB, SHA-256: `37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1`).

---

## Step 2 — Class Compatibility, Label Mapping & Imbalance Audit

### 2.1 Mapping to Production 10-Class Schema

Each PlantDoc training folder was mapped to the application's exact 10 tomato classifier classes defined in `src/services/onnx/resultFormatter.ts` and `classMapper.ts`. No distinct disease classes were merged.

| Class Index | AgriVision Production Class Name | Official PlantDoc Train Folder | Train Count | Corrupt | Leakage Excluded | Clean Usable | Field Representation Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **0** | `Tomato___Bacterial_spot` | `Tomato leaf bacterial spot` | 101 | 0 | 1 | **100** | **Adequate** (>50 samples) |
| **1** | `Tomato___Early_blight` | `Tomato Early blight leaf` | 79 | 0 | 0 | **79** | **Adequate** (>50 samples) |
| **2** | `Tomato___Late_blight` | `Tomato leaf late blight` | 101 | 0 | 1 | **100** | **Adequate** (>50 samples) |
| **3** | `Tomato___Leaf_Mold` | `Tomato mold leaf` | 85 | 0 | 0 | **85** | **Adequate** (>50 samples) |
| **4** | `Tomato___Septoria_leaf_spot` | `Tomato Septoria leaf spot` | 140 | 0 | 2 | **138** | **Abundant** (Dominant class) |
| **5** | `Tomato___Spider_mites...` | `Tomato two spotted spider mites leaf` | 2 | 0 | 0 | **2** | **Critically Deficient** (<20) |
| **6** | `Tomato___Target_Spot` | *(None — Absent in PlantDoc)* | 0 | 0 | 0 | **0** | **Completely Missing** (0) |
| **7** | `Tomato___Tomato_Yellow_Leaf_Curl_Virus`| `Tomato leaf yellow virus` | 70 | 0 | 1 | **69** | **Adequate** (>50 samples) |
| **8** | `Tomato___Tomato_mosaic_virus` | `Tomato leaf mosaic virus` | 44 | 0 | 0 | **44** | **Moderate** (20–49 samples) |
| **9** | `Tomato___healthy` | `Tomato leaf` | 55 | 0 | 0 | **55** | **Adequate** (>50 samples) |
| **Total**| **10 Classes** | **9 Subdirectories** | **677** | **0** | **5** | **672** | **Net Usable: 672 Samples** |

### 2.2 Key Findings on Class Distribution
1. **Critical Deficiencies (Target Spot & Spider Mites)**:
   - PlantDoc contains **zero images of Target Spot** (`Tomato___Target_Spot`).
   - PlantDoc contains only **2 images of Two-Spotted Spider Mite** (`Tomato___Spider_mites`).
   - *Impact*: Training exclusively on PlantDoc would cause severe gradient starvation and catastrophic forgetting for these two classes, causing the model to mispredict or ignore them entirely.
2. **Healthy Tomato Representation**:
   - In Task 3.3 and Task 3.5, the classifier exhibited a 0–12.5% healthy recall on field test data due to learning dark laboratory backgrounds as an essential feature of healthy leaves.
   - The PlantDoc training set contains **55 authentic field-photographed healthy leaves** with complex garden soil, weed background, and varied natural illumination. This provides sufficient data to teach the classifier invariant healthy leaf features.
3. **Severe Class Imbalance**:
   - The ratio between the most represented class (*Septoria*, $n=138$) and least represented (*Spider Mites*, $n=2$) is **$69 : 1$**.
   - Standard Cross-Entropy loss without class re-weighting would bias predictions heavily towards *Septoria* and *Bacterial Spot*.

---

## Step 3 — Forensic Data Leakage & Near-Duplicate Audit

A multi-tiered screening was conducted comparing all 677 PlantDoc training candidates against all 163 images in the read-only benchmark (`benchmark_manifest.json`):
1. **Exact SHA-256 Bitwise Hashing**.
2. **Perceptual Hashing**: 64-bit Discrete Cosine Transform (pHash) and 64-bit Difference Hash (dHash).
3. **Filename and URL Query String Normalization**.

### 3.1 Confirmed Benchmark Leakage (5 Excluded Images)

The screening uncovered **5 confirmed duplicate/near-duplicate images** that were present in both the official PlantDoc `train` directory and the test benchmark:

```
+=========================================================================================================================+
| # | Train Path / Filename               | Benchmark ID / Path                    | Metric / Reason        | Class Match?|
+=========================================================================================================================+
| 1 | Tomato Septoria leaf spot/          | plantdoc-test-4-early-blight-septoria  | Exact SHA-256 Match    | MATCH       |
|   | early-blight-septoria-ls-fig-3.jpg  | Tomato Septoria leaf spot/             | pHash Dist: 0, dHash: 0| (Septoria)  |
+---+-------------------------------------+----------------------------------------+------------------------+-------------+
| 2 | Tomato Septoria leaf spot/          | plantdoc-test-0-tomato_V8              | Exact SHA-256 Match    | CONFLICT!   |
|   | tomato_V8.jpg                       | Tomato leaf bacterial spot/            | pHash Dist: 0, dHash: 0| Train: Sept |
|   |                                     |                                        |                        | Test: Bact  |
+---+-------------------------------------+----------------------------------------+------------------------+-------------+
| 3 | Tomato leaf yellow virus/           | plantdoc-test-7-tylcv-seminar-1-638    | Exact SHA-256 Match    | MATCH       |
|   | tylcv-seminar-1-638.jpg             | Tomato leaf yellow virus/              | pHash Dist: 0, dHash: 0| (TYLCV)     |
+---+-------------------------------------+----------------------------------------+------------------------+-------------+
| 4 | Tomato leaf bacterial spot/         | plantdoc-test-0-07.17.18-Common...     | Perceptual Duplicate   | MATCH       |
|   | bacterial-canker3x2400-2ia1kgd.jpg  | Tomato leaf bacterial spot/            | pHash Dist: 0, dHash: 0| (Bact Spot) |
|   | (Identical image, resized 2400->300)| 07.17.18-Common_Tomato_...-258x300.jpg | (Re-encoded duplicate) |             |
+---+-------------------------------------+----------------------------------------+------------------------+-------------+
| 5 | Tomato leaf late blight/            | plantdoc-test-2-18c                    | Perceptual Duplicate   | MATCH       |
|   | late_blight1.jpg                    | Tomato leaf late blight/18c.jpg        | pHash Dist: 0, dHash: 0| (Late Blight|
|   | (Identical image, different name)   |                                        | (Identical photo)      |             |
+=========================================================================================================================+
```

### 3.2 Significance of the Leakage Discovery
- **Integrity Protection**: Had fine-tuning proceeded without this audit, 5 test images would have leaked into the training set, causing data snooping, artificially inflated metrics, and corrupted benchmark results.
- **Cross-Split Label Contradiction**: The `tomato_V8.jpg` sample reveals human annotation inconsistency in the original PlantDoc dataset. In `train`, it was annotated as *Septoria*; in `test`, it was annotated as *Bacterial Spot*.
- **Action Taken**: All 5 images are quarantined in [`benchmark_exclusion_list.json`](file:///c:/Users/joel%20tom/.gemini/antigravity-ide/scratch/agrivision-ai/data/field_training_audit/benchmark_exclusion_list.json). The original `benchmark_manifest.json` remains strictly untouched and read-only.

---

## Step 4 — Controlled Experiment Design (Proposed, Not Executed)

A fully reproducible domain adaptation plan has been drafted in [`proposed_experiment_config.json`](file:///c:/Users/joel%20tom/.gemini/antigravity-ide/scratch/agrivision-ai/data/field_training_audit/proposed_experiment_config.json). **No training has been initiated.**

### 4.1 Reproducibility of Classifier Architecture
- **Base Architecture**: MobileNetV3 Large (Torchvision).
- **Head Structure**: Linear classifier head with 10 outputs matching `TOMATO_CLASSES` index 0 through 9.
- **Fused Structure**: The baseline checkpoint `training_artifacts/baseline_tomato_mobilenetv3_v2.pth` utilizes fused Conv2D + BatchNorm biases. Script `scripts/train_mobilenetv3_corrections.py` already includes the exact `convert_to_fused()` reflection utility ensuring $100\%$ parameter loading match.

### 4.2 Split Isolation & Validation Protocol
- **Clean Training Pool**: 672 images.
- **Stratified Split**:
  - **Internal Training Split ($80\%$)**: 538 images.
  - **Internal Validation Split ($20\%$)**: 134 images (stratified across all available classes).
- **Zero Benchmark Contamination**: The 163-image benchmark (`data/benchmark/`) is **strictly air-gapped** from training, validation, early stopping, and hyperparameter search. It will only be evaluated as an immutable final test gate.

### 4.3 PlantVillage Anchor Set (Mandatory Defense against Catastrophic Forgetting)
Because PlantDoc has $0$ Target Spot samples and only $2$ Spider Mite samples, pure training on PlantDoc would completely erase the model's ability to detect Target Spot and Spider Mites.
- **Proposed Anchor Allocation** ($N=440$ samples from PlantVillage, strictly excluding benchmark samples):
  - 30 images each for classes 0, 1, 2, 3, 4, 7, 8, 9 ($8 \times 30 = 240$ images).
  - 100 images for class 5 (*Spider Mites*) to compensate for PlantDoc deficiency.
  - 100 images for class 6 (*Target Spot*) to supply representation missing in PlantDoc.
- **Combined Training Set**: $538 \text{ (Field Train)} + 440 \text{ (Anchor Train)} = 978 \text{ images}$.

### 4.4 Data Augmentation That Preserves Pathology
Field conditions require photometric robustness, but agricultural disease classification imposes strict pathology constraints:
- **Permitted Augmentations**:
  - Mild Random Brightness ($\pm 15\%$) and Contrast ($\pm 15\%$) to simulate direct sunlight vs overcast conditions.
  - Random Horizontal Flip ($p=0.5$).
  - Mild Random Rotation ($\pm 15^\circ$).
  - Micro-Hue Jitter ($\le \pm 2\%$) — strictly limited to prevent turning green leaf lamina yellow or necrotic brown spots purple.
- **Strictly Prohibited Augmentations**:
  - Color Inversion (destroys biological color significance).
  - Large Cutout / Random Erasing ($>10\%$) — destroys tiny diagnostic lesions such as *Septoria* or *Bacterial Spot* specks.
  - Severe Hue Shifting (converts healthy tissue to viral chlorosis).

### 4.5 Optimization & Checkpoint Selection
- **Progressive Two-Stage Fine-Tuning**:
  - **Stage 1 (Head Warm-up, 5 Epochs)**: Backbone `features` frozen. Train only classifier head with AdamW ($lr = 1\times 10^{-3}$, weight decay $1\times 10^{-4}$). Prevents large random gradient updates from corrupting pretrained ImageNet/PlantVillage feature extractors.
  - **Stage 2 (Differential Fine-Tuning, 15 Epochs)**: Unfreeze the top 4 inverted residual blocks (features 13 to 16). Apply differential learning rates:
    - Backbone blocks: $lr = 1\times 10^{-5}$
    - Classifier head: $lr = 1\times 10^{-4}$
    - Learning rate scheduler: Cosine Annealing with $T_{max} = 15, \eta_{min} = 1\times 10^{-6}$.
- **Loss Function**: Class-Weighted Cross-Entropy ($w_c = 1.0 / \sqrt{N_c + \epsilon}$).
- **Early Stopping**: Monitored on internal validation macro-F1 (patience = 4 epochs).

### 4.6 Acceptance Gates & ONNX Parity Protocol
Before any candidate checkpoint can be considered for ONNX conversion:
1. **Internal Validation Gate**: Candidate must achieve validation macro-F1 $\ge 0.65$ and anchor set accuracy drop $\le 1.5\text{ pp}$.
2. **PyTorch-to-ONNX Parity Gate**:
   - Export to ONNX opset 17 with input shape `[1, 3, 224, 224]`.
   - Forward pass verification: maximum absolute logit error $|y_{PyTorch} - y_{ONNX}|_\infty < 1\times 10^{-4}$.
3. **Final Benchmark Guard (Read-Only Single Evaluation)**:
   - Evaluated on the 163-image benchmark.
   - Pass criteria: PlantDoc field accuracy $\ge 55.0\%$ (baseline: $46.03\%$), PlantVillage laboratory accuracy $\ge 95.0\%$ (baseline: $97.0\%$), Healthy PlantDoc recall $\ge 37.5\%$ (baseline: $12.5\%$).

### 4.7 Statistical Limitations of the Final Benchmark
- The final benchmark contains 63 PlantDoc images and 100 PlantVillage images ($N=163$).
- On PlantDoc ($N=63$), **a single misclassified image corresponds to a $1.587\text{ pp}$ shift in accuracy**.
- A $95\%$ Wilson score confidence interval spans approximately $\pm 6\text{--}12\text{ percentage points}$.
- Therefore, final evaluation results must be reported with exact counts ($k / N$) and confidence intervals, rather than relying solely on raw percentage point differences.

---

## Step 5 — Cryptographic Integrity Verification

Bitwise SHA-256 verification confirms that zero production models, application files, or benchmark files were modified during this task:

| Asset | Path | SHA-256 Digest | Status |
| :--- | :--- | :--- | :---: |
| **Production Classifier ONNX** | `public/models/tomato_mobilenetv3_v2.onnx` | `c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5` | **Unchanged** |
| **Production Leaf Detector ONNX**| `public/models/yolo11n_leaf_v1_best.onnx` | `37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1` | **Unchanged** |
| **Benchmark Manifest** | `data/benchmark/benchmark_manifest.json` | `ee7a9fa25b6482a8181f7373f7ee3e548a6d129cc7655039d8085a6efd474963` | **Unchanged** |
| **All 163 Benchmark Images** | `data/benchmark/plantdoc_test/`, `plantvillage_sample_test/` | Bitwise identical to manifest | **Unchanged** |

---

## Conclusion & Next Steps

Task 3.6 is complete. The official PlantDoc training set has been extracted, verified, and audited:
- 672 clean, uncorrupted field training candidates are prepared.
- 5 contaminated benchmark leakage images have been detected and quarantined.
- A controlled domain adaptation experiment has been designed with an air-gapped validation split and a PlantVillage anchor set.
- **No fine-tuning has begun, no models have been exported, and no production code has been changed.**

*Awaiting review before proceeding to the fine-tuning execution phase.*
