// One dungeon floor: a 3D grid of blocks plus everything derived from it
// (light, where creatures can stand, what the map shows) and everything living on it.
import { computeLight } from "./light.js";

export const W = 48, D = 48, H = 10;  // x, y (map), z (up); tall rooms reach up to z = 8
export const FLOOR_Z = 2;      // feet height on ordinary floor: z = 0..1 is solid ground
export const ROOM_TOP = 6;     // rooms are open from z = 2 to 5; z = 6 is the ceiling
export const CORRIDOR_TOP = 4; // corridors are two blocks tall
export const FINAL_DEPTH = 20;  // the last floor: the Lich King's throne room, no stairs down

// Block types. Index in this list = block id stored in the grid (0 = air).
//   door/locked/gate/lever/brazier: interactive · emissive: glows on its own
//   ghost: solid, but only visible with your torch out (raycast.js skips it otherwise)
//   numeral: a rune that reads as a number (1–4), for the brazier puzzle
//   mural: a carved panel showing a lever, the Rune Lever room's record (lit: "pull this one")
export const BLOCKS = [
  { key: "AIR",      name: "air" },
  { key: "ROCK",     name: "rough rock",    color: [112, 104, 96] },
  { key: "STONE",    name: "stone wall",    color: [150, 150, 165] },
  { key: "BRICK",    name: "brick wall",    color: [175, 82, 55] },
  { key: "MOSS",     name: "mossy stone",   color: [85, 150, 90] },
  { key: "TILE",     name: "tiled floor",   color: [170, 158, 135] },
  { key: "PLANK",    name: "wooden boards", color: [140, 95, 55] },
  { key: "GRASS",    name: "grass",         color: [90, 150, 60] },
  { key: "COLUMN",   name: "marble column", color: [215, 210, 200] },
  { key: "CRATE",    name: "crate",         color: [165, 112, 60] },
  { key: "LAMP",     name: "lamp",          color: [255, 210, 130], emissive: true },
  { key: "DOOR",     name: "wooden door",   color: [150, 95, 50], door: true },
  { key: "LOCKED",   name: "locked door",   color: [120, 125, 140], door: true, locked: true },
  { key: "GATE",     name: "iron gate",     color: [95, 100, 110], gate: true },
  { key: "RUNE",     name: "carved stone",  color: [150, 150, 165] },
  { key: "LEVER",    name: "lever",         color: [150, 150, 165], lever: true },
  { key: "LEVER_ON", name: "lever",         color: [150, 150, 165], lever: true, on: true },
  { key: "STAIRS",   name: "stairs down",   color: [125, 125, 135] },
  { key: "WATER_SHALLOW", name: "shallow water", color: [80, 165, 185] },
  { key: "WATER_DEEP",    name: "deep water",    color: [35, 75, 160] },
  { key: "STAIRS_UP",     name: "stairs up",     color: [150, 165, 190] },
  { key: "GHOST",         name: "ghostly planks", color: [150, 210, 255], ghost: true },
  { key: "BRAZIER",       name: "cold brazier",  color: [85, 80, 78], brazier: true },
  { key: "BRAZIER_LIT",   name: "brazier",       color: [255, 170, 70], brazier: true, on: true, emissive: true },
  { key: "RUNE_1",        name: "carved stone",  color: [150, 150, 165], numeral: 1 },
  { key: "RUNE_2",        name: "carved stone",  color: [150, 150, 165], numeral: 2 },
  { key: "RUNE_3",        name: "carved stone",  color: [150, 150, 165], numeral: 3 },
  { key: "RUNE_4",        name: "carved stone",  color: [150, 150, 165], numeral: 4 },
  // Floor mosaics: vivid seen from above (the map), faded and hard to read at eye level.
  { key: "MOSAIC_RED",    name: "mosaic tiles",  color: [215, 65, 55], mosaic: true },
  { key: "MOSAIC_BLUE",   name: "mosaic tiles",  color: [70, 120, 235], mosaic: true },
  { key: "MOSAIC_GOLD",   name: "mosaic tiles",  color: [240, 195, 60], mosaic: true },
  { key: "MOSAIC_WHITE",  name: "mosaic tiles",  color: [230, 230, 235], mosaic: true },
  { key: "SPIKES",        name: "spike trap",    color: [125, 118, 112], spikes: true },   // traps.js
  { key: "ALTAR",         name: "altar",         color: [220, 210, 190] },
  { key: "MURAL",         name: "carved panel",  color: [150, 150, 165], mural: true },
  { key: "MURAL_LIT",     name: "carved panel",  color: [150, 150, 165], mural: true, on: true },
];
export const B = {};
BLOCKS.forEach((b, i) => (B[b.key] = i));

// What a column looks like on the top-down map. Deliberately says nothing about height:
// ledges and crates are FLOOR. HOLE (a pit or chasm) is only drawn once you've looked into it in 3D.
export const KIND = {
  UNKNOWN: 0, FLOOR: 1, WALL: 2, DOOR: 3, LOCKED: 4, GATE: 5, LEVER: 6, STAIRS: 7,
  HOLE: 8, SHALLOW: 9, DEEP: 10, BRIDGE: 11, STAIRS_UP: 12, MOSAIC: 13, SPIKES: 14,
};

export class Floor {
  constructor(depth, seed) {
    this.w = W; this.d = D; this.h = H;
    this.depth = depth;
    this.seed = seed;
    this.blocks = new Uint8Array(W * D * H);
    this.seen = new Uint8Array(W * D);    // auto-map: 1 once your eyes have passed over a column
    this.holeSeen = new Uint8Array(W * D);  // 1 once you've looked down into a pit or chasm in 3D
    this.kind = new Uint8Array(W * D);    // KIND per column
    this.stand = new Int8Array(W * D);    // standing height per column, -1 = nowhere to stand
    this.skyLight = this.lampLight = this.litMask = null;
    this.navVersion = 0;                  // bumps whenever the blocks change

    this.links = new Map();       // lever voxel index → { action, cells: [[x,y,z]…], group? } (interact.js)
    this.groups = new Map();      // lever group id → { need, pulled, cells }: gates that need several levers
    this.braziers = null;         // the brazier puzzle, if this floor has one (interact.js)
    this.bombs = [];              // lit bombs lying on the ground (throwing.js)
    this.secret = null;           // the secret room: { x0, y0, x1, y1, found }
    this.secretWalls = new Set(); // columns (x + y·W) of the thin walls a bomb can open into it
    this.vaultHinted = false;
    this.monsters = [];
    this.items = [];
    this.npcs = [];               // people (and flat beings, and one talking door) you can speak to: npcs.js
    this.spikes = new Map();      // column (x + y·W) → { phase, period, up }: spike traps (traps.js)
    this.projectiles = [];   // thrown knives and potions in flight (3D)
    this.clouds = [];        // lingering poison gas
    this.markers = [];            // [{ x, y }] placed on the map
    this.sightings = new Map();   // monster id → { x, y, glyph, color, time } where you last saw it
    this.rooms = [];
    this.spawn = { x: 0, y: 0, z: FLOOR_Z, yaw: 0 };
    this.stairs = null;     // { x, y } of the stairs down
    this.upStairs = null;   // { x, y } of the stairs up (none on the first floor)
    this.hasSky = false;
  }

  index(x, y, z) { return x + y * W + z * W * D; }

  get(x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= D || z >= H) return 0;
    return this.blocks[x + y * W + z * W * D];
  }

  set(x, y, z, id) {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= D || z >= H) return;
    this.blocks[x + y * W + z * W * D] = id;
  }

  // For collision: the world's sides and top are solid, but below it is open
  // (that's how you fall through a pit, or sink through deep water, to the next floor).
  solid(x, y, z) {
    if (z < 0) return false;
    if (z >= H || x < 0 || y < 0 || x >= W || y >= D) return true;
    const b = this.blocks[x + y * W + z * W * D];
    return b !== 0 && b !== B.WATER_DEEP;   // deep water: you sink right through it, like a chasm
  }

  // The lowest spot in column (x, y) with solid ground under it and two blocks of air above.
  // doors: "solid" (closed doors block), "open" (wooden doors count as passable),
  //        "all" (locked doors too — for checking a level can be finished).
  standHeight(x, y, doors = "solid") {
    if (this.get(x, y, FLOOR_Z - 1) === B.WATER_DEEP) return -1;   // too deep to stand in
    const isAir = (z) => {
      const b = this.get(x, y, z);
      if (b === 0) return true;
      if (doors === "solid") return false;
      const info = BLOCKS[b];
      return !!info.door && (doors === "all" || !info.locked);
    };
    for (let z = 1; z < H - 1; z++) {
      if (!isAir(z - 1) && isAir(z) && isAir(z + 1)) return z;
    }
    return -1;
  }

  // Recompute everything derived from the blocks. Call after any block changes.
  refresh() {
    computeLight(this, B.LAMP, B.BRAZIER_LIT);
    for (let y = 0; y < D; y++)
      for (let x = 0; x < W; x++) this.stand[x + y * W] = this.standHeight(x, y);
    this.computeKinds();
    this.navVersion++;
  }

  computeKinds() {
    for (let y = 0; y < D; y++) {
      for (let x = 0; x < W; x++) {
        let special = 0, allSolid = true;
        for (let z = FLOOR_Z; z < ROOM_TOP; z++) {
          const b = this.get(x, y, z);
          if (!b) { allSolid = false; continue; }
          const info = BLOCKS[b];
          if (info.door) special = info.locked ? KIND.LOCKED : KIND.DOOR;
          else if (info.gate) special = KIND.GATE;
          else if (info.lever && !special) special = KIND.LEVER;
        }
        let k;
        const ground = this.get(x, y, FLOOR_Z - 1), under = this.get(x, y, FLOOR_Z - 2);
        if (special) k = special;
        else if (allSolid) k = KIND.WALL;
        else if (ground === B.STAIRS) k = KIND.STAIRS;
        else if (ground === B.STAIRS_UP) k = KIND.STAIRS_UP;
        else if (ground === B.WATER_SHALLOW) k = KIND.SHALLOW;
        else if (ground === B.WATER_DEEP) k = KIND.DEEP;
        else if ((!ground || ground === B.GHOST) && !this.get(x, y, FLOOR_Z)) k = KIND.HOLE;   // ghost planks look like a chasm
        else if (ground === B.PLANK && under !== B.ROCK) k = KIND.BRIDGE;   // planks over air or water
        else if (BLOCKS[ground].mosaic) k = KIND.MOSAIC;
        else if (ground === B.SPIKES) k = KIND.SPIKES;
        else k = KIND.FLOOR;   // floors, ledges, crates: the map can't tell them apart
        this.kind[x + y * W] = k;
      }
    }
  }
}
