# ASCII FPS — a 3D world in coloured characters

A first-person 3D world drawn entirely with text characters, built up in five small steps.
Each stage is a single HTML file with no dependencies. **Double-click any stage to run it**
in your browser. Read the code top to bottom: every stage starts with a "New in this stage"
comment, and the parts that didn't change are labelled as such, so you can focus on what's new.

Tip: compare two stages side by side (for example in VS Code with "Compare Selected") to see
exactly what each step added.

## The stages

| Stage | File | What you learn |
|---|---|---|
| 1 | `01-screen-and-loop.html` | A screen made of character cells, each with its own colour. **Brightness → character** via a ramp (`" .:-=+*#%@"`). Fast drawing with pre-rendered glyphs. The game loop and keyboard input. |
| 2 | `02-column-raycaster.html` | The Wolfenstein 3D trick: one ray per screen column, the **DDA** grid walk, distance → wall height, why we use *perpendicular* distance (press **F** to see the fisheye bug), floor casting. |
| 3 | `03-true-3d-rays.html` | **One 3D ray per character** through a voxel world, which makes real up/down looking possible. Camera basis vectors (forward/right/up from yaw and pitch) and 3D DDA. |
| 4 | `04-mouse-look-and-movement.html` | **Pointer Lock** mouse look, gravity and jumping, box-vs-blocks collision (slide along walls, land on crates, climb to the roof), minimap, FPS counter. |
| 5 | `05-lighting-and-color.html` | Procedural **textures**, **sun shadows** (a second ray toward the sun), sky and lamp light spread by **flood fill**, a torch, fog, clouds, night mode, tone mapping. |

## Controls (stages 4–5)

- **Click** to capture the mouse, **Esc** to release it
- **WASD**: move · **Shift**: sprint · **Space**: jump
- **Mouse** or **arrow keys**: look · **wheel**: zoom (field of view)
- **1 / 2**: mouse sensitivity · **M**: minimap
- Stage 5 only: **F** torch · **H** shadows · **N** day/night

There's a staircase in the courtyard. Jump up it to reach the roof, then look down through the skylight.

## The core ideas in one place

1. **Brightness picks the character _and_ dims the colour.** Dark areas get sparse, dim
   characters and bright areas dense, vivid ones. That double cue is what sells the 3D.
2. **Characters aren't square** (about 0.6 as wide as they are tall). Every stage measures this
   and corrects for it, or the world looks squashed.
3. **DDA**: walk a ray from one grid line to the next instead of in tiny steps. It's fast and
   never skips a block.
4. **One ray per character** (≈10,000 per frame) is cheap enough in plain JavaScript, and it lets
   you look in any direction.
5. **Light = texture colour × (ambient + sky + lamps + sun + torch)**, then fog, then tone
   mapping. Shadows are simply "can this point see the sun?"

## Try this

- **Stage 1:** swap the `RAMP` for `" .,-~:;=!*#$@"` or `" ░▒▓█"` and see how the mood changes.
- **Stage 2:** change `PLANE_LEN` (field of view) or the map. Press F and walk along a long wall.
- **Stage 3:** edit `LAYERS`, for example build a bridge on layer 3 or punch a window into a wall.
- **Stage 4:** change `GRAVITY` and `JUMP_SPEED` (moon jump!), or raise `MAX_COLS` for more detail.
- **Stage 5:** move the `SUN`, add a lamp `L` anywhere in `LAYERS`, or try `EXPOSURE` 1.2 versus 3.

## Where to go next

Doors that open, sprites and enemies (draw them as billboards, using a depth buffer per
character), placing and breaking blocks with the crosshair (one ray from the centre),
procedurally generated levels, water or glass (keep the ray going after a hit), and coloured
lamps.
