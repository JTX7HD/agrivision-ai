const cachedSessions = new Map<string, any>();
const sessionLoadingPromises = new Map<string, Promise<any>>();

/**
 * Resolves candidate URLs to locate ONNX model binaries across various deployment configurations
 * (Vite dev server, Vercel root/subpath, PWA scope, or relative paths).
 */
function getCandidateUrls(modelPath: string): string[] {
  if (modelPath.startsWith('http://') || modelPath.startsWith('https://') || modelPath.startsWith('blob:')) {
    return [modelPath];
  }

  const urls: string[] = [];
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;

  // 1. Path resolved with base URL
  urls.push(`${cleanBase}${cleanPath}`);

  // 2. Absolute root path
  const rootPath = `/${cleanPath}`;
  if (!urls.includes(rootPath)) {
    urls.push(rootPath);
  }

  // 3. Absolute URL with origin (if running in a browser)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const originUrl = `${window.location.origin}/${cleanPath}`;
    if (!urls.includes(originUrl)) {
      urls.push(originUrl);
    }
  }

  // 4. Relative path
  if (!urls.includes(cleanPath)) {
    urls.push(cleanPath);
  }

  return urls;
}

/**
 * Clears cached ONNX sessions and in-flight promises.
 */
export function clearModelSessionCache(modelPath?: string): void {
  if (modelPath) {
    cachedSessions.delete(modelPath);
    sessionLoadingPromises.delete(modelPath);
  } else {
    cachedSessions.clear();
    sessionLoadingPromises.clear();
  }
}

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

      const candidateUrls = getCandidateUrls(modelPath);
      let modelArrayBuffer: ArrayBuffer | null = null;
      let lastFetchError: string | null = null;

      for (const url of candidateUrls) {
        try {
          const response = await fetch(url);
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && !contentType.includes('text/html')) {
            modelArrayBuffer = await response.arrayBuffer();
            break;
          } else {
            lastFetchError = `HTTP ${response.status} (Content-Type: ${contentType || 'unknown'}) at ${url}`;
          }
        } catch (fetchErr) {
          lastFetchError = `${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)} at ${url}`;
        }
      }

      if (!modelArrayBuffer) {
        console.warn(
          `ONNX model file '${modelPath}' not found on server. Tried candidates [${candidateUrls.join(', ')}]. Last error: ${lastFetchError}. Ensure the file exists in public/models/.`
        );
        // Evict from promise cache so subsequent retries are not permanently stuck returning null
        sessionLoadingPromises.delete(modelPath);
        return null;
      }

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

