# AgriVision AI — Independent Benchmark Dataset

This directory contains the standardized, strictly read-only evaluation benchmark for AgriVision AI.

## Strict Rules
1. **Never use for training**: Images in this directory must NEVER be included in retraining datasets or fine-tuning runs.
2. **Never use for threshold tuning**: Confidence and margin thresholds must not be fit to this data.
3. **No synthetic dummies**: All images are genuine, natural or laboratory photographs with certified source labels.

## Contents
- **Total Images**: 163
  - **PlantDoc In-Field Test Split**: 63 images across 8 classes.
  - **PlantVillage Lab Test Samples**: 100 images (10 per class) across all 10 classes.
- **Manifest**: `benchmark_manifest.json` (contains SHA-256 hashes, paths, and metadata).

## Licensing & Attribution
- PlantDoc: CC BY 4.0 (Singh et al., IIIT Delhi, CoDS-COMAD 2020)
- PlantVillage: CC0 1.0 Universal (Hughes & Salathé, Penn State, 2015)
