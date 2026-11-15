import { loadInferenceSession } from './modelLoader';
import { preprocessImageToTensor, type PreprocessNormalization } from './imagePreprocessor';
import { computeSoftmax } from './softmax';
import { formatInferenceResult, type FormattedONNXResult, type ResultFormatterOptions } from './resultFormatter';
import { TOMATO_DISEASE_CLASSES, type ClassMappingEntry } from './classMapper';

export interface ONNXInferenceOptions extends ResultFormatterOptions {
  normalization?: PreprocessNormalization;
  expectedClassCount?: number;
  hasSoftmax?: boolean;
  supportedClasses?: ClassMappingEntry[];
}

export async function runONNXInference(
  imageDataUrl: string,
  modelPath: string = '/models/tomato_mobilenetv3_v2.onnx',
  options?: ONNXInferenceOptions
): Promise<FormattedONNXResult> {
  const startTime = performance.now();

  const normalization: PreprocessNormalization = options?.normalization ?? 'imagenet';
  const expectedCount = options?.expectedClassCount ?? 10;
  const classes = options?.supportedClasses ?? TOMATO_DISEASE_CLASSES;

  // Step 1: Preprocess image into Float32 CHW normalized tensor [1, 3, 224, 224]
  // Tomato uses standard ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
  // Potato & Chilli use strict [0.0, 1.0] pixel / 255.0 normalization
  const float32Data = await preprocessImageToTensor(imageDataUrl, 224, 224, normalization);

  let rawLogitsArray: number[] | null = null;
  const executionProvider = 'ONNX Runtime WebAssembly (WASM)';

  // Step 2: Load & execute real ONNX session via onnxruntime-web
  const session = await loadInferenceSession(modelPath);
  if (!session) {
    throw new Error(
      `Failed to initialize ONNX inference session from '${modelPath}'. Ensure the model is placed in public/models/.`
    );
  }

  const ort = await import('onnxruntime-web');
  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
  const inputName = session.inputNames[0] || 'images';
  const feeds: Record<string, any> = { [inputName]: inputTensor };

  const results = await session.run(feeds);
  const outputName = session.outputNames[0] || 'output0';
  const outputTensor = results[outputName];

  if (!outputTensor || !outputTensor.data || outputTensor.data.length !== expectedCount) {
    const receivedCount = outputTensor?.data?.length ?? 0;
    throw new Error(
      `Incompatible ONNX output dimension: expected exactly ${expectedCount} disease logits/probabilities, received ${receivedCount}. Model '${modelPath}' must output shape [1, ${expectedCount}].`
    );
  }

  rawLogitsArray = Array.from(outputTensor.data as Float32Array);

  // Step 3: Compute Softmax Probabilities from actual logits
  // If model already produced softmax probabilities (e.g. YOLO-cls models with Softmax head), bypass redundant softmax
  let probabilities: number[];
  const sumValues = rawLogitsArray.reduce((acc, v) => acc + v, 0);
  const looksLikeProbabilities = Math.abs(sumValues - 1.0) < 0.05 && rawLogitsArray.every(v => v >= -0.01 && v <= 1.01);

  if (options?.hasSoftmax || looksLikeProbabilities) {
    probabilities = [...rawLogitsArray];
  } else {
    probabilities = computeSoftmax(rawLogitsArray);
  }

  // Step 4: Find Selected Class Index & Confidence
  let maxProb = -1;
  let selectedClassIndex = 0;
  probabilities.forEach((prob, idx) => {
    if (prob > maxProb) {
      maxProb = prob;
      selectedClassIndex = idx;
    }
  });

  const selectedClass = classes.find((c) => c.index === selectedClassIndex) || classes[0];
  const confidencePercent = Math.round(maxProb * 1000) / 10;

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  // Step 5: VERBOSE LOGGING
  console.group('%c[AgriVision AI] ONNX Inference Pipeline Trace', 'color: #10b981; font-weight: bold; font-size: 13px;');
  console.log('1. Model Path:', modelPath);
  console.log('2. Image Dimensions (Resized Target): 224 x 224');
  console.log('3. Preprocessed Tensor Dimensions: [1, 3, 224, 224], Normalization:', normalization);
  console.log('4. ONNX Input Name:', inputName);
  console.log('5. ONNX Output Name:', outputName);
  console.log('6. Output Class Values Count:', rawLogitsArray.length);
  console.log('7. Raw Model Output Values:', rawLogitsArray);
  console.log('8. Softmax / Probabilities:', probabilities.map(p => (p * 100).toFixed(2) + '%'));
  console.log('9. Selected Class Index:', selectedClassIndex);
  console.log('10. Selected Class Name:', selectedClass.className);
  console.log('11. Calculated Confidence:', confidencePercent + '%');
  console.log('12. Execution Provider:', executionProvider);
  console.log('13. Inference Duration:', durationMs + 'ms');
  console.groupEnd();

  // Step 6: Return formatted result
  return formatInferenceResult(probabilities, rawLogitsArray, Math.max(1, durationMs), {
    ...options,
    modelName: options?.modelName || `MobileNetV3 V2 (${modelPath})`,
    supportedClasses: classes
  });
}
