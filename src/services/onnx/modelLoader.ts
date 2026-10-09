const cachedSessions = new Map<string, any>();
const sessionLoadingPromises = new Map<string, Promise<any>>();

export async function loadInferenceSession(
  modelPath: string = '/models/tomato_mobilenetv3_v2.onnx'
): Promise<any> {
  if (cachedSessions.has(modelPath)) {
    return cachedSessions.get(modelPath);
  }

  if (sessionLoadingPromises.has(modelPath)) {
    return sessionLoadingPromises.get(modelPath);
  }

  const promise = (async () => {
    try {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      // Configure wasmPaths to load official WebAssembly binaries in production (Vercel, Netlify, mobile)
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.29.0/dist/';
      
      const response = await fetch(modelPath);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        console.warn(
          `ONNX model file '${modelPath}' not found on server (status: ${response.status}, content-type: ${contentType}). Ensure the file exists in public/models/.`
        );
        return null;
      }
      const modelArrayBuffer = await response.arrayBuffer();

      const session = await ort.InferenceSession.create(modelArrayBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      cachedSessions.set(modelPath, session);
      return session;
    } catch (error) {
      sessionLoadingPromises.delete(modelPath);
      cachedSessions.delete(modelPath);
      console.warn(`ONNX Session creation warning for ${modelPath}:`, error);
      return null;
    }
  })();

  sessionLoadingPromises.set(modelPath, promise);
  return promise;
}
