import { loadInferenceSession } from './modelLoader';
import { preprocessImageToTensor } from './imagePreprocessor';
import { computeSoftmax } from './softmax';
import { formatInferenceResult, type FormattedONNXResult } from './resultFormatter';
import { TOMATO_DISEASE_CLASSES } from './classMapper';

export async function runONNXInference(
  imageDataUrl: string,
  modelPath: string = '/models/tomato_disease_mobilenetv3.onnx'
): Promise<FormattedONNXResult> {
  const startTime = performance.now();

  // Step 1: Preprocess image into Float32 CHW normalized tensor [1, 3, 224, 224]
  const float32Data = await preprocessImageToTensor(imageDataUrl, 224, 224);
  const ort = await import('onnxruntime-web');

  // Load ONNX Session
  const session = await loadInferenceSession(modelPath);

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
  const inputName = session.inputNames[0] || 'input';
  const feeds: Record<string, any> = { [inputName]: inputTensor };

  // Step 2: Execute ONNX model session directly in WASM runtime
  const results = await session.run(feeds);
  const outputName = session.outputNames[0] || 'output';
  const outputTensor = results[outputName];

  if (!outputTensor || !outputTensor.data) {
    throw new Error('ONNX model execution did not return valid output tensor data.');
  }

  const rawLogitsTyped = outputTensor.data as Float32Array;
  const rawLogitsArray = Array.from(rawLogitsTyped);

  // Step 3: Compute Softmax Probabilities from actual model logits
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

  // Step 5: VERBOSE LOGGING (Section 13)
  console.group('%c[AgriVision AI] MobileNetV3 ONNX Inference Pipeline Trace', 'color: #10b981; font-weight: bold; font-size: 13px;');
  console.log('1. Uploaded Image Source:', imageDataUrl.slice(0, 80) + '...');
  console.log('2. Image Dimensions (Resized Target): 224 x 224');
  console.log('3. Preprocessed Tensor Dimensions: [1, 3, 224, 224]');
  console.log('4. ONNX Input Name:', inputName);
  console.log('5. ONNX Output Dimensions:', outputTensor.dims || [1, 10]);
  console.log('6. Raw Model Logits:', rawLogitsArray);
  console.log('7. Softmax Probabilities:', probabilities.map(p => (p * 100).toFixed(2) + '%'));
  console.log('8. Selected Class Index:', selectedClassIndex);
  console.log('9. Selected Class Name:', selectedClass.className);
  console.log('10. Calculated Confidence:', confidencePercent + '%');
  console.log('11. Inference Execution Duration:', durationMs + 'ms');
  console.groupEnd();

  // Step 6: Return formatted result
  return formatInferenceResult(probabilities, rawLogitsArray, Math.max(1, durationMs));
}
