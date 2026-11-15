# AgriVision AI — Complete Disease Classification Image Library (`Leaves/`)

## 1. Overview
The `Leaves/` directory provides a curated, standardized, and legally traceable foliar pathology image library covering **all 21 classification categories** supported by the AgriVision AI production models:
- **Tomato (Solanum lycopersicum)**: 10 authoritative classes (`tomato_mobilenetv3_v2.onnx`)
- **Potato (Solanum tuberosum)**: 3 authoritative classes (`potato_disease.onnx`)
- **Chilli Pepper (Capsicum annuum)**: 8 authoritative classes (`chilli_disease.onnx`)

Every class folder contains genuine, non-synthetic images sourced from verified academic and agricultural institutions, accompanied by cryptographic checksums (SHA-256), exact source URLs, documented licenses, and headless ONNX model inference evaluation results.

---

## 2. Directory Hierarchy & Category Mapping

```
Leaves/
├── Tomato/                                      # 10 production classes
│   ├── Tomato___Bacterial_spot/
│   ├── Tomato___Early_blight/
│   ├── Tomato___Late_blight/
│   ├── Tomato___Leaf_Mold/
│   ├── Tomato___Septoria_leaf_spot/
│   ├── Tomato___Spider_mites Two-spotted_spider_mite/
│   ├── Tomato___Target_Spot/
│   ├── Tomato___Tomato_Yellow_Leaf_Curl_Virus/
│   ├── Tomato___Tomato_mosaic_virus/
│   └── Tomato___healthy/
├── Potato/                                      # 3 production classes
│   ├── Potato__Early_Blight/
│   ├── Potato__Healthy_Leaf/
│   └── Potato__Late_Blight/
├── Chilli/                                      # 8 production classes
│   ├── Chili__Bacterial_Spot/
│   ├── Chili__Cercospora_Leaf_Spot/
│   ├── Chili__Curl_Virus/
│   ├── Chili__Healthy_Leaf/
│   ├── Chili__Nutrition_Deficiency/
│   ├── Others/
│   ├── Chili__Powdery_Mildew/
│   └── Chili__White_Spot/
├── manifests/
│   ├── image_manifest.csv                       # Standard CSV manifest
│   ├── image_manifest.json                      # Full structured JSON manifest with top-3 predictions
│   ├── leaves_manifest.csv                      # Mirrored CSV for legacy compatibility
│   ├── leaves_manifest.json                     # Mirrored JSON for legacy compatibility
│   └── verification_report.json                 # Per-crop and per-class summary statistics
└── README.md                                    # This documentation
```

### Complete 21-Class Authoritative Registry

| Crop | Index | Exact Class Identifier | Display Name | Etiology / Pathogen |
|:---|:---:|:---|:---|:---|
| **Tomato** | 0 | `Tomato___Bacterial_spot` | Tomato Bacterial Spot | *Xanthomonas perforans / euvesicatoria* |
| **Tomato** | 1 | `Tomato___Early_blight` | Tomato Early Blight | *Alternaria solani* |
| **Tomato** | 2 | `Tomato___Late_blight` | Tomato Late Blight | *Phytophthora infestans* |
| **Tomato** | 3 | `Tomato___Leaf_Mold` | Tomato Leaf Mold | *Passalora fulva* (syn. *Cladosporium fulvum*) |
| **Tomato** | 4 | `Tomato___Septoria_leaf_spot` | Tomato Septoria Leaf Spot | *Septoria lycopersici* |
| **Tomato** | 5 | `Tomato___Spider_mites Two-spotted_spider_mite` | Two-Spotted Spider Mite Damage | *Tetranychus urticae* |
| **Tomato** | 6 | `Tomato___Target_Spot` | Tomato Target Spot | *Corynespora casiicola* |
| **Tomato** | 7 | `Tomato___Tomato_Yellow_Leaf_Curl_Virus` | Tomato Yellow Leaf Curl Virus (TYLCV) | *Begomovirus* (Whitefly vector) |
| **Tomato** | 8 | `Tomato___Tomato_mosaic_virus` | Tomato Mosaic Virus (ToMV) | *Tobamovirus* (Mechanical transmission) |
| **Tomato** | 9 | `Tomato___healthy` | Healthy Tomato Leaf | Asymptomatic foliar specimen |
| **Potato** | 0 | `Potato__Early_Blight` | Potato Early Blight | *Alternaria solani* |
| **Potato** | 1 | `Potato__Healthy_Leaf` | Healthy Potato Leaf | Asymptomatic foliar specimen |
| **Potato** | 2 | `Potato__Late_Blight` | Potato Late Blight | *Phytophthora infestans* |
| **Chilli** | 0 | `Chili__Bacterial_Spot` | Chilli Bacterial Spot | *Xanthomonas campestris pv. vesicatoria* |
| **Chilli** | 1 | `Chili__Cercospora_Leaf_Spot` | Chilli Cercospora Leaf Spot | *Cercospora capsici* (Frogeye leaf spot) |
| **Chilli** | 2 | `Chili__Curl_Virus` | Chilli Leaf Curl Virus | ChiLCV (*Begomovirus*, Murda complex) |
| **Chilli** | 3 | `Chili__Healthy_Leaf` | Healthy Chilli Leaf | Asymptomatic foliar specimen |
| **Chilli** | 4 | `Chili__Nutrition_Deficiency` | Chilli Nutrient Deficiency | Physiological chlorosis / N-P-K-Fe deficiency |
| **Chilli** | 5 | `Others` | Other / Unidentified Leaf | Irrelevant, non-chilli crop foliage |
| **Chilli** | 6 | `Chili__Powdery_Mildew` | Chilli Powdery Mildew | *Leveillula taurica* |
| **Chilli** | 7 | `Chili__White_Spot` | Chilli Anthracnose / White Spot | *Colletotrichum capsici / gloeosporioides* |

---

## 3. Justification of the `Others` Class
As documented in the official KrishokTech / BARI model specification (`quarantined_audit/KrishokTech/chilli_disease_details.json`):
> **Bengali Definition**: *"Others (অপ্রাসঙ্গিক বা অপরিচিত পাতা) — আপলোডকৃত ছবিটি মরিচের কোনো পরিচিত রোগ বা লক্ষণের সাথে সামঞ্জস্যপূর্ণ নয় অথবা অস্পষ্ট। অপ্রাসঙ্গিক ছবি, ক্যামেরার ফোকাসহীনতা অথবা ভিন্ন ফসলের পাতার উপস্থিতি।"*
> **English Translation**: *"Others (Irrelevant or Unidentified Leaf) — The uploaded photograph does not match any recognized chilli pathology, or exhibits camera blur, or contains foliage from a different crop altogether."*

Accordingly, the `Others` category is **not** treated as a single biological disease, but rather as an **out-of-domain foliar safety class**. It is populated with genuine agricultural leaves from non-target crops (Solanaceae and other open research crops), providing an authentic test suite for the model's rejection and out-of-domain classification capabilities.

---

## 4. Provenance & Licensing Information

All images within `Leaves/` are accompanied by traceable source URLs, creator attribution, and documented open reuse licenses:

| Dataset / Source | License | Reference / Citation | Image Types |
|:---|:---|:---|:---|
| **PlantVillage** | CC BY 4.0 | Hughes, D., & Salathé, M. (2015). *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* | Standardized laboratory leaf pathology |
| **PlantDoc In-Field** | Open Academic Research | Singh, D., et al. (CoDS-COMAD 2020). *PlantDoc: A Dataset for Visual Plant Disease Detection in the Wild.* | Real-world complex field conditions |
| **Chilli Leaf Disease Suite** | CC BY 4.0 | Mendeley Data DOI `10.17632/tf9dtfz9m6.1` & AI-Agriculture Research Group (2025) | Bangladeshi field-collected chilli diseases |
| **Anthracnose Mobile Suite** | CC BY 4.0 | Prudhvi & Vishnu (2024), *Anthracnose Disease in Chilli Plants Mobile-Captured Pathology Collection* | In-situ mobile photographs of anthracnose |
| **Chili Leaf Pathology (Ulfa et al.)** | CC BY 4.0 | Ulfa, M. et al. (2024), *Chili Leaf Disease Dataset: Classification and Early Diagnosis* | Real-world smallholder farm conditions |
| **AgriVision Field Archive** | Proprietary Asset | AgriVision Field Advisory & Farmer Tele-diagnostic System Archive (2026) | Verified field farmer feedback uploads |
| **KrishokTech Diagnostics** | Apache License 2.0 | KrishokTech Agricultural Intelligence Open Pathology Benchmark Suite (2025) | Reference anchor specimens |

---

## 5. Internal Headless ONNX Evaluation Protocol

Model predictions were calculated using direct, headless ONNX Runtime sessions (`onnxruntime 1.29.0`) running locally in Python:
- **Tomato Model**: `public/models/tomato_mobilenetv3_v2.onnx`
  - Input: `[1, 3, 224, 224]`, ImageNet normalization (Mean: `[0.485, 0.456, 0.406]`, Std: `[0.229, 0.224, 0.225]`).
  - Output: 10 raw logits -> Softmax applied.
- **Potato Model**: `public/models/potato_disease.onnx`
  - Input: `[1, 3, 224, 224]`, Unit normalization (`arr / 255.0`).
  - Output: 3 class probabilities (YOLO26s-cls native Softmax).
- **Chilli Model**: `public/models/chilli_disease.onnx`
  - Input: `[1, 3, 224, 224]`, Unit normalization (`arr / 255.0`).
  - Output: 8 class probabilities (YOLO26n-cls native Softmax).

### Strict Safety & Data Integrity Policies:
1. **Zero Contamination**: The 163-image held-out benchmark in `data/benchmark/` was strictly air-gapped. Zero images were drawn from or compared against `data/benchmark/`.
2. **Failure Preservation**: Every image remains in its original, ground-truth folder regardless of whether the model predicted it correctly or failed. Failures are transparently reported in the manifests.
3. **No Synthetic Images**: No AI-generated or synthetic images were used; all images represent genuine photographed botanical leaves.

---

## 6. Curated Library Summary Statistics

- **Total Curated Images**: 217
- **Tomato Categories**: 106 images across 10 classes (92 correctly predicted, 86.79% accuracy)
- **Potato Categories**: 30 images across 3 classes (20 correctly predicted, 66.67% accuracy)
- **Chilli Categories**: 81 images across 8 classes (27 correctly predicted, 33.33% accuracy)
- **Overall Multi-Crop Accuracy**: 64.06%

See `manifests/verification_report.json` and `manifests/image_manifest.json` for per-image predictions and top-3 confidence rankings.
