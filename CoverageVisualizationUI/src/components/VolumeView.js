import React, { useEffect, useMemo, useRef } from 'react';

/**
 * 3D Volume View using Plotly (if present).
 *
 * Props:
 * - volume: 3D array flattened to 1D with dims { nx, ny, nz } OR 3D nested array
 * - dims: { nx, ny, nz }
 * - colorMap: string
 * - colorRange: [min, max]
 * - zHeight: number | undefined (optional slicing height info)
 * - units: { distance, power }
 * - onRenderMetrics: fn({ render_ms, peak_mem_mb? })
 */
export default function VolumeView({
  volume,
  dims,
  colorMap,
  colorRange,
  zHeight,
  units,
  onRenderMetrics,
}) {
  const containerRef = useRef(null);
  const plotlyAvailable = typeof window !== 'undefined' && !!window.Plotly;

  const { values, nx, ny, nz } = useMemo(() => {
    if (!volume || !dims) return { values: [], nx: 0, ny: 0, nz: 0 };
    let arr = volume;
    if (Array.isArray(volume) && volume.length && Array.isArray(volume[0])) {
      // Flatten nested [z][y][x] -> flat array
      const flat = [];
      for (let k = 0; k < volume.length; k += 1) {
        const plane = volume[k];
        for (let j = 0; j < plane.length; j += 1) {
          const row = plane[j];
          for (let i = 0; i < row.length; i += 1) {
            flat.push(row[i]);
          }
        }
      }
      arr = flat;
    }
    return { values: arr, nx: dims.nx, ny: dims.ny, nz: dims.nz };
  }, [volume, dims]);

  const trace = useMemo(() => {
    const [vmin, vmax] = colorRange || [0, 1];
    const cm = colorMap || 'Viridis';

    return {
      type: 'volume',
      value: values,
      colorscale: cm,
      opacity: 0.2,
      surface: { show: true, count: 8 },
      // dims not directly supported; we can use indices as coordinates.
      // Plotly volume expects x,y,z as array or scalar steps; we can omit for index-based.
      // Clamp range
      cmin: vmin,
      cmax: vmax,
    };
  }, [values, colorMap, colorRange]);

  useEffect(() => {
    const t0 = performance.now();
    if (plotlyAvailable && containerRef.current && values.length) {
      const layout = {
        title: `3D Volume (${nx}×${ny}×${nz})`,
        scene: {
          xaxis: { title: `X (${units?.distance || 'm'})` },
          yaxis: { title: `Y (${units?.distance || 'm'})` },
          zaxis: { title: `Z (${units?.distance || 'm'})` },
        },
        margin: { l: 10, r: 10, t: 48, b: 10 },
      };
      window.Plotly.newPlot(containerRef.current, [trace], layout, {
        responsive: true,
        displaylogo: false,
      }).then(() => {
        const t1 = performance.now();
        onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
      }).catch(() => {
        const t1 = performance.now();
        onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
      });
    } else {
      const t1 = performance.now();
      onRenderMetrics?.({ render_ms: Math.round(t1 - t0) });
    }
  }, [trace, plotlyAvailable, values, nx, ny, nz, units, onRenderMetrics]);

  if (plotlyAvailable) {
    return <div ref={containerRef} style={{ width: '100%', height: 460 }} aria-label="volume-view" />;
  }

  return (
    <div style={{ width: '100%', height: 460, border: '1px solid var(--border-color)' }}>
      <svg width="100%" height="100%" role="img" aria-label="volume-fallback">
        <rect x="0" y="0" width="100%" height="100%" fill="#eef" />
        <text x="50%" y="50%" textAnchor="middle" fill="#669">
          3D volume placeholder (Plotly not detected)
        </text>
      </svg>
    </div>
  );
}
