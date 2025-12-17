# CoverageVisualizationUI

React app for rendering 2D heatmap and 3D volume coverage views with export to PNG/HTML.

## Features

- 2D/3D mode switch with z_slice/z_height logic and validation
- Color map, color range, thresholds, AP selection (single/multi with multi_ap_mode)
- Overlays (kriging variance toggle), downsampling factor
- Deterministic seed handling and config hash
- Health status via /api/v1/healthz
- Export panel calling /api/v1/export/png and /api/v1/export/html with responses displayed and metrics

## Environment

Set one of:
- REACT_APP_API_BASE, or
- REACT_APP_BACKEND_URL

Optional:
- REACT_APP_API_KEY to send X-API-Key header

See .env.example for other available variables.

## Scripts

- npm start
- npm test
- npm run build

## Notes

- Visualization uses Plotly if available on window.Plotly. If not present, a placeholder is shown. You can include Plotly via a script tag in index.html or add the 'plotly.js' dependency.
- No ports are hard-coded; base URLs are taken from env.
