import type { CropId, ClassifierModelInfo } from '../../models/types';
import type { FormattedONNXResult } from '../onnx/resultFormatter';
import { runONNXInference } from '../onnx/inferenceEngine';
import type { IDiseaseClassifier } from './types';

/**
 * Baseline Production Candidate Classifier: MobileNetV3 V2
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

export class MobileNetV3Classifier implements IDiseaseClassifier {
  public readonly name = 'MobileNetV3 V2 Disease Classification';
  public readonly modelIdentifier = 'best_tomato_mobilenetv3_v2.pth';
  public readonly modelInfo: ClassifierModelInfo = MOBILENETV3_V2_METADATA;

  public async classify(
    imageDataUrl: string,
    _cropId: CropId,
    options?: { modelPath?: string }
  ): Promise<FormattedONNXResult> {
    const modelPath = options?.modelPath || '/models/tomato_mobilenetv3_v2.onnx';
    return await runONNXInference(imageDataUrl, modelPath);
  }
}

/**
 * Singleton instance of baseline classifier
 */
export const defaultDiseaseClassifier = new MobileNetV3Classifier();
