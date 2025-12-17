import React, { useEffect, useMemo, useState } from 'react';
import { validateExportRequest } from '../utils/validation';

/**
 * Controls Panel
 * Props:
 * - value: ExportRequest-like config
 * - onChange(next)
 * - onValidation(valid, errors)
 */
export default function ControlsPanel({ value, onChange, onValidation }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const errors = useMemo(() => validateExportRequest(local), [local]);

  useEffect(() => {
    onValidation?.(errors.length === 0, errors);
  }, [errors, onValidation]);

  const patch = (kv) => {
    const next = { ...local, ...kv };
    setLocal(next);
    onChange?.(next);
  };

  const updateApType = (type) => {
    if (type === 'single') {
      patch({ ap_selection: { type, ap_ids: local.ap_selection?.ap_ids?.slice(0, 1) || [] }, multi_ap_mode: undefined });
    } else {
      patch({ ap_selection: { type, ap_ids: local.ap_selection?.ap_ids || [] } });
    }
  };

  return (
    <div style={{ textAlign: 'left', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Controls</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          Mode:
          <select
            value={local.mode}
            onChange={(e) => patch({ mode: e.target.value, z_slice: e.target.value === '2d' ? 0 : undefined, z_height: e.target.value === '3d' ? 0 : undefined })}
          >
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </label>

        {local.mode === '2d' && (
          <label>
            z_slice:
            <input
              type="number"
              value={local.z_slice ?? 0}
              onChange={(e) => patch({ z_slice: parseInt(e.target.value || '0', 10), z_height: undefined })}
              min={0}
              step={1}
            />
          </label>
        )}
        {local.mode === '3d' && (
          <label>
            z_height (m):
            <input
              type="number"
              value={local.z_height ?? 0}
              onChange={(e) => patch({ z_height: parseFloat(e.target.value || '0'), z_slice: undefined })}
            />
          </label>
        )}

        <label>
          Color map:
          <select value={local.color_map} onChange={(e) => patch({ color_map: e.target.value })}>
            <option>Viridis</option>
            <option>Plasma</option>
            <option>Cividis</option>
            <option>Jet</option>
            <option>Hot</option>
          </select>
        </label>

        <label>
          Color range min:
          <input
            type="number"
            value={local.color_range?.[0] ?? -90}
            onChange={(e) => {
              const min = parseFloat(e.target.value || '0');
              patch({ color_range: [min, local.color_range?.[1] ?? 0] });
            }}
          />
        </label>
        <label>
          Color range max:
          <input
            type="number"
            value={local.color_range?.[1] ?? -30}
            onChange={(e) => {
              const max = parseFloat(e.target.value || '0');
              patch({ color_range: [local.color_range?.[0] ?? 0, parseFloat(e.target.value || '0')] });
            }}
          />
        </label>

        <label>
          Threshold min:
          <input
            type="number"
            value={local.thresholds?.min ?? ''}
            onChange={(e) => patch({ thresholds: { ...(local.thresholds || {}), min: e.target.value === '' ? undefined : parseFloat(e.target.value) } })}
          />
        </label>
        <label>
          Threshold max:
          <input
            type="number"
            value={local.thresholds?.max ?? ''}
            onChange={(e) => patch({ thresholds: { ...(local.thresholds || {}), max: e.target.value === '' ? undefined : parseFloat(e.target.value) } })}
          />
        </label>

        <label>
          AP selection type:
          <select value={local.ap_selection?.type ?? 'single'} onChange={(e) => updateApType(e.target.value)}>
            <option value="single">single</option>
            <option value="multi">multi</option>
          </select>
        </label>

        <label>
          AP IDs (comma-separated):
          <input
            type="text"
            value={(local.ap_selection?.ap_ids || []).join(',')}
            onChange={(e) => {
              const ids = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              patch({ ap_selection: { type: local.ap_selection?.type || 'single', ap_ids: ids } });
            }}
          />
        </label>

        {local.ap_selection?.type === 'multi' && (
          <label>
            multi_ap_mode:
            <select value={local.multi_ap_mode || 'max_rssi'} onChange={(e) => patch({ multi_ap_mode: e.target.value })}>
              <option value="max_rssi">max_rssi</option>
              <option value="coverage">coverage</option>
              <option value="overlap_dB">overlap_dB</option>
            </select>
          </label>
        )}

        <label>
          overlays.kriging_variance:
          <input
            type="checkbox"
            checked={!!local.overlays?.kriging_variance}
            onChange={(e) => patch({ overlays: { ...(local.overlays || {}), kriging_variance: e.target.checked } })}
          />
        </label>

        <label>
          seed (int):
          <input
            type="number"
            step={1}
            value={local.seed ?? 42}
            onChange={(e) => patch({ seed: parseInt(e.target.value || '0', 10) })}
          />
        </label>

        <label>
          CRS:
          <input
            type="text"
            placeholder="EPSG:YOURCODE"
            value={local.crs || ''}
            onChange={(e) => patch({ crs: e.target.value })}
          />
        </label>

        <fieldset style={{ gridColumn: '1 / span 2' }}>
          <legend>Units</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <label>
              freq:
              <select
                value={local.units?.freq || 'MHz'}
                onChange={(e) => patch({ units: { ...(local.units || {}), freq: e.target.value } })}
              >
                <option value="Hz">Hz</option>
                <option value="MHz">MHz</option>
              </select>
            </label>
            <label>
              distance:
              <select
                value={local.units?.distance || 'm'}
                onChange={(e) => patch({ units: { ...(local.units || {}), distance: e.target.value } })}
              >
                <option value="m">m</option>
              </select>
            </label>
            <label>
              power:
              <select
                value={local.units?.power || 'dBm'}
                onChange={(e) => patch({ units: { ...(local.units || {}), power: e.target.value } })}
              >
                <option value="dBm">dBm</option>
              </select>
            </label>
            <label>
              gain:
              <select
                value={local.units?.gain || 'dBi'}
                onChange={(e) => patch({ units: { ...(local.units || {}), gain: e.target.value } })}
              >
                <option value="dBi">dBi</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset style={{ gridColumn: '1 / span 2' }}>
          <legend>Data refs</legend>
          <label>
            grid_ids (comma-separated):
            <input
              type="text"
              value={(local.data_refs?.grid_ids || []).join(',')}
              onChange={(e) => {
                const gridIds = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const dr = { ...(local.data_refs || {}), grid_ids: gridIds };
                patch({ data_refs: dr });
              }}
            />
          </label>
          <label>
            mask_ids (comma-separated):
            <input
              type="text"
              value={(local.data_refs?.mask_ids || []).join(',')}
              onChange={(e) => {
                const maskIds = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const dr = { ...(local.data_refs || {}), mask_ids: maskIds };
                patch({ data_refs: dr });
              }}
            />
          </label>
          <label>
            variance_id:
            <input
              type="text"
              value={local.data_refs?.variance_id || ''}
              onChange={(e) => {
                const dr = { ...(local.data_refs || {}), variance_id: e.target.value || undefined };
                patch({ data_refs: dr });
              }}
            />
          </label>
        </fieldset>

        <label>
          downsampling.factor:
          <input
            type="number"
            min={0}
            step={0.1}
            value={local.downsampling?.factor ?? 0}
            onChange={(e) => patch({ downsampling: { factor: parseFloat(e.target.value || '0') } })}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div role="alert" style={{ marginTop: 10, color: '#b00' }}>
          {errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}
    </div>
  );
}
