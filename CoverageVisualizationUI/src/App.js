import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useHealth } from './hooks/useHealth';
import ControlsPanel from './components/ControlsPanel';
import HeatmapView from './components/HeatmapView';
import VolumeView from './components/VolumeView';
import ExportPanel from './components/ExportPanel';
import { describeUnits } from './utils/validation';
import { computeConfigHash } from './api/client';

// PUBLIC_INTERFACE
function App() {
  // Theme toggle for accessibility; retain from template
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Health
  const { healthy, lastChecked, error: healthError } = useHealth(15000);

  // Visualization & controls state (ExportRequest-like)
  const [config, setConfig] = useState(() => ({
    mode: '2d',
    z_slice: 0,
    color_map: 'Viridis',
    color_range: [-90, -30],
    thresholds: { min: -85, max: -45 },
    ap_selection: { type: 'single', ap_ids: ['ap-1'] },
    overlays: { kriging_variance: false },
    seed: 42,
    crs: 'EPSG:3857',
    units: { freq: 'MHz', distance: 'm', power: 'dBm', gain: 'dBi' },
    data_refs: { grid_ids: ['grid-1'], mask_ids: [], variance_id: undefined },
    downsampling: { factor: 0 },
  }));

  // Fake demo data for visualization to keep UI functional without backend model feed.
  // In a real integration, these would be fetched from engine/store.
  const heatmapData = useMemo(() => {
    // 40x30 gradient demo
    const rows = 30;
    const cols = 40;
    const data = [];
    for (let j = 0; j < rows; j += 1) {
      const row = [];
      for (let i = 0; i < cols; i += 1) {
        const v = -90 + (i / cols) * 60 + Math.sin(j / 3) * 2;
        row.push(v);
      }
      data.push(row);
    }
    return data;
  }, []);

  const volumeDemo = useMemo(() => {
    // 18x12x10 small demo volume: value increases with x,y,z
    const nx = 18, ny = 12, nz = 10;
    const nested = [];
    for (let k = 0; k < nz; k += 1) {
      const plane = [];
      for (let j = 0; j < ny; j += 1) {
        const row = [];
        for (let i = 0; i < nx; i += 1) {
          row.push(-90 + (i / nx) * 30 + (j / ny) * 15 + (k / nz) * 15);
        }
        plane.push(row);
      }
      nested.push(plane);
    }
    return { volume: nested, dims: { nx, ny, nz } };
  }, []);

  // Collect render metrics to pass into export panel
  const [latestRenderMetrics, setLatestRenderMetrics] = useState(null);

  // Validation feedback from ControlsPanel
  const [valid, setValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);

  const onValidation = (isValid, errors) => {
    setValid(isValid);
    setValidationErrors(errors);
  };

  const configHash = computeConfigHash(config);

  return (
    <div className="App">
      <header className="App-header" style={{ alignItems: 'stretch' }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="container" style={{ width: '100%', maxWidth: 1200 }}>
          <h1 style={{ marginTop: 10, marginBottom: 6 }}>Coverage Visualization UI</h1>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 12 }}>
            Status: {healthy == null ? 'checking…' : healthy ? 'Healthy ✅' : `Unhealthy ❌ ${healthError || ''}`} {lastChecked ? `@ ${lastChecked.toLocaleTimeString()}` : ''}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
            <div>
              <ControlsPanel value={config} onChange={setConfig} onValidation={onValidation} />
              <div style={{ marginTop: 10, textAlign: 'left', fontSize: 12, opacity: 0.8 }}>
                Units: {describeUnits(config.units)} | CRS: {config.crs} | Seed: {config.seed} | Config Hash: {configHash}
              </div>
              {!valid && validationErrors?.length > 0 && (
                <div role="alert" style={{ marginTop: 8, color: '#b00', fontSize: 13 }}>
                  {validationErrors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <ExportPanel config={config} latestRenderMetrics={latestRenderMetrics} />
              </div>
            </div>

            <div>
              {config.mode === '2d' ? (
                <HeatmapView
                  data={heatmapData}
                  colorMap={config.color_map}
                  colorRange={config.color_range}
                  thresholds={config.thresholds}
                  overlays={config.overlays}
                  units={config.units}
                  zSlice={config.z_slice}
                  onRenderMetrics={(m) => setLatestRenderMetrics(m)}
                />
              ) : (
                <VolumeView
                  volume={volumeDemo.volume}
                  dims={volumeDemo.dims}
                  colorMap={config.color_map}
                  colorRange={config.color_range}
                  zHeight={config.z_height}
                  units={config.units}
                  onRenderMetrics={(m) => setLatestRenderMetrics(m)}
                />
              )}
              <div style={{ textAlign: 'left', marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                Render metrics: {latestRenderMetrics?.render_ms != null ? `${latestRenderMetrics.render_ms} ms` : 'n/a'}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
