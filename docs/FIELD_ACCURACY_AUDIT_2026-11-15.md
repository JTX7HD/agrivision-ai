# AgriVision AI — Field Generalization Baseline Audit

**Review date:** 15 November 2026  
**Scope:** Read-only inspection of code and saved tomato classification benchmarks on `main`. **This is not a new ONNX inference run.**

## Key measurements from saved 22 October 2026 benchmark

| Tomato test split | Top-1 | Top-2 | Class coverage |
| --- | ---: | ---: | --- |
| PlantVillage sample | **100/100 (100%)** | 100% | 10/10 (10 images per class) |
| PlantDoc field sample | **29/63 (46.03%)** | 63.49% | 8/10 |

The difference is **53.97 percentage points** on these samples. Healthy tomato field recall was **0/8**. Of **34** PlantDoc misclassifications, the default 60% confidence / 10 percentage-point margin rule flagged **17** but missed **17**. **This is a serious field generalization and reliability problem**, not a UI issue.

PlantDoc test support is **zero** for Tomato Target Spot and Two-Spotted Spider Mite. Per-class field accuracy for these two classes is **undefined**.

## Existing comparisons

- `data/benchmark/results/crop_pipeline_comparison.json` reports PlantDoc **46.03% center crop**, **46.03% YOLO leaf crop**, and **44.44% older production pipeline**. YOLO cropping alone did not improve this sample.
- `data/benchmark/results/segmentation_comparison.json` compares unsegmented YOLO crop to **GrabCut** segmentation, not MobileSAM: PlantDoc accuracy **46.03% → 41.27%**; PlantVillage **97% → 78%**. This does *not* establish that the newer MobileSAM implementation helps or hurts classification.
- Current `src/services/pipeline/pipelineOrchestrator.ts` deliberately classifies the **original full image** rather than the YOLO crop or the MobileSAM mask, keeping outputs of the latter as diagnostic artifacts.
- Both `src/services/onnx/imagePreprocessor.ts` and `scripts/evaluate_benchmark.py` describe 224×224 aspect-preserving center cropping with ImageNet normalization for tomato. However, browser-versus-Python pixel and probability parity has **not** been directly tested here.
- Immediate `LIME` explanation code returns predefined values. Detailed perturbation analysis is a separate user-triggered path. Do not treat initial values as evidence that the model used particular leaf regions.

## Root cause hypotheses requiring validation

1. **Domain shift** from lab images to field imagery: complex backgrounds, sunlight and shadows, leaf scale, camera motion and multiple leaves.
2. **Insufficient outdoor training representation**, especially certain tomato disease classes and healthy outdoor leaves.
3. **Annotation/duplicate risk**: `data/field_training_audit/FIELD_TRAINING_AUDIT_REPORT.md` records five excluded exact/near duplicates between an official PlantDoc training split and the held-out test data, including one label contradiction. Verify training exclusions.
4. **Overconfident mistakes**: confidence thresholds alone are not well calibrated on field data.

## Safe development sequence

1. **Keep baseline immutable:** Do not change production ONNX files or any 163-image held-out benchmark samples while diagnosing; run `node scripts/audit_field_benchmark.mjs` or `node scripts/audit_field_benchmark.mjs --json` to inspect saved results.
2. **Parity tests** on *internal validation samples*, comparing image transforms, normalization, logits/probabilities and class mapping in browser and Python. Fix only proven implementation mismatches.
3. **Audit wrong field predictions** and independently review ambiguous images, annotation disagreements, background distraction and multiple-leaf conditions. Do not silently relabel holdout images for favorable scores.
4. **Controlled domain adaptation** using independent PlantDoc train data plus lab anchors, adhering to `data/field_training_audit/TRAINING_PROTOCOL_VALIDATION_REPORT.md`. Selection and tuning must use only internal validation (977 train / 255 validation are described by the existing protocol). Check whether baseline PyTorch checkpoint and source data are locally accessible before training.
5. **Evaluate a frozen candidate** once against the held-out test with accuracy, class-wise recall, macro-F1, healthy recall, confidence-error interception, confusion matrix, latency, class support, and a PlantVillage regression check. Do not repeatedly tune candidates against the final holdout.
6. **Deploy only verified improvements**. No guaranteed field accuracy target is promised.

## Limitations

This audit is derived from **committed historical metrics**; it has not rerun ONNX inference, checked runtime deployment, or performed GPU retraining. The 63-image PlantDoc subset tests tomato only and cannot quantify potato or chilli field accuracy. New real-farm, independent images will be needed to assess practical reliability.
