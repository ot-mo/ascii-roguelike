// Keyboard and mouse, routed to the game's handlers (game.js). The actual events come from a
// backend (input-browser.js, with pointer lock for mouse look). Call setInputBackend() before initInput().
//
// keys holds the codes (KeyW, ArrowLeft, ShiftLeft, Space…) of the keys held down right now.
export const keys = new Set();
let backend = null;

export function setInputBackend(b) { backend = b; }
export function initInput(handlers) { backend.init(handlers, keys); }

// Pointer lock: the browser captures the mouse for looking around. (A backend without it would
// count as always "locked", with Esc pausing instead: see game.js.)
export function canLockPointer() { return backend.canLock; }
export function isLocked() { return backend.isLocked(); }
export function lockPointer() { backend.lock(); }
export function unlockPointer() { backend.unlock(); }

