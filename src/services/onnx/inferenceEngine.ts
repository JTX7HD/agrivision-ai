import { loadInferenceSession } from './modelLoader';
import { preprocessImageToTensor } from './imagePreprocessor';
import { computeSoftmax } from './softmax';
import { formatInferenceResult, type FormattedONNXResult } from './resultFormatter';

export async function runONNXInference(
  imageDataUrl: string,
  modelPath: string = '/models/tomato_disease_mobilenetv3.onnx'
): Promise<FormattedONNXResult> {
  const startTime = performance.now();

  // Dynamic import onnxruntime-web for client-side tensor construction
  const ort = await import('onnxruntime-web');

  // 1. Load ONNX model once (reused via singleton)
  const session = await loadInferenceSession(modelPath);

  // 2. Preprocess image: RGB -> Resize 224x224 -> [0,1] -> ImageNet mean/std -> CHW Float32 tensor
  const float32Data = await preprocessImageToTensor(imageDataUrl, 224, 224);

  // 3. Construct ONNX input tensor of shape [1, 3, 224, 224]
  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);

  // Determine input and output tensor names from session metadata
  const inputName = session.inputNames[0] || 'input';
  const feeds: Record<string, any> = { [inputName]: inputTensor };

  // 4. Run model inference locally in the browser
  const results = await session.run(feeds);

  // Get output logits tensor
  const outputName = session.outputNames[0] || 'output';
  const outputTensor = results[outputName];

  if (!outputTensor || !outputTensor.data) {
    throw new Error('ONNX model execution did not return valid output tensor data.');
  }

  const rawLogits = outputTensor.data as Float32Array;

  // 5. Apply Softmax to raw logits
  const probabilities = computeSoftmax(rawLogits);

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  // 6. Map to disease class & format result
  return formatInferenceResult(probabilities, Math.max(1, durationMs));
}
