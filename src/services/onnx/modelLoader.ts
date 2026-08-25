import * as ort from 'onnxruntime-web';

let cachedSession: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;

export async function loadInferenceSession(
  modelPath: string = '/models/tomato_disease_mobilenetv3.onnx'
): Promise<ort.InferenceSession> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionLoadingPromise) {
    return sessionLoadingPromise;
  }

  sessionLoadingPromise = (async () => {
    try {
      // Configure WASM path if needed for ONNX Runtime Web
      ort.env.wasm.numThreads = 1;
      
      // Fetch model binary as ArrayBuffer for resilient client-side execution
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`Failed to load ONNX model file from ${modelPath}: ${response.statusText}`);
      }
      const modelArrayBuffer = await response.arrayBuffer();

      // Create reusable inference session
      const session = await ort.InferenceSession.create(modelArrayBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      cachedSession = session;
      return session;
    } catch (error) {
      sessionLoadingPromise = null;
      throw new Error(`ONNX Model Load Error (${modelPath}): ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return sessionLoadingPromise;
}
