//
// API client for CoverageVisualizationUI
// - Uses REACT_APP_API_BASE if set, otherwise falls back to REACT_APP_BACKEND_URL
// - Adds X-API-Key header when REACT_APP_API_KEY is provided
// - Exposes health(), exportPng(), exportHtml()
// - Adds helper to compute stable config hash for reproducibility
//

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Picks API base URL using precedence:
   * 1) REACT_APP_API_BASE
   * 2) REACT_APP_BACKEND_URL
   * No hard-coded ports.
   */
  const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
  // Normalize: remove trailing slash
  return base.replace(/\/+$/, '');
}

// PUBLIC_INTERFACE
export function getApiHeaders() {
  /**
   * Returns fetch headers including content-type and optional X-API-Key
   */
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = process.env.REACT_APP_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  return headers;
}

// PUBLIC_INTERFACE
export async function health() {
  /** Calls GET /api/v1/healthz or {base}/api/v1/healthz */
  const base = getApiBaseUrl();
  const url = base ? `${base}/api/v1/healthz` : `/api/v1/healthz`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getApiHeaders(),
  });
  return res;
}

// Helpers

function canonicalize(value) {
  // Produce deterministically ordered JSON string for hashing
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',')}}`;
  }
  return JSON.stringify(value);
}

function simpleHash(str) {
  // Deterministic simple DJB2-like hash, hex output
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i); // hash * 33 ^ c
    hash |= 0; // force 32-bit
  }
  // Convert to unsigned and hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// PUBLIC_INTERFACE
export function computeConfigHash(obj) {
  /** Computes a stable hash for the given object (ExportRequest or sidecar parameters) */
  return simpleHash(canonicalize(obj));
}

// PUBLIC_INTERFACE
export async function exportPng(exportRequest) {
  /**
   * Export current view to PNG with JSON sidecar.
   * request: ExportRequest per OpenAPI schema
   * returns: PNGExportResponse or throws with friendly error
   */
  const base = getApiBaseUrl();
  const url = base ? `${base}/api/v1/export/png` : `/api/v1/export/png`;

  const body = JSON.stringify(exportRequest);
  const t0 = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
    body,
  });
  const t1 = performance.now();

  if (!res.ok) {
    const status = res.status;
    let payload = {};
    try {
      payload = await res.json();
    } catch (_) {}
    const msg = payload?.error?.message || `Export PNG failed with status ${status}`;
    const code = payload?.error?.code || 'UNKNOWN';
    throw new Error(`[${status}/${code}] ${msg}`);
  }

  const data = await res.json();
  // Attach client-side duration
  data.client_timing_ms = Math.round(t1 - t0);
  return data;
}

// PUBLIC_INTERFACE
export async function exportHtml(exportRequest) {
  /**
   * Export current view to HTML with JSON sidecar.
   * request: ExportRequest per OpenAPI schema
   * returns: HTMLExportResponse or throws with friendly error
   */
  const base = getApiBaseUrl();
  const url = base ? `${base}/api/v1/export/html` : `/api/v1/export/html`;

  const body = JSON.stringify(exportRequest);
  const t0 = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
    body,
  });
  const t1 = performance.now();

  if (!res.ok) {
    const status = res.status;
    let payload = {};
    try {
      payload = await res.json();
    } catch (_) {}
    const msg = payload?.error?.message || `Export HTML failed with status ${status}`;
    const code = payload?.error?.code || 'UNKNOWN';
    throw new Error(`[${status}/${code}] ${msg}`);
  }

  const data = await res.json();
  data.client_timing_ms = Math.round(t1 - t0);
  return data;
}
