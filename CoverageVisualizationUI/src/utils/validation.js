//
// Form validation & helpers for ExportRequest and controls
//

// PUBLIC_INTERFACE
export function validateExportRequest(req) {
  /**
   * Validates ExportRequest logical constraints:
   * - mode in ["2d","3d"]
   * - exactly one of z_slice or z_height when applicable
   * - thresholds within color_range (if provided)
   * - units present with freq/distance/power/gain
   */
  const errors = [];

  if (!req || typeof req !== 'object') {
    return ['Invalid request'];
  }

  if (!['2d', '3d'].includes(req.mode)) {
    errors.push('mode must be "2d" or "3d"');
  }

  const hasZSlice = typeof req.z_slice === 'number' && Number.isInteger(req.z_slice);
  const hasZHeight = typeof req.z_height === 'number' && !Number.isNaN(req.z_height);

  if (req.mode === '2d') {
    if (!hasZSlice) errors.push('z_slice is required for 2D mode');
    if (hasZHeight) errors.push('z_height must not be provided for 2D mode');
  }

  if (req.mode === '3d') {
    if (hasZSlice) errors.push('z_slice must not be provided for 3D mode');
    // z_height is optional for 3D (for explicit slicer); allow if present (number)
    if (req.z_height != null && !hasZHeight) {
      errors.push('z_height must be a number when provided in 3D mode');
    }
  }

  if (!Array.isArray(req.color_range) || req.color_range.length !== 2) {
    errors.push('color_range must be a [min,max] array');
  } else if (req.thresholds) {
    const [crMin, crMax] = req.color_range;
    const { min, max } = req.thresholds;
    if (min != null && (min < crMin || min > crMax)) {
      errors.push('thresholds.min must be within color_range');
    }
    if (max != null && (max < crMin || max > crMax)) {
      errors.push('thresholds.max must be within color_range');
    }
    if (min != null && max != null && min > max) {
      errors.push('thresholds.min must be <= thresholds.max');
    }
  }

  if (!req.ap_selection || !['single', 'multi'].includes(req.ap_selection.type)) {
    errors.push('ap_selection.type must be "single" or "multi"');
  } else if (req.ap_selection.type === 'single') {
    // ap_ids optional or single; if provided, allow 1
    if (Array.isArray(req.ap_selection.ap_ids) && req.ap_selection.ap_ids.length > 1) {
      errors.push('Single AP selection must not include more than one ap_id');
    }
  } else if (req.ap_selection.type === 'multi') {
    if (!Array.isArray(req.ap_selection.ap_ids) || req.ap_selection.ap_ids.length < 2) {
      errors.push('Multi AP selection requires at least two ap_ids');
    }
    if (!['max_rssi', 'coverage', 'overlap_dB'].includes(req.multi_ap_mode)) {
      errors.push('multi_ap_mode required for multi selection (max_rssi | coverage | overlap_dB)');
    }
  }

  if (!req.units || !req.units.freq || !req.units.distance || !req.units.power || !req.units.gain) {
    errors.push('units with freq, distance, power, gain are required');
  }

  if (!req.crs) {
    errors.push('crs is required');
  }

  if (typeof req.seed !== 'number' || !Number.isInteger(req.seed)) {
    errors.push('seed must be an integer');
  }

  return errors;
}

// PUBLIC_INTERFACE
export const UNIT_LABELS = {
  freq: {
    Hz: 'Hz',
    MHz: 'MHz',
  },
  distance: {
    m: 'm',
  },
  power: {
    dBm: 'dBm',
  },
  gain: {
    dBi: 'dBi',
  },
};

// PUBLIC_INTERFACE
export function describeUnits(units) {
  if (!units) return '';
  const f = UNIT_LABELS.freq[units.freq] || units.freq || '';
  const d = UNIT_LABELS.distance[units.distance] || units.distance || '';
  const p = UNIT_LABELS.power[units.power] || units.power || '';
  const g = UNIT_LABELS.gain[units.gain] || units.gain || '';
  return `freq: ${f}, distance: ${d}, power: ${p}, gain: ${g}`;
}
