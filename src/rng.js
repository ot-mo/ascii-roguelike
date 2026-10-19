// Seeded random numbers, so a run (and every floor in it) can be replayed from its seed.
export function makeRng(seed) {
  let a = seed >>> 0;
  function rng() {   // mulberry32: tiny, fast, good enough for games
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  rng.int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));   // inclusive on both ends
  rng.pick = (list) => list[Math.floor(rng() * list.length)];
  rng.chance = (p) => rng() < p;
  rng.shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  return rng;
}

// A repeatable "random" number in 0..1 for integer inputs (textures, stars, noise).
export function hash(x, y, z = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise: random values at grid points, blended in between.
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
