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
      // Dynamic import to prevent main-bundle bloat and ensure fast initial React render on Vercel
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`Failed to load ONNX model file from ${modelPath}: ${response.statusText}`);
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
      throw new Error(`ONNX Model Load Error (${modelPath}): ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return sessionLoadingPromise;
}
