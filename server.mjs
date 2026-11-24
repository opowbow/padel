import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleStateApiRequest } from './server/stateStore.mjs';
import { handleSheetCsvProxyRequest } from './server/sheetProxy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 8080);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(urlObj.pathname);

    if (pathname === '/api/state') {
      await handleStateApiRequest(req, res);
      return;
    }

    if (pathname === '/api/sheet-csv') {
      await handleSheetCsvProxyRequest(req, res);
      return;
    }

    if (pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok');
      return;
    }

    // Resolve static asset inside dist safely
    const safeRelative = pathname.replace(/^\/+/, '');
    const candidatePath = path.resolve(DIST_DIR, safeRelative || 'index.html');

    if (!candidatePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let targetPath = candidatePath;
    let stat = null;
    try {
      stat = await fs.stat(targetPath);
      if (stat.isDirectory()) {
        targetPath = path.join(targetPath, 'index.html');
        stat = await fs.stat(targetPath);
      }
    } catch {
      // SPA fallback to index.html
      targetPath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHashedAsset = pathname.startsWith('/assets/');

    const content = await fs.readFile(targetPath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    });
    res.end(content);
  } catch (err) {
    console.error('[TuesSlay Server Error]', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TuesSlay server listening on http://0.0.0.0:${PORT}`);
});
