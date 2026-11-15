import type { CropId, ClassifierModelInfo } from '../../models/types';
import type { FormattedONNXResult, ResultFormatterOptions } from '../onnx/resultFormatter';
import { runONNXInference } from '../onnx/inferenceEngine';
import type { IDiseaseClassifier } from './types';
import { getCropClassifierAdapter, TomatoClassifierAdapter } from './cropAdapters';

/**
 * Baseline Production Candidate Classifier: MobileNetV3 V2 (Tomato)
 * Checkpoint: best_tomato_mobilenetv3_v2.pth
 * Benchmark Evaluations:
 * - PlantVillage test accuracy: 99.56%
 * - PlantDoc test accuracy: 47.54%
 */
export const MOBILENETV3_V2_METADATA: ClassifierModelInfo = {
  modelName: 'MobileNetV3 V2',
  version: '2.0-baseline',
  checkpoint: 'best_tomato_mobilenetv3_v2.pth',
  plantVillageAccuracy: 99.56,
  plantDocAccuracy: 47.54,
  description: 'MobileNetV3 V2 baseline production classifier trained for tomato leaf pathology identification.',
  executionProvider: 'ONNX Runtime WebAssembly (WASM)',
  inputShape: [1, 3, 224, 224],
  outputShape: [1, 10]
};

export class MultiCropDiseaseClassifier implements IDiseaseClassifier {
  public readonly name = 'Multi-Crop Disease Classification Engine';
  public readonly modelIdentifier = 'best_tomato_mobilenetv3_v2.pth';
  public readonly modelInfo: ClassifierModelInfo = MOBILENETV3_V2_METADATA;

  private tomatoAdapter = new TomatoClassifierAdapter();

  public async classify(
    imageDataUrl: string,
    cropId: CropId,
    options?: { modelPath?: string; uncertaintyConfig?: ResultFormatterOptions }
  ): Promise<FormattedONNXResult> {
    // Tomato retains 100% backwards-compatible baseline pipeline
    if (cropId === 'tomato' || !cropId) {
      if (options?.modelPath) {
        return await runONNXInference(imageDataUrl, options.modelPath, options.uncertaintyConfig);
      }
      return await this.tomatoAdapter.classify(imageDataUrl, options?.uncertaintyConfig);
    }

    // Isolated crop routing: Dispatch strictly to dedicated crop adapter
    // Prohibits cross-routing non-tomato foliage to tomato classifier
    const adapter = getCropClassifierAdapter(cropId);
    return await adapter.classify(imageDataUrl, options?.uncertaintyConfig);
  }
}

/**
 * Backward compatibility alias
 */
export const MobileNetV3Classifier = MultiCropDiseaseClassifier;

/**
 * Singleton instance of classifier engine
 */
export const defaultDiseaseClassifier = new MultiCropDiseaseClassifier();
