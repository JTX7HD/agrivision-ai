import { loadInferenceSession } from './modelLoader';
import { preprocessImageToTensor } from './imagePreprocessor';
import { computeSoftmax } from './softmax';
import { formatInferenceResult, type FormattedONNXResult } from './resultFormatter';
import { TOMATO_DISEASE_CLASSES } from './classMapper';

export async function runONNXInference(
  imageDataUrl: string,
  modelPath: string = '/models/tomato_mobilenetv3_v2.onnx'
): Promise<FormattedONNXResult> {
  const startTime = performance.now();

  // Step 1: Preprocess image into Float32 CHW normalized tensor [1, 3, 224, 224]
  // Preprocessing uses standard ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
  const float32Data = await preprocessImageToTensor(imageDataUrl, 224, 224);

  let rawLogitsArray: number[] | null = null;
  const executionProvider = 'ONNX Runtime WebAssembly (WASM)';

  // Step 2: Load & execute real MobileNetV3 V2 ONNX session via onnxruntime-web
  const session = await loadInferenceSession(modelPath);
  if (!session) {
    throw new Error(
      `Failed to initialize ONNX inference session from '${modelPath}'. Ensure the production model 'tomato_mobilenetv3_v2.onnx' is placed in public/models/.`
    );
  }

  const ort = await import('onnxruntime-web');
  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
  const inputName = session.inputNames[0] || 'input_leaf_tensor';
  const feeds: Record<string, any> = { [inputName]: inputTensor };

  const results = await session.run(feeds);
  const outputName = session.outputNames[0] || 'disease_probabilities';
  const outputTensor = results[outputName];

  if (!outputTensor || !outputTensor.data || outputTensor.data.length !== 10) {
    const receivedCount = outputTensor?.data?.length ?? 0;
    throw new Error(
      `Incompatible ONNX output dimension: expected exactly 10 disease logits, received ${receivedCount}. Model '${modelPath}' must output shape [1, 10].`
    );
  }

  rawLogitsArray = Array.from(outputTensor.data as Float32Array);

  // Note: All fake, synthetic, and heuristic fallback models have been eliminated.
  // Execution strictly evaluates genuine production neural network logits.

  // Step 3: Compute Softmax Probabilities from actual logits
  const probabilities = computeSoftmax(rawLogitsArray);

  // Step 4: Find Selected Class Index & Confidence
  let maxProb = -1;
  let selectedClassIndex = 0;
  probabilities.forEach((prob, idx) => {
    if (prob > maxProb) {
      maxProb = prob;
      selectedClassIndex = idx;
    }
  });

  const selectedClass = TOMATO_DISEASE_CLASSES.find((c) => c.index === selectedClassIndex) || TOMATO_DISEASE_CLASSES[0];
  const confidencePercent = Math.round(maxProb * 1000) / 10;

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  // Step 5: VERBOSE LOGGING
  console.group('%c[AgriVision AI] MobileNetV3 V2 ONNX Inference Pipeline Trace', 'color: #10b981; font-weight: bold; font-size: 13px;');
  console.log('1. Model Path:', modelPath);
  console.log('2. Image Dimensions (Resized Target): 224 x 224');
  console.log('3. Preprocessed Tensor Dimensions: [1, 3, 224, 224]');
  console.log('4. ONNX Input Name:', inputName);
  console.log('5. ONNX Output Name:', outputName);
  console.log('6. Output Class Values Count:', rawLogitsArray.length);
  console.log('7. Raw Model Logits:', rawLogitsArray);
  console.log('8. Softmax Probabilities:', probabilities.map(p => (p * 100).toFixed(2) + '%'));
  console.log('9. Selected Class Index:', selectedClassIndex);
  console.log('10. Selected Class Name:', selectedClass.className);
  console.log('11. Calculated Confidence:', confidencePercent + '%');
  console.log('12. Execution Provider:', executionProvider);
  console.log('13. Inference Duration:', durationMs + 'ms');
  console.groupEnd();

  // Step 6: Return formatted result
  return formatInferenceResult(probabilities, rawLogitsArray, Math.max(1, durationMs));
}
