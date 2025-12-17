import React, { useEffect, useMemo, useRef } from 'react';

/**
 * Simple Heatmap using Plotly via window.Plotly (to avoid adding dependency if not present).
 * If Plotly is unavailable, we fallback to a placeholder SVG.
 *
 * Props:
 * - data: 2D array of numbers
 * - colorMap: string
 * - colorRange: [min, max]
 * - thresholds: { min?: number, max?: number }
 * - overlays: { kriging_variance?: boolean }
 * - units: object for labels
 * - zSlice: integer index
 * - onRenderMetrics: fn({ render_ms, peak_mem_mb? })
 */
export default function HeatmapView({
  data,
  colorMap,
  colorRange,
  thresholds,
  overlays,
  units,
  zSlice,
  onRenderMetrics,
}) {
  const containerRef = useRef(null);

  const plotlyAvailable = typeof window !== 'undefined' && !!window.Plotly;

  const trace = useMemo(() => {
    const [vmin, vmax] = colorRange || [0, 1];
    const z = data || [[]];
    const cm = colorMap || 'Viridis';
    return {
      z,
      type: 'heatmap',
      colorscale: cm,
      zmin: vmin,
      zmax: vmax,
      showscale: true,
      colorbar: {
        title: units?.power ? `RSSI (${units.power})` : 'Value',
      },
    };
  }, [data, colorMap, colorRange, units]);

  useEffect(() => {
    const t0 = performance.now();
    if (plotlyAvailable && containerRef.current) {
      const layout = {
        title: `2D Heatmap - z_slice=${zSlice}`,
        xaxis: { title: `X (${units?.distance || 'm'})` },
        yaxis: { title: `Y (${units?.distance || 'm'})` },
        margin: { l: 50, r: 10, t: 48, b: 40 },
      };

      // Add threshold shapes if provided
      const shapes = [];
      if (thresholds?.min != null) {
        shapes.push({
          type: 'line',
          x0: 0,
          x1: 1,
          y0: 0,
          y1: 0,
          xref: 'paper',
          yref: 'paper',
          line: { color: 'rgba(0,0,0,0)' }, // Placeholder
        });
      }
      if (thresholds?.max != null) {
        shapes.push({
          type: 'line',
          x0: 0,
          x1: 1,
          y0: 1,
          y1: 1,
          xref: 'paper',
          yref: 'paper',
          line: { color: 'rgba(0,0,0,0)' }, // Placeholder
        });
      }
      layout.shapes = shapes;

      window.Plotly.newPlot(containerRef.current, [trace], layout, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d'],
      }).then(() => {
        const t1 = performance.now();
        onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
      }).catch(() => {
        const t1 = performance.now();
        onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
      });
    } else {
      // Fallback: render time for placeholder
      const t1 = performance.now();
      onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
    }
  }, [trace, thresholds, overlays, units, zSlice, plotlyAvailable, onRenderMetrics]);

  if (plotlyAvailable) {
    return <div ref={containerRef} style={{ width: '100%', height: 420 }} aria-label="heatmap-view" />;
  }

  // Fallback SVG
  return (
    <div style={{ width: '100%', height: 420, border: '1px solid var(--border-color)' }}>
      <svg width="100%" height="100%" role="img" aria-label="heatmap-fallback">
        <rect x="0" y="0" width="100%" height="100%" fill="#eee" />
        <text x="50%" y="50%" textAnchor="middle" fill="#999">
          Heatmap placeholder (Plotly not detected)
        </text>
      </svg>
    </div>
  );
}
