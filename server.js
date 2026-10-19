// Tiny static server for the Vite build (dist/) with SPA fallback.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const app = express();

app.disable('x-powered-by');
app.use(compression());

app.get('/healthz', (_req, res) => res.type('text').send('ok'));

app.use(
  express.static(dist, {
    index: false,
    setHeaders(res, file) {
      const name = path.basename(file);
      if (name === 'sw.js' || name === 'index.html' || name === 'manifest.webmanifest') {
        // The service worker, shell and manifest must always be revalidated.
        res.setHeader('Cache-Control', 'no-cache');
      } else if (file.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
      if (name === 'sw.js') res.setHeader('Service-Worker-Allowed', '/');
      if (name.endsWith('.webmanifest')) res.type('application/manifest+json');
    },
  })
);

// SPA fallback: any other GET that is not a file gets the app shell.
app.get('*', (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(dist, 'index.html'));
});

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.warn('dist/index.html not found. Run "npm run build" first.');
}

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`SNeed listening on :${port}`));
