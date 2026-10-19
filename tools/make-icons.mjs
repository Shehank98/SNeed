// Renders PNG app icons without any dependencies (tiny software rasteriser + PNG encoder).
// Run: npm run icons
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/letters.json'), 'utf8'));
const b = data.letters.find((l) => l.char === 'b');

const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(type), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// scene in unit square; `s` shrinks content toward the centre (maskable safe zone)
function render(size, s = 1) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 2;
  const T = (v) => 0.5 + (v - 0.5) / s; // inverse content transform
  const unit = 0.25 * s; // one line spacing in output units
  const top = 0.5 - unit * 1.5 + 0.0; // sky line y
  const x0 = 0.5 - 0.4 * unit; // b is 0.8 wide
  const segs = [];
  for (const st of b.strokes) for (let i = 1; i < st.points.length; i++) segs.push([st.points[i - 1], st.points[i]]);
  const dseg = (px, py, [a, c]) => {
    const ax = x0 + a[0] * unit, ay = top + a[1] * unit, cx = x0 + c[0] * unit, cy = top + c[1] * unit;
    const dx = cx - ax, dy = cy - ay, l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  const sky = top, clouds = top + unit, grass = top + 2 * unit;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, bl = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = (x + (sx + 0.5) / SS) / size, py = (y + (sy + 0.5) / SS) / size;
      let c;
      if (py < grass) { const k = py / grass; c = [105 + 110 * k, 189 + 52 * k, 253 + 2 * k]; if (py > sky) c = [228, 244, 255]; if (py > clouds) c = [255, 251, 234]; }
      else c = [155, 106, 60];
      if (Math.abs(py - sky) < 0.006 * s * 2) c = [47, 143, 232];
      if (Math.abs(py - grass) < 0.011 * s * 2) c = [47, 184, 79];
      if (Math.abs(py - clouds) < 0.005 * s * 2 && Math.floor(px / (0.032 * s)) % 2 === 0) c = [170, 182, 198];
      let d = Infinity;
      for (const sg of segs) d = Math.min(d, dseg(px, py, sg));
      if (d < 0.085 * unit * 1.9) c = [61, 42, 122];
      r += c[0]; g += c[1]; bl += c[2];
    }
    const o = (y * size + x) * 4;
    buf[o] = r / (SS * SS); buf[o + 1] = g / (SS * SS); buf[o + 2] = bl / (SS * SS); buf[o + 3] = 255;
  }
  return png(size, size, buf);
}
const dir = path.join(root, 'public/icons');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'icon-192.png'), render(192));
fs.writeFileSync(path.join(dir, 'icon-512.png'), render(512));
fs.writeFileSync(path.join(dir, 'maskable-512.png'), render(512, 0.72));
fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), render(180));
console.log('icons written to public/icons');
