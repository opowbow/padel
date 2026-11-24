import { Storage } from '@google-cloud/storage';
import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'op-hack-001';
const BUCKET_NAME = process.env.GCS_STATE_BUCKET || 'op-hack-001';
const OBJECT_NAME = process.env.GCS_STATE_OBJECT || 'slaypadel/tuesslay-state.json';
const LOCAL_FALLBACK_FILE = path.resolve(process.cwd(), '.local-tuesslay-state.json');
const IS_CLOUD_RUN = Boolean(process.env.K_SERVICE);

const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET_NAME);
const gcsFile = bucket.file(OBJECT_NAME);

let writeChain = Promise.resolve();
let localAuthFallbackActive = false;

function isNotFoundError(err) {
  if (!err || typeof err !== 'object') return false;
  return err.code === 404 || err.code === 'ENOENT';
}

export async function readPersistedState() {
  if (!localAuthFallbackActive) {
    try {
      const [buffer] = await gcsFile.download({ validation: false });
      const parsed = JSON.parse(buffer.toString('utf8'));
      return {
        state: parsed?.state ?? null,
        updatedAt: Number(parsed?.updatedAt || 0),
        backend: 'gcs',
        uri: `gs://${BUCKET_NAME}/${OBJECT_NAME}`,
      };
    } catch (err) {
      if (isNotFoundError(err)) {
        return {
          state: null,
          updatedAt: 0,
          backend: 'gcs',
          uri: `gs://${BUCKET_NAME}/${OBJECT_NAME}`,
        };
      }
      if (!IS_CLOUD_RUN) {
        localAuthFallbackActive = true;
      } else {
        console.error('[TuesSlay stateStore] Cloud Run GCS read error:', err?.message || err);
        throw err;
      }
    }
  }

  // Fallback to local file when running locally without active ADC
  try {
    const raw = await fs.readFile(LOCAL_FALLBACK_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      state: parsed?.state ?? null,
      updatedAt: Number(parsed?.updatedAt || 0),
      backend: 'local-fallback',
    };
  } catch {
    return {
      state: null,
      updatedAt: 0,
      backend: 'local-fallback',
    };
  }
}

export function writePersistedState(statePayload) {
  const updatedAt = Date.now();
  const envelope = JSON.stringify(
    {
      updatedAt,
      state: statePayload,
    },
    null,
    2
  );

  const nextWrite = writeChain.then(async () => {
    if (!localAuthFallbackActive) {
      try {
        await gcsFile.save(envelope, {
          resumable: false,
          contentType: 'application/json; charset=utf-8',
          metadata: {
            cacheControl: 'no-store, max-age=0',
          },
        });
        return {
          ok: true,
          updatedAt,
          backend: 'gcs',
          uri: `gs://${BUCKET_NAME}/${OBJECT_NAME}`,
        };
      } catch (err) {
        if (!IS_CLOUD_RUN) {
          localAuthFallbackActive = true;
        } else {
          console.error('[TuesSlay stateStore] Cloud Run GCS write error:', err?.message || err);
          throw err;
        }
      }
    }

    await fs.writeFile(LOCAL_FALLBACK_FILE, envelope, 'utf8');
    return {
      ok: true,
      updatedAt,
      backend: 'local-fallback',
    };
  });

  // Prevent a rejected promise from wedging future writes
  writeChain = nextWrite.catch(() => {});
  return nextWrite;
}

export function clearPersistedState() {
  const nextOp = writeChain.then(async () => {
    try {
      await gcsFile.delete({ ignoreNotFound: true });
    } catch {
      // Ignore if unavailable
    }
    try {
      await fs.unlink(LOCAL_FALLBACK_FILE);
    } catch {
      // Ignore if missing
    }
    return { ok: true, updatedAt: Date.now() };
  });

  writeChain = nextOp.catch(() => {});
  return nextOp;
}

function readRequestBody(req, maxBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(payload);
}

export async function handleStateApiRequest(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await readPersistedState();
      sendJson(res, 200, data);
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      if (!parsed || typeof parsed.state !== 'object' || parsed.state === null) {
        sendJson(res, 400, { error: 'Missing state object in request body' });
        return;
      }
      const result = await writePersistedState(parsed.state);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'DELETE') {
      const result = await clearPersistedState();
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 405, { error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[TuesSlay API Error]', err);
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
