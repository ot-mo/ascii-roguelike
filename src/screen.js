// The character screen (learn/01): a grid of cells, each holding one character and one colour.
// Everything draws into this grid; a backend (screen-canvas.js) turns it into pixels.
// Call setBackend() before resize().
export const RAMP = " .:-=+*#%@";

// cellW × cellH: a cell's shape (only the ratio matters; the 3D camera uses it).
export let cols = 0, rows = 0, cellW = 1, cellH = 2;
let chars = [], colors = new Uint8ClampedArray(0);
let backend = null;

export function setBackend(b) { backend = b; }

export function resize() {
  ({ cols, rows, cellW, cellH } = backend.resize());
  chars = new Array(cols * rows).fill(" ");
  colors = new Uint8ClampedArray(cols * rows * 3);
}

export function clear() { chars.fill(" "); colors.fill(0); }

export function put(x, y, ch, r, g, b) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return;
  const i = y * cols + x;
  chars[i] = ch;
  colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
}

export function text(x, y, str, r = 220, g = 220, b = 220) {
  for (let k = 0; k < str.length; k++) put(x + k, y, str[k], r, g, b);
}

// Blank a rectangle (so text drawn on top of the 3D view stays readable).
export function blank(x, y, w, h) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, " ", 0, 0, 0);
}

export function rampChar(L) {
  const k = Math.floor(L * RAMP.length);
  return RAMP[Math.max(0, Math.min(RAMP.length - 1, k))];
}

// Multiply every cell's colour (e.g. a red flash when you get hurt).
export function tint(r, g, b) {
  for (let i = 0; i < cols * rows; i++) {
    colors[i * 3] *= r; colors[i * 3 + 1] *= g; colors[i * 3 + 2] *= b;
  }
}

// Which cell is under a pointer position? null if outside. (The browser passes client
// pixel coordinates; the terminal passes cell coordinates already.)
export function cellAt(px, py) { return backend.cellAt(px, py, cols, rows); }

export function present() { backend.present(chars, colors, cols, rows); }
