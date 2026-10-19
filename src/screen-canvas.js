// Browser backend for screen.js: draws the cell grid on a canvas by stamping pre-rendered
// glyph bitmaps straight into its pixels.
const MAX_COLS = 180;

export const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
let cellW = 0, cellH = 0, image, pixels;
const glyphs = new Map();

export const canvasBackend = {
  resize() {
    ctx.font = "bold 100px monospace";
    const charAspect = ctx.measureText("M").width / 100;
    const dpr = window.devicePixelRatio || 1;
    const screenW = Math.floor(window.innerWidth * dpr);
    const screenH = Math.floor(window.innerHeight * dpr);
    cellW = Math.max(6, Math.ceil(screenW / MAX_COLS));
    cellH = Math.round(cellW / charAspect);
    const cols = Math.max(1, Math.floor(screenW / cellW));   // at least 1: the window can be 0×0 while loading
    const rows = Math.max(1, Math.floor(screenH / cellH));
    canvas.width = cols * cellW;
    canvas.height = rows * cellH;
    canvas.style.width = canvas.width / dpr + "px";
    canvas.style.height = canvas.height / dpr + "px";
    image = ctx.createImageData(canvas.width, canvas.height);
    pixels = new Uint32Array(image.data.buffer);
    glyphs.clear();
    return { cols, rows, cellW, cellH };
  },

  cellAt(clientX, clientY, cols, rows) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * cols);
    const y = Math.floor(((clientY - rect.top) / rect.height) * rows);
    return x >= 0 && y >= 0 && x < cols && y < rows ? { x, y } : null;
  },

  present(chars, colors, cols, rows) {
    pixels.fill(0xff000000);
    const W = canvas.width;
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = cy * cols + cx;
        const ch = chars[i];
        if (ch === " ") continue;
        const { offs, ink } = glyph(ch);
        const r = colors[i * 3], gr = colors[i * 3 + 1], b = colors[i * 3 + 2];
        const base = cy * cellH * W + cx * cellW;
        for (let k = 0; k < offs.length; k++) {
          const a = ink[k];
          pixels[base + offs[k]] = 0xff000000 | ((b * a >> 8) << 16) | ((gr * a >> 8) << 8) | (r * a >> 8);
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  },
};

// A glyph is the list of pixels the character actually inks (most of a cell is empty),
// stored as offsets from the cell's top-left pixel plus how much ink each one gets.
function glyph(ch) {
  let g = glyphs.get(ch);
  if (!g) {
    const c = document.createElement("canvas");
    c.width = cellW; c.height = cellH;
    const gctx = c.getContext("2d", { willReadFrequently: true });
    gctx.font = `bold ${cellH}px monospace`;
    gctx.textBaseline = "top";
    gctx.fillStyle = "#fff";
    gctx.fillText(ch, 0, 0);
    const rgba = gctx.getImageData(0, 0, cellW, cellH).data;
    const offs = [], ink = [];
    for (let py = 0; py < cellH; py++)
      for (let px = 0; px < cellW; px++) {
        const a = rgba[(py * cellW + px) * 4 + 3];
        if (a) { offs.push(py * canvas.width + px); ink.push(a); }
      }
    g = { offs: Int32Array.from(offs), ink: Uint8Array.from(ink) };
    glyphs.set(ch, g);
  }
  return g;
}
