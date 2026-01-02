# Deployment Guide - ONE WRONG TURN

## For Poki Platform

### Build for Production

```bash
npm install
npm run build
```

This creates a `dist/` folder with:
- `index.html` - Single HTML file with all styles embedded
- `assets/index-*.js` - Bundled JavaScript with Three.js included

### Deploy to Poki

1. Upload the entire `dist/` folder contents to your Poki game directory
2. Ensure `index.html` is the entry point
3. The game is self-contained with no external dependencies

### File Size

- Total bundle size: ~475 KB (uncompressed)
- Gzipped size: ~121 KB
- Perfect for web distribution

### Requirements

- Modern browser with WebGL support
- JavaScript enabled
- localStorage enabled for persistent stats

### Testing Locally

Preview the production build:

```bash
npm run preview
```

Or serve the `dist/` folder with any static file server:

```bash
cd dist
python3 -m http.server 8000
```

Then open http://localhost:8000

### Configuration

No configuration needed. The game is production-ready out of the box.

### Performance Notes

- Targets 60 FPS on mid-range devices
- WebGL-based 3D rendering via Three.js
- Efficient memory management with proper disposal
- Responsive to all screen sizes

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

### Poki SDK Integration (Optional)

If you need to integrate Poki SDK features (ads, gameplay tracking), add the SDK script to `index.html` before the closing `</body>` tag:

```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

Then use Poki SDK methods in your code as needed.
