import React, { useMemo, useState } from 'react';
import { computeConfigHash, exportHtml, exportPng } from '../api/client';
import { validateExportRequest } from '../utils/validation';

/**
 * Export Panel
 * Props:
 * - config: ExportRequest
 * - latestRenderMetrics: { render_ms, peak_mem_mb? }
 */
export default function ExportPanel({ config, latestRenderMetrics }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const valid = useMemo(() => validateExportRequest(config).length === 0, [config]);

  const withSidecar = (req) => {
    // attach reproducibility hash; backend will also compute but we include deterministic seed handling
    const cfgHash = computeConfigHash(req);
    const enriched = {
      ...req,
      reproducibility: { seed: req.seed, config_hash: cfgHash }, // helpful to log on server if supported
      performance: {
        render_ms: latestRenderMetrics?.render_ms ?? undefined,
        peak_mem_mb: latestRenderMetrics?.peak_mem_mb ?? undefined,
        downsampling_factor: req.downsampling?.factor ?? undefined,
      },
    };
    return enriched;
  };

  const runExport = async (kind) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setError(null);

    const t0 = performance.now();
    try {
      const req = withSidecar(config);

      let resp;
      if (kind === 'png') {
        resp = await exportPng(req);
        const t1 = performance.now();
        setMessage(`PNG export success: artifact_id=${resp.artifact_id}
png_path=${resp.png_path}
json_sidecar_path=${resp.json_sidecar_path}
server_render_ms=${resp.metrics?.render_ms ?? 'n/a'} client_ms=${Math.round(t1 - t0)} (${resp.client_timing_ms} API)
`);
      } else {
        resp = await exportHtml(req);
        const t1 = performance.now();
        setMessage(`HTML export success: artifact_id=${resp.artifact_id}
html_path=${resp.html_path}
json_sidecar_path=${resp.json_sidecar_path}
server_render_ms=${resp.metrics?.render_ms ?? 'n/a'} client_ms=${Math.round(t1 - t0)} (${resp.client_timing_ms} API)
`);
      }
    } catch (err) {
      const msg = err?.message || 'Export failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ textAlign: 'left', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Export</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => runExport('png')} disabled={!valid || busy} aria-busy={busy}>
          {busy ? 'Exporting PNG…' : 'Export PNG'}
        </button>
        <button onClick={() => runExport('html')} disabled={!valid || busy} aria-busy={busy}>
          {busy ? 'Exporting HTML…' : 'Export HTML'}
        </button>
      </div>

      {!valid && <div style={{ marginTop: 8, color: '#a00' }}>Fix validation issues in Controls before exporting.</div>}
      {message && <pre style={{ marginTop: 10, background: '#f6f6f6', padding: 10, borderRadius: 6 }}>{message}</pre>}
      {error && <div role="alert" style={{ marginTop: 10, color: '#b00' }}>{error}</div>}
    </div>
  );
}
