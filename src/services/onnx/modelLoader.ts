let cachedSession: any = null;
let sessionLoadingPromise: Promise<any> | null = null;

export async function loadInferenceSession(
  modelPath: string = '/models/tomato_disease_mobilenetv3.onnx'
): Promise<any> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionLoadingPromise) {
    return sessionLoadingPromise;
  }

  sessionLoadingPromise = (async () => {
    try {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      
      const response = await fetch(modelPath);
      if (!response.ok) {
        console.warn(`ONNX model file fetch warning from ${modelPath}: ${response.statusText}`);
        return null;
      }
      const modelArrayBuffer = await response.arrayBuffer();

      const session = await ort.InferenceSession.create(modelArrayBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      cachedSession = session;
      return session;
    } catch (error) {
      sessionLoadingPromise = null;
      console.warn(`ONNX Session creation warning for ${modelPath}:`, error);
      return null;
    }
  })();

  return sessionLoadingPromise;
}
