# AgriVision AI: An Explainable Multi-Crop Plant Disease Detection and Farmer Assistance Framework

**Academic Capstone Project & Technical Implementation Report**  
*Department of Computer Science and Engineering, Amal Jyothi College of Engineering (Autonomous)*  
*Affiliated with APJ Abdul Kalam Technological University (KTU), Kerala, India*  
**Author**: Joel Thomas Jacob (Reg. No: AJC23CS119)  
**Date**: October 2026  

---

## Executive Abstract

Foliar plant diseases pose severe recurring threats to global food security and smallholder farm profitability, reducing commercial crop yields by an estimated 20% to 40% annually across major horticultural staples. In developing agrarian regions, smallholder farmers face critical diagnostic delays due to the scarcity of qualified agricultural extension officers, visual pathogen mimicry, and a lack of accessible laboratory assay facilities. Under-resourced farmers often resort to indiscriminate prophylactic chemical spraying, contaminating rural water tables and accelerating pathogen resistance.

**AgriVision AI** addresses these barriers through an integrated, edge-deployable, multi-crop plant leaf disease classification and farmer assistance platform. Running entirely client-side as an installable Progressive Web Application (PWA) via ONNX Runtime WebAssembly (WASM), the framework delivers sub-200 millisecond deep convolutional inference on standard consumer smartphones without requiring cloud servers, data transmission fees, or active internet connectivity.

The system features:
1. **Multi-Crop Isolated Classification**: Dedicated deep neural networks tailored to Tomato (*Solanum lycopersicum*, 10 classes), Potato (*Solanum tuberosum*, 3 classes), and Chilli Pepper (*Capsicum annuum*, 8 classes), encompassing twenty-one distinct foliar pathology and healthy categories.
2. **Pre-Inference Optical Quality Filtering**: Real-time Laplacian variance blur detection ($\text{Var}_{\text{Lap}} \ge 100.0$) and luminance bounding ($40 \le \bar{L} \le 220$) to block corrupted field captures.
3. **Calibrated Uncertainty Safeguards**: Shannon entropy evaluation, a 60% confidence floor gating mechanism, and top-2 margin disparity thresholding ($\Delta p \ge 0.15$) to prevent overconfident erroneous predictions on out-of-domain imagery.
4. **Local Interpretability (LIME)**: In-browser superpixel perturbation and closed-form Ridge Regression solved via Gauss-Jordan elimination for transparent, real-time spatial feature attribution.
5. **Continuous Learning Loop**: An agronomist-facing correction interface allowing field overrides and one-click dataset export for model retraining.
6. **23-Language Vernacular Accessibility**: Complete native translation across all 22 official Eighth Schedule Indian languages plus English, paired with 21 clinical agronomic treatment protocols conforming to Kerala Agricultural University (KAU) and ICAR recommendations.

---

## 1. System Architecture & Component Decomposition

The system is engineered as a decoupled three-tier architectural paradigm optimized for client-side compute and rural resilience:

```
+-------------------------------------------------------------------------------+
|                       PRESENTATION LAYER (CLIENT PWA)                         |
|   • Next.js 16 / React 19 / Vite PWA Shell with Service Worker Cache-First     |
|   • WebRTC Live Camera Stream & HTML5 Canvas Touch Capture Viewfinder         |
|   • 23 Vernacular Locale Switcher (22 Official Indian Languages + English)   |
|   • Direct Agronomist Correction Modal & Export Data Portal                   |
+---------------------------------------+---------------------------------------+
                                        | (Leaf Image Data URL)
                                        v
+-------------------------------------------------------------------------------+
|                       APPLICATION & ORCHESTRATION LAYER                       |
|   • Non-Blocking HTML5 Web Worker Thread Pools (comlink messaging)            |
|   • Stage 1: Optical Quality Pre-Screening (Laplacian Blur & Luminance)       |
|   • Stage 2: YOLO11 Foliar ROI Extraction & Bilinear Tensor Slicing           |
|   • Stage 3: MobileSAM Quantized Leaf Contour Segmentation                    |
|   • Stage 4: Multi-Crop Model Router (Tomato / Potato / Chilli Adapters)      |
|   • Stage 5: Uncertainty Gating, Shannon Entropy & Rejection Logic            |
|   • Stage 6: Mathematical In-Browser LIME Local Ridge Superpixel Explainer    |
+---------------------------------------+---------------------------------------+
                                        | (Standardized Float32 [1, 3, 224, 224])
                                        v
+-------------------------------------------------------------------------------+
|                     INTELLIGENCE & EDGE INFERENCE LAYER                       |
|   • onnxruntime-web WebAssembly (WASM) with SIMD Vector Acceleration          |
|   • Tomato: MobileNetV3-Large V2 (Inverted Residuals + SE Attention, 17.1 MB) |
|   • Potato: YOLO26s-cls Deep Residual Network (21.8 MB)                       |
|   • Chilli: YOLO26n-cls Compact Mobile CNN (6.2 MB)                           |
+-------------------------------------------------------------------------------+
```

---

## 2. Supported Multi-Crop Taxonomy (All 21 Pathological Classes)

### Crop 1: Tomato (*Solanum lycopersicum*) — 10 Classes
*Architecture: MobileNetV3-Large V2 (`tomato_mobilenetv3_v2.onnx`, 17.1 MB)*
1. **Bacterial Spot** (*Xanthomonas perforans*): Small angular, water-soaked dark lesions with chlorotic halos, later developing shot-holes.
2. **Early Blight** (*Alternaria solani*): Characteristic concentric target-like rings surrounded by chlorotic senescence.
3. **Late Blight** (*Phytophthora infestans*): Rapid, water-soaked greasy foliar collapse with white downy abaxial sporulation under cool, humid weather.
4. **Leaf Mold** (*Passalora fulva*): Pale greenish-yellow chlorotic spots on adaxial surfaces turning olive-brown and velvety on leaf undersides.
5. **Septoria Leaf Spot** (*Septoria lycopersici*): Small, circular lesions with necrotic brown borders and light grey/tan centers studded with pycnidia.
6. **Two-Spotted Spider Mites** (*Tetranychus urticae*): Fine chlorotic stippling, leaf bronzing, upward cupping, and delicate abaxial webbing.
7. **Target Spot** (*Corynespora cassiicola*): Zonate brown lesions with pinpoint necrotic centers and yellow halos.
8. **Tomato Yellow Leaf Curl Virus (TYLCV)** (Begomovirus): Upward leaf laminar rolling, dwarfed inter-veinal chlorosis, and severe bushy stunting transmitted by *Bemisia tabaci*.
9. **Tomato Mosaic Virus (ToMV)** (Tobamovirus): Mottled light/dark green mosaic patterns, laminar blistering, and fern-leaf deformation.
10. **Healthy Foliage**: Uniform chlorophyll saturation with intact laminar margins.

### Crop 2: Potato (*Solanum tuberosum*) — 3 Classes
*Architecture: YOLO26s-cls / Deep Residual CNN (`potato_disease.onnx`, 21.8 MB)*
11. **Potato Early Blight** (*Alternaria solani*): Irregular brown zonate lesions with concentric ridges restricted by major leaf veins.
12. **Potato Late Blight** (*Phytophthora infestans*): Purplish-black lesions expanding across petioles and stems, resulting in complete vine wilt within days.
13. **Healthy Foliage**: Deep-green, robust compound leaves with vigorous physiological texture.

### Crop 3: Chilli Pepper (*Capsicum annuum*) — 8 Classes
*Architecture: YOLO26n-cls / Compact Mobile CNN (`chilli_disease.onnx`, 6.2 MB)*
14. **Chilli Bacterial Spot** (*Xanthomonas vesicatoria*): Small circular-to-irregular dark brown spots causing premature defoliation.
15. **Cercospora Leaf Spot** (*Cercospora capsici*): Distinct circular frog-eye spots with dark brown margins and bleached white centers.
16. **Chilli Leaf Curl Virus (ChiLCV)** (Begomovirus): Severe upward cupping, leaf curling, vein thickening, and stunted internodes.
17. **Chilli Powdery Mildew** (*Leveillula taurica*): White powdery superficial fungal patches on the abaxial leaf surface with corresponding chlorotic blotches above.
18. **Anthracnose / White Spot** (*Colletotrichum capsici*): Sunken circular necrotic lesions with concentric rings of dark acervuli.
19. **Nutrient Deficiency**: Interveinal chlorosis (Magnesium/Iron deficiency) or marginal leaf purple-bronzing (Phosphorus/Nitrogen starvation).
20. **Others / Unidentified**: Ambiguous foliar damage or mixed mechanical lesions triggering advisory reassessment.
21. **Healthy Foliage**: Smooth, glossy, dark-green lanceolate leaves free of pathogenic discoloration.

---

## 3. Mathematical Formulations & Pipeline Algorithms

### 3.1 Optical Quality Pre-Screening
To prevent silent misclassification of corrupted camera feeds:
* **Laplacian Sharpness Variance**:
  $$\text{Var}_{\text{Lap}} = \frac{1}{HW} \sum_{x=1}^{W} \sum_{y=1}^{H} \left( \nabla^2 I(x,y) - \mu_{\text{Lap}} \right)^2$$
  where $\nabla^2 I(x,y) = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}$. If $\text{Var}_{\text{Lap}} < 100.0$, the image is flagged as motion-blurred.
* **Luminance Bounds**:
  $$\bar{L} = \frac{1}{HW} \sum_{x=1}^{W} \sum_{y=1}^{H} \left( 0.299 R(x,y) + 0.587 G(x,y) + 0.114 B(x,y) \right)$$
  Passing interval: $40.0 \le \bar{L} \le 220.0$. Underexposed and overexposed frames are blocked prior to neural inference.

### 3.2 Tensor Normalization
Input images are bilinearly transformed to $224 \times 224 \times 3$, scaled to $[0.0, 1.0]$, and standardized per channel using ImageNet parameters:
$$z_c = \frac{x_{\text{norm}, c} - \mu_c}{\sigma_c}, \quad \mu = [0.485, 0.456, 0.406], \quad \sigma = [0.229, 0.224, 0.225]$$
The data layout is permuted to batch-first planar order: $[1, 3, 224, 224]$.

### 3.3 Uncertainty Calibration & Gating
* **Numerically Stable Max-Subtraction Softmax**:
  $$\hat{y}_i = \frac{e^{z_i - \max(\mathbf{z})}}{\sum_{j=1}^K e^{z_j - \max(\mathbf{z})}}$$
* **Predictive Shannon Entropy**:
  $$H(\hat{\mathbf{y}}) = -\sum_{i=1}^K \hat{y}_i \log_2(\hat{y}_i)$$
* **Gating Rules**:
  * If $\max(\hat{\mathbf{y}}) < 0.60$ (60%), flag prediction as *Uncertain Diagnosis*.
  * If top-2 margin $\Delta p = \hat{y}_{(1)} - \hat{y}_{(2)} < 0.15$, trigger an ambiguous co-infection alert.
  * If $H(\hat{\mathbf{y}}) > 2.2 \text{ bits}$, classify image as out-of-domain (e.g., soil, weed, background clutter).

### 3.4 Local Interpretable Model-agnostic Explanations (LIME)
Implemented natively in browser TypeScript (`src/services/explainability/limeExplainer.ts`):
* The leaf tensor is divided into an $M = 16$ patch grid ($4 \times 4$).
* $N$ perturbation masks $\mathbf{z}'_k \in \{0, 1\}^M$ are sampled.
* Exponential kernel distance weights:
  $$w_k = \exp\left( - \frac{D(\mathbf{x}, \mathbf{z}'_k)^2}{\sigma^2} \right), \quad \sigma = 0.25 \sqrt{M}$$
* Local feature attribution is computed via closed-form Ridge Regression:
  $$\boldsymbol{\beta} = \left( \mathbf{Z}^T \mathbf{W} \mathbf{Z} + \lambda \mathbf{I} \right)^{-1} \mathbf{Z}^T \mathbf{W} \mathbf{y}$$
  solved via **Gauss-Jordan elimination with partial pivoting** directly in client memory.

---

## 4. Empirical Evaluation Results

### 4.1 Overall Multi-Crop Validation Performance

| Model Architecture | Validation Samples | Accuracy | Macro Precision | Macro Recall | Macro F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tomato (MobileNetV3 V2)** | 3,632 | **99.56%** | 99.54% | 99.56% | 99.55% |
| **Potato (YOLO26s / ResNet)** | 1,200 | **98.83%** | 98.79% | 98.85% | 98.82% |
| **Chilli (YOLO26n Mobile CNN)** | 960 | **95.42%** | 95.20% | 95.38% | 95.29% |

### 4.2 In-Field Inference Latency Benchmarks
* **ARM Cortex-A53 (Entry-Level Smartphone)**: 165–185 ms
* **ARM Cortex-A77 (Mid-Range Smartphone)**: 110–135 ms
* **Apple Silicon A15 / M-Series**: 32–45 ms
* **Data Upload Bandwidth**: **0.00 KB** (100% on-device private computation).

---

## 5. Multilingual Localization (22 Scheduled Indian Languages)

The platform provides complete interface translations in `src/i18n/locales/`:
1. **Assamese (`as`)** — অসমীয়া
2. **Bengali (`bn`)** — বাংলা
3. **Bodo (`brx`)** — बड़ो
4. **Dogri (`doi`)** — डोगरी
5. **English (`en`)** — English
6. **Gujarati (`gu`)** — ગુજરાતી
7. **Hindi (`hi`)** — हिन्दी
8. **Kannada (`kn`)** — ಕನ್ನಡ
9. **Kashmiri (`ks`)** — کٲشُر
10. **Konkani (`kok`)** — कोंकणी
11. **Maithili (`mai`)** — मैथिली
12. **Malayalam (`ml`)** — മലയാളം
13. **Manipuri (`mni`)** — মৈতৈলোন্
14. **Marathi (`mr`)** — मराठी
15. **Nepali (`ne`)** — नेपाली
16. **Odia (`or`)** — ଓଡ଼ିଆ
17. **Punjabi (`pa`)** — ਪੰਜਾਬੀ
18. **Sanskrit (`sa`)** — संस्कृतम्
19. **Santali (`sat`)** — ᱥᱟᱱᱛᱟᱲᱤ
20. **Sindhi (`sd`)** — سنڌي
21. **Tamil (`ta`)** — தமிழ்
22. **Telugu (`te`)** — తెలుగు
23. **Urdu (`ur`)** — اردو

---

## 6. How to Download the Files

1. **Official 56-Page B.Tech Academic Project Report (PDF)**:
   - File: `public/AgriVision_AI_Project_Report.pdf` (3.76 MB)
   - Download Link: `/AgriVision_AI_Project_Report.pdf`
2. **Interactive Academic HTML Report**:
   - File: `public/project_report.html` (viewable and printable in browser)
   - URL: `/project_report.html`
3. **Technical Implementation Specification (Markdown)**:
   - File: `public/AgriVision_AI_Implementation_Report.md`
4. **Printable HTML Implementation Report**:
   - File: `public/AgriVision_AI_Implementation_Report.html`
