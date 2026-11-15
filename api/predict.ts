import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

interface CustomRequest extends VercelRequest {
  rawBuffer?: Buffer;
}

export default async function handler(req: CustomRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBuffer = req.rawBuffer || (typeof req.body === 'string' ? Buffer.from(req.body, 'binary') : null);
    if (!rawBuffer || rawBuffer.length === 0) {
      return res.status(400).json({ error: 'No image uploaded in request.' });
    }

    const contentType = req.headers['content-type'] || '';
    let crop = 'tomato';
    let fileBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const boundaryStr = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;

      if (boundaryStr) {
        const boundaryBuf = Buffer.from(`--${boundaryStr}`);
        let start = 0;
        while (start < rawBuffer.length) {
          const nextIdx = rawBuffer.indexOf(boundaryBuf, start);
          if (nextIdx === -1) break;
          const partStart = nextIdx + boundaryBuf.length + 2; // skip \r\n
          const nextBoundary = rawBuffer.indexOf(boundaryBuf, partStart);
          if (nextBoundary === -1) break;
          const part = rawBuffer.subarray(partStart, nextBoundary - 2);

          const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEnd !== -1) {
            const headerStr = part.subarray(0, headerEnd).toString('utf-8');
            const bodyPart = part.subarray(headerEnd + 4);

            if (headerStr.includes('name="crop"')) {
              crop = bodyPart.toString('utf-8').trim().toLowerCase();
            } else if (headerStr.includes('name="file"') || headerStr.includes('filename="')) {
              fileBuffer = bodyPart;
            }
          }
          start = nextBoundary;
        }
      }
    } else {
      fileBuffer = rawBuffer;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Could not extract valid image file from request.' });
    }

    const tempDir = path.resolve(process.cwd(), 'scratch');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    const scriptPath = path.resolve(process.cwd(), 'scripts', 'predict_single_image.py');

    // Run Python CLI inference using 'py' launcher
    execFile('py', [scriptPath, '--image', tempFilePath, '--crop', crop], { timeout: 10000 }, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch {
        // ignore
      }

      if (error) {
        console.error('Inference error:', stderr || error.message);
        return res.status(500).json({
          error: 'Model inference failed',
          details: stderr ? stderr.toString() : error.message
        });
      }

      try {
        const result = JSON.parse(stdout.trim());
        return res.status(200).json(result);
      } catch (parseErr) {
        return res.status(500).json({
          error: 'Invalid response from model script',
          raw: stdout
        });
      }
    });
  } catch (err) {
    console.error('Predict handler exception:', err);
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
