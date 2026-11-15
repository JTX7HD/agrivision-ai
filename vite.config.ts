import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/') && req.url !== '/predict' && !req.url?.startsWith('/predict?')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = urlObj.pathname;

          // Helper to parse request body for POST/PUT requests
          let body: unknown = undefined;
          let rawBuffer: Buffer | undefined = undefined;
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            rawBuffer = Buffer.concat(chunks);
            const rawBody = rawBuffer.toString('utf-8');
            try {
              body = JSON.parse(rawBody);
            } catch {
              body = rawBody;
            }
          }

          const query = Object.fromEntries(urlObj.searchParams.entries());
          const reqAny = req as unknown as { query: Record<string, string>; body: unknown; rawBuffer?: Buffer };
          reqAny.query = query;
          reqAny.body = body;
          reqAny.rawBuffer = rawBuffer;

          const resAny = res as unknown as {
            status: (code: number) => typeof resAny;
            json: (data: unknown) => typeof resAny;
            send: (data: unknown) => typeof resAny;
          };

          resAny.status = (statusCode: number) => {
            res.statusCode = statusCode;
            return resAny;
          };

          resAny.json = (data: unknown) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return resAny;
          };

          resAny.send = (data: unknown) => {
            res.end(data);
            return resAny;
          };

          if (pathname === '/predict') {
            const { default: predictHandler } = await import('./api/predict.ts');
            return await predictHandler(req as never, res as never);
          } else if (pathname === '/api/corrections/export') {
            const { default: exportHandler } = await import('./api/corrections/export.ts');
            return await exportHandler(req as never, res as never);
          } else if (pathname === '/api/corrections') {
            const { default: correctionsHandler } = await import('./api/corrections/index.ts');
            return await correctionsHandler(req as never, res as never);
          } else if (pathname === '/api/training/status') {
            const { default: trainingHandler } = await import('./api/training/status.ts');
            return await trainingHandler(req as never, res as never);
          }

          next();
        } catch (err) {
          console.error('API Dev Server error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal API Server Error', details: String(err) }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiDevServerPlugin()
  ],
  server: {
    host: true,
    port: 3000
  }
});
