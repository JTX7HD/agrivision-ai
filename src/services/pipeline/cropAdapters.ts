import type { CropId, ClassifierModelInfo, DiseaseKnowledge } from '../../models/types';
import type { FormattedONNXResult, ResultFormatterOptions } from '../onnx/resultFormatter';
import { runONNXInference } from '../onnx/inferenceEngine';
import { TOMATO_DISEASE_CLASSES, type ClassMappingEntry } from '../onnx/classMapper';
import { DISEASES_KNOWLEDGE_BASE } from '../../data/diseasesData';

export class CropModelUnavailableError extends Error {
  public readonly cropId: CropId;
  public readonly expectedModelPath: string;

  constructor(cropId: CropId, expectedModelPath: string) {
    super(
      `Dedicated trained model for '${cropId}' (expected at '${expectedModelPath}') is not installed. ` +
      `Automated routing to another crop's model (e.g. Tomato) is strictly prohibited by AgriVision AI safety boundaries.`
    );
    this.name = 'CropModelUnavailableError';
    this.cropId = cropId;
    this.expectedModelPath = expectedModelPath;
  }
}

export interface ICropClassifierAdapter {
  readonly cropId: CropId;
  readonly cropName: string;
  readonly modelInfo: ClassifierModelInfo;
  readonly supportedClasses: ClassMappingEntry[];
  classify(imageDataUrl: string, uncertaintyConfig?: ResultFormatterOptions): Promise<FormattedONNXResult>;
  mapClassIndexToDisease(classIndex: number): DiseaseKnowledge;
}

/**
 * Production Candidate Tomato Classifier Adapter (MobileNetV3 V2)
 */
export class TomatoClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'tomato';
  public readonly cropName = 'Tomato (Solanum lycopersicum)';
  public readonly supportedClasses = TOMATO_DISEASE_CLASSES;

  public readonly modelInfo: ClassifierModelInfo = {
    modelName: 'MobileNetV3 V2',
    version: '2.0-baseline',
    checkpoint: 'best_tomato_mobilenetv3_v2.pth',
    plantVillageAccuracy: 99.56,
    plantDocAccuracy: 47.54,
    description: 'Production tomato foliar disease classifier with dual-domain regularization and uncertainty gating.',
    executionProvider: 'ONNX Runtime WebAssembly (WASM)',
    inputShape: [1, 3, 224, 224],
    outputShape: [1, 10]
  };

  public async classify(
    imageDataUrl: string,
    uncertaintyConfig?: ResultFormatterOptions
  ): Promise<FormattedONNXResult> {
    return await runONNXInference(imageDataUrl, '/models/tomato_mobilenetv3_v2.onnx', {
      ...uncertaintyConfig,
      modelName: `${this.modelInfo.modelName} (/models/tomato_mobilenetv3_v2.onnx)`,
      normalization: 'imagenet',
      expectedClassCount: 10,
      hasSoftmax: false,
      supportedClasses: this.supportedClasses,
      mapClassIndexToDisease: (idx) => this.mapClassIndexToDisease(idx)
    });
  }

  public mapClassIndexToDisease(classIndex: number): DiseaseKnowledge {
    const entry = this.supportedClasses.find((c) => c.index === classIndex);
    const dbId = entry ? entry.databaseId : 'tomato-healthy';
    return DISEASES_KNOWLEDGE_BASE[dbId] || DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
  }
}

/**
 * Verified KrishokTech Potato Pathology Classifier (YOLO26s-cls)
 * Authoritative 3 classes strictly matching potato_class_names.json:
 * 0 Potato__Early_Blight
 * 1 Potato__Healthy_Leaf
 * 2 Potato__Late_Blight
 */
export const POTATO_DISEASE_CLASSES: ClassMappingEntry[] = [
  { index: 0, className: 'Potato__Early_Blight', databaseId: 'potato-early-blight', displayName: 'Potato Early Blight' },
  { index: 1, className: 'Potato__Healthy_Leaf', databaseId: 'potato-healthy', displayName: 'Healthy Potato Leaf' },
  { index: 2, className: 'Potato__Late_Blight', databaseId: 'potato-late-blight', displayName: 'Potato Late Blight' }
];

export const POTATO_MODEL_METADATA: ClassifierModelInfo = {
  modelName: 'YOLO26s Potato Pathology Classifier',
  version: '1.0-krishoktech',
  checkpoint: 'potato_disease.onnx',
  plantVillageAccuracy: 98.4,
  plantDocAccuracy: 96.8,
  description: 'Verified KrishokTech YOLO26s-cls potato pathology classifier for Early Blight, Late Blight, and Healthy foliage.',
  executionProvider: 'ONNX Runtime WebAssembly (WASM)',
  inputShape: [1, 3, 224, 224],
  outputShape: [1, 3]
};

export class PotatoClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'potato';
  public readonly cropName = 'Potato (Solanum tuberosum)';
  public readonly supportedClasses = POTATO_DISEASE_CLASSES;
  public readonly expectedModelPath = '/models/potato_disease.onnx';
  public readonly modelInfo: ClassifierModelInfo = POTATO_MODEL_METADATA;

  public async classify(
    imageDataUrl: string,
    uncertaintyConfig?: ResultFormatterOptions
  ): Promise<FormattedONNXResult> {
    try {
      return await runONNXInference(imageDataUrl, this.expectedModelPath, {
        ...uncertaintyConfig,
        modelName: `${this.modelInfo.modelName} (${this.expectedModelPath})`,
        normalization: 'unit',
        expectedClassCount: 3,
        hasSoftmax: true,
        supportedClasses: this.supportedClasses,
        mapClassIndexToDisease: (idx) => this.mapClassIndexToDisease(idx)
      });
    } catch (err) {
      if (err instanceof CropModelUnavailableError) throw err;
      throw new CropModelUnavailableError(this.cropId, this.expectedModelPath);
    }
  }

  public mapClassIndexToDisease(classIndex: number): DiseaseKnowledge {
    const entry = this.supportedClasses.find((c) => c.index === classIndex);
    const dbId = entry ? entry.databaseId : 'potato-healthy';
    return DISEASES_KNOWLEDGE_BASE[dbId] || DISEASES_KNOWLEDGE_BASE['potato-healthy'];
  }
}

/**
 * Verified KrishokTech Chilli Pathology Classifier (YOLO26n-cls)
 * Authoritative 8 classes strictly matching chilli_class_names.json:
 * 0 Bacterial Spot
 * 1 Cercospora Leaf Spot
 * 2 Chilli Leaf Curl Virus
 * 3 Healthy Leaf
 * 4 Nutrient Deficiency
 * 5 Others
 * 6 Powdery Mildew
 * 7 White Spot / Anthracnose
 */
export const CHILLI_DISEASE_CLASSES: ClassMappingEntry[] = [
  { index: 0, className: 'Chili__Bacterial_Spot', databaseId: 'chilli-bacterial-spot', displayName: 'Chilli Bacterial Spot' },
  { index: 1, className: 'Chili__Cercospora_Leaf_Spot', databaseId: 'chilli-cercospora-leaf-spot', displayName: 'Chilli Cercospora Leaf Spot' },
  { index: 2, className: 'Chili__Curl_Virus', databaseId: 'chilli-leaf-curl-virus', displayName: 'Chilli Leaf Curl Virus' },
  { index: 3, className: 'Chili__Healthy_Leaf', databaseId: 'chilli-healthy', displayName: 'Healthy Chilli Leaf' },
  { index: 4, className: 'Chili__Nutrition_Deficiency', databaseId: 'chilli-nutrient-deficiency', displayName: 'Chilli Nutrient Deficiency' },
  { index: 5, className: 'Others', databaseId: 'chilli-others', displayName: 'Other / Unidentified Leaf' },
  { index: 6, className: 'Chili__Powdery_Mildew', databaseId: 'chilli-powdery-mildew', displayName: 'Chilli Powdery Mildew' },
  { index: 7, className: 'Chili__White_Spot', databaseId: 'chilli-white-spot', displayName: 'Chilli Anthracnose / White Spot' }
];

export const CHILLI_MODEL_METADATA: ClassifierModelInfo = {
  modelName: 'YOLO26n Chilli Pathology Classifier',
  version: '1.0-krishoktech',
  checkpoint: 'chilli_disease.onnx',
  plantVillageAccuracy: 95.0,
  plantDocAccuracy: 92.0,
  description: 'Verified KrishokTech YOLO26n-cls chilli foliar classifier supporting 8 authoritative agronomic classes.',
  executionProvider: 'ONNX Runtime WebAssembly (WASM)',
  inputShape: [1, 3, 224, 224],
  outputShape: [1, 8]
};

export class ChilliClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'chilli';
  public readonly cropName = 'Chilli Pepper (Capsicum annuum)';
  public readonly supportedClasses = CHILLI_DISEASE_CLASSES;
  public readonly expectedModelPath = '/models/chilli_disease.onnx';
  public readonly modelInfo: ClassifierModelInfo = CHILLI_MODEL_METADATA;

  public async classify(
    imageDataUrl: string,
    uncertaintyConfig?: ResultFormatterOptions
  ): Promise<FormattedONNXResult> {
    try {
      return await runONNXInference(imageDataUrl, this.expectedModelPath, {
        ...uncertaintyConfig,
        modelName: `${this.modelInfo.modelName} (${this.expectedModelPath})`,
        normalization: 'unit',
        expectedClassCount: 8,
        hasSoftmax: true,
        supportedClasses: this.supportedClasses,
        mapClassIndexToDisease: (idx) => this.mapClassIndexToDisease(idx)
      });
    } catch (err) {
      if (err instanceof CropModelUnavailableError) throw err;
      throw new CropModelUnavailableError(this.cropId, this.expectedModelPath);
    }
  }

  public mapClassIndexToDisease(classIndex: number): DiseaseKnowledge {
    const entry = this.supportedClasses.find((c) => c.index === classIndex);
    const dbId = entry ? entry.databaseId : 'chilli-healthy';
    return DISEASES_KNOWLEDGE_BASE[dbId] || DISEASES_KNOWLEDGE_BASE['chilli-healthy'] || DISEASES_KNOWLEDGE_BASE['pepper-healthy'];
  }
}

// Backward-compatibility aliases for legacy tests and references
export const PepperClassifierAdapter = ChilliClassifierAdapter;
export const PEPPER_DISEASE_CLASSES = CHILLI_DISEASE_CLASSES;

/**
 * Isolated Maize Classifier Adapter (Corn)
 */
export const MAIZE_DISEASE_CLASSES: ClassMappingEntry[] = [
  { index: 0, className: 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', databaseId: 'maize-gray-leaf-spot', displayName: 'Corn Gray Leaf Spot' },
  { index: 1, className: 'Corn_(maize)___Common_rust_', databaseId: 'maize-common-rust', displayName: 'Corn Common Rust' },
  { index: 2, className: 'Corn_(maize)___Northern_Leaf_Blight', databaseId: 'maize-northern-blight', displayName: 'Northern Corn Leaf Blight' },
  { index: 3, className: 'Corn_(maize)___healthy', databaseId: 'maize-healthy', displayName: 'Healthy Corn Leaf' }
];

export class MaizeClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'maize';
  public readonly cropName = 'Maize / Corn (Zea mays)';
  public readonly supportedClasses = MAIZE_DISEASE_CLASSES;
  public readonly expectedModelPath = '/models/maize_mobilenetv2.onnx';

  public readonly modelInfo: ClassifierModelInfo = {
    modelName: 'MobileNetV2 Maize Classifier',
    version: '1.0-quarantined',
    checkpoint: 'maize_mobilenetv2.onnx',
    plantVillageAccuracy: 98.7,
    plantDocAccuracy: 0.0,
    description: 'Dedicated maize foliar disease classifier for Rust, Northern Blight, Gray Leaf Spot, and Healthy leaves.',
    executionProvider: 'ONNX Runtime WebAssembly (WASM)',
    inputShape: [1, 3, 224, 224],
    outputShape: [1, 4]
  };

  public async classify(
    imageDataUrl: string,
    uncertaintyConfig?: ResultFormatterOptions
  ): Promise<FormattedONNXResult> {
    try {
      return await runONNXInference(imageDataUrl, this.expectedModelPath, uncertaintyConfig);
    } catch {
      throw new CropModelUnavailableError(this.cropId, this.expectedModelPath);
    }
  }

  public mapClassIndexToDisease(classIndex: number): DiseaseKnowledge {
    const entry = this.supportedClasses.find((c) => c.index === classIndex);
    const dbId = entry ? entry.databaseId : 'maize-healthy';
    return DISEASES_KNOWLEDGE_BASE[dbId] || DISEASES_KNOWLEDGE_BASE['maize-healthy'];
  }
}

/**
 * Isolated Rice Classifier Adapter (Guards against silent fallback to Tomato)
 */
export class RiceClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'rice';
  public readonly cropName = 'Rice (Oryza sativa)';
  public readonly expectedModelPath = '/models/rice_classifier.onnx';
  public readonly supportedClasses: ClassMappingEntry[] = [];

  public readonly modelInfo: ClassifierModelInfo = {
    modelName: 'Rice Pathology Classifier',
    version: 'uninstalled',
    checkpoint: 'rice_classifier.onnx',
    plantVillageAccuracy: 0,
    plantDocAccuracy: 0,
    description: 'Standalone rice foliar disease classifier (not yet installed).',
    executionProvider: 'ONNX Runtime WebAssembly (WASM)',
    inputShape: [1, 3, 224, 224],
    outputShape: [1, 4]
  };

  public async classify(): Promise<FormattedONNXResult> {
    throw new CropModelUnavailableError(this.cropId, this.expectedModelPath);
  }

  public mapClassIndexToDisease(): DiseaseKnowledge {
    return DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
  }
}

/**
 * Isolated Banana Classifier Adapter (Guards against silent fallback to Tomato)
 */
export class BananaClassifierAdapter implements ICropClassifierAdapter {
  public readonly cropId: CropId = 'banana';
  public readonly cropName = 'Banana (Musa acuminata)';
  public readonly expectedModelPath = '/models/banana_classifier.onnx';
  public readonly supportedClasses: ClassMappingEntry[] = [];

  public readonly modelInfo: ClassifierModelInfo = {
    modelName: 'Banana Pathology Classifier',
    version: 'uninstalled',
    checkpoint: 'banana_classifier.onnx',
    plantVillageAccuracy: 0,
    plantDocAccuracy: 0,
    description: 'Standalone banana foliar disease classifier (not yet installed).',
    executionProvider: 'ONNX Runtime WebAssembly (WASM)',
    inputShape: [1, 3, 224, 224],
    outputShape: [1, 4]
  };

  public async classify(): Promise<FormattedONNXResult> {
    throw new CropModelUnavailableError(this.cropId, this.expectedModelPath);
  }

  public mapClassIndexToDisease(): DiseaseKnowledge {
    return DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
  }
}

/**
 * Master Registry of Isolated Crop Adapters
 */
export const CROP_ADAPTER_REGISTRY: Record<CropId, ICropClassifierAdapter> = {
  tomato: new TomatoClassifierAdapter(),
  potato: new PotatoClassifierAdapter(),
  chilli: new ChilliClassifierAdapter(),
  maize: new MaizeClassifierAdapter(),
  rice: new RiceClassifierAdapter(),
  banana: new BananaClassifierAdapter()
};

export function getCropClassifierAdapter(cropId: CropId | string): ICropClassifierAdapter {
  const normalizedId = (cropId === 'pepper' ? 'chilli' : cropId) as CropId;
  const adapter = CROP_ADAPTER_REGISTRY[normalizedId];
  if (!adapter) {
    throw new CropModelUnavailableError(cropId as CropId, `/models/${cropId}_classifier.onnx`);
  }
  return adapter;
}
