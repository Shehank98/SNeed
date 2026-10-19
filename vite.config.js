import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// After the build, inject the list of built files into dist/sw.js so the whole
// app is precached on first visit (works offline right after one online load).
function swPrecache() {
  let outDir = 'dist';
  return {
    name: 'sneed-sw-precache',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const root = path.resolve(outDir);
      const swPath = path.join(root, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const files = [];
      const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
          const p = path.join(dir, f);
          if (fs.statSync(p).isDirectory()) walk(p);
          else files.push(path.relative(root, p).split(path.sep).join('/'));
        }
      };
      walk(root);
      const list = files.filter((f) => f !== 'sw.js').map((f) => (f === 'index.html' ? './' : './' + f));
      const hash = crypto.createHash('sha1');
      for (const f of files) if (f !== 'sw.js') hash.update(f).update(fs.readFileSync(path.join(root, f)));
      let src = fs.readFileSync(swPath, 'utf8');
      src = src.replace('__PRECACHE__', JSON.stringify(list)).replace('__VERSION__', hash.digest('hex').slice(0, 10));
      fs.writeFileSync(swPath, src);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [swPrecache()],
  build: { target: 'es2019', sourcemap: false },
});
