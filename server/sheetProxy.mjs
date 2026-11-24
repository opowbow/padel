const ALLOWED_HOSTS = new Set(['docs.google.com']);

function isAllowedRedirectHost(hostname) {
  return (
    hostname === 'docs.google.com' ||
    hostname === 'googleusercontent.com' ||
    hostname.endsWith('.googleusercontent.com')
  );
}

export function normalizeGoogleSheetCsvUrls(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { error: 'Please provide a Google Sheets URL.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { error: 'Invalid URL format. Paste a full https://docs.google.com/spreadsheets/... link.' };
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return {
      error: 'Only https://docs.google.com/spreadsheets/... URLs are supported.',
    };
  }

  if (!parsed.pathname.startsWith('/spreadsheets/')) {
    return {
      error: 'URL must point to a Google Sheet (/spreadsheets/...).',
    };
  }

  let gid = parsed.searchParams.get('gid') || '';
  if (!gid && parsed.hash) {
    const hashMatch = /gid=(\d+)/.exec(parsed.hash);
    if (hashMatch) {
      gid = hashMatch[1];
    }
  }

  // Case 1: Published-to-web URL (/spreadsheets/d/e/<PUB_ID>/...)
  const pubMatch = /^\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/.exec(parsed.pathname);
  if (pubMatch) {
    const pubId = pubMatch[1];
    const params = new URLSearchParams();
    params.set('output', 'csv');
    if (gid) {
      params.set('gid', gid);
      params.set('single', 'true');
    }
    return {
      urls: [`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?${params.toString()}`],
    };
  }

  // Case 2: Standard Google Sheet URL (/spreadsheets/d/<SHEET_ID>/...)
  const sheetMatch = /^\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(parsed.pathname);
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    const gidSuffix = gid ? `&gid=${encodeURIComponent(gid)}` : '';
    return {
      urls: [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidSuffix}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidSuffix}`,
      ],
    };
  }

  return {
    error: 'Could not find a valid Google Sheet ID in the URL.',
  };
}

async function fetchCsvSafely(initialUrl, maxRedirects = 5) {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
        'User-Agent': 'TuesSlay-SheetImporter/1.0',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        return { ok: false, status: 502, error: 'Google Sheets redirect missing Location header.' };
      }

      const nextParsed = new URL(location, currentUrl);
      if (nextParsed.hostname === 'accounts.google.com') {
        return {
          ok: false,
          status: 403,
          error:
            'This Google Sheet is private. In Google Sheets, click Share → set General access to "Anyone with the link (Viewer)" or File → Share → Publish to web, or use the "Paste Cells" tab.',
        };
      }

      if (nextParsed.protocol !== 'https:' || !isAllowedRedirectHost(nextParsed.hostname)) {
        return {
          ok: false,
          status: 403,
          error: `Blocked redirect to untrusted host (${nextParsed.hostname}).`,
        };
      }

      currentUrl = nextParsed.toString();
      continue;
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: 403,
          error:
            'Access denied by Google Sheets. Make sure sharing is set to "Anyone with the link can view" (or Publish to web), or copy-paste cells directly.',
        };
      }
      return {
        ok: false,
        status: res.status,
        error: `Google Sheets returned HTTP ${res.status}. Check the link and sharing settings.`,
      };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();
    const trimmedStart = text.trimStart().slice(0, 200).toLowerCase();

    if (
      contentType.includes('text/html') ||
      trimmedStart.startsWith('<!doctype html') ||
      trimmedStart.startsWith('<html')
    ) {
      return {
        ok: false,
        status: 403,
        error:
          'Google Sheets returned a web/sign-in page instead of CSV data. Set sheet access to "Anyone with the link (Viewer)" or File → Share → Publish to web (CSV), or paste cells directly.',
      };
    }

    if (!text.trim()) {
      return {
        ok: false,
        status: 422,
        error: 'The Google Sheet appears to be empty.',
      };
    }

    return { ok: true, status: 200, csv: text };
  }

  return { ok: false, status: 502, error: 'Too many redirects while fetching Google Sheet.' };
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(payload);
}

export async function handleSheetCsvProxyRequest(req, res) {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const targetUrl = urlObj.searchParams.get('url') || '';

    const normalized = normalizeGoogleSheetCsvUrls(targetUrl);
    if (normalized.error || !normalized.urls) {
      sendJson(res, 400, { error: normalized.error || 'Invalid Google Sheet URL' });
      return;
    }

    let lastFailure = null;
    for (const candidateUrl of normalized.urls) {
      const attempt = await fetchCsvSafely(candidateUrl);
      if (attempt.ok) {
        sendJson(res, 200, { ok: true, csv: attempt.csv });
        return;
      }
      lastFailure = attempt;
    }

    sendJson(res, lastFailure?.status || 502, {
      error: lastFailure?.error || 'Unable to download CSV from Google Sheets.',
    });
  } catch (err) {
    console.error('[TuesSlay Sheet Proxy Error]', err);
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to fetch Google Sheet.',
    });
  }
}
