/**
 * tileCatalog.ts — Single source of truth for all terrain tile indices.
 *
 * Source spritesheet: /public/assets/terrain.png (256×160 px, 16×16 tiles)
 * Grid: 16 columns × 10 rows = 160 tiles total
 * Linear index = row * 16 + col
 *
 * HOW TO VERIFY:
 *   1. npm run dev  →  visit http://localhost:3000/debug
 *   2. Hover each tile to read its index
 *   3. Click "Save to /public/debug/" to persist terrain_atlas.png
 *
 * Atlas analysis (from /debug page, 2026-03-06):
 *   Tiles  0–12  : Cliff/ledge edge & corner tiles (brown cliff + green top)
 *   Tile  14     : Solid lime-green — GRASS_FILL CANDIDATE (awaiting confirmation)
 *   Tiles 16–34  : More cliff-ledge transition tiles (inner corners, sides)
 *   Tiles 64–71  : Solid sandy/orange ground — DIRT_FILL candidate
 *   Tiles 80–83  : Brown horizontal stripe — PATH candidate
 *   Tiles 112–115: Blue water tiles — WATER_FILL + SHORE candidates
 *
 * ⚠️  RULE: GRASS_FILL must be the flat, uniformly-tiling green ground tile.
 *     It MUST NOT be a cliff/ledge/edge transition tile (tiles 0–34).
 *     Tile 17 (r1c1) = cliff-center ledge tile — DO NOT use as GRASS_FILL.
 *
 * STATUS: ✅ GRASS_FILL confirmed by user (index 18, r1c2).
 *         Water uses Water.png (separate spritesheet).
 */

// ─── Base ground ─────────────────────────────────────────────────────────────

/** ✅ CONFIRMED — solid flat-green tile, no cliff edges. Use as base fill for all walkable land. */
export const GRASS_FILL = 18  // r1c2 — confirmed 2026-03-06

// ─── Cliff boundary tiles ────────────────────────────────────────────────────
// (Only place these at elevation-change boundaries — never as fill)

export const CLIFF_CORNER_NW   =  0   // r0c0
export const CLIFF_TOP         =  1   // r0c1
export const CLIFF_CORNER_NE   =  2   // r0c2
export const CLIFF_SIDE_L      = 16   // r1c0
export const CLIFF_LEDGE_CTR   = 17   // r1c1  ← was incorrectly used as GRASS_FILL before
export const CLIFF_CORNER_NE2  = 18   // r1c2  ← this IS GRASS_FILL per user confirmation
export const CLIFF_CORNER_SW   = 32   // r2c0
export const CLIFF_BOTTOM      = 33   // r2c1
export const CLIFF_CORNER_SE   = 34   // r2c2

// ─── Water ───────────────────────────────────────────────────────────────────
// Water.png (separate sheet) — indices into that spritesheet

export const WATER_FILL = 0   // center water tile
export const SHORE_N    = 1   // north shore edge
export const SHORE_S    = 2   // south shore edge
export const SHORE_E    = 3   // east shore edge
export const SHORE_W    = 4   // west shore edge

// ─── Dirt / Path ─────────────────────────────────────────────────────────────
// UNVERIFIED — confirm from /debug atlas

export const DIRT_FILL    = 25   // r1c9 — solid sandy-orange
export const PATH_FILL    = 81   // r5c1 — brown stripe tile — UNVERIFIED
export const GRASS_LIGHT  = 28   // r1c12
export const GRASS_DARK   = 76   // r4c12

// ─── Soil (garden) ───────────────────────────────────────────────────────────
// Soil.png (separate sheet)
export const SOIL_FILL = 0    // frame 0 of soil_ss spritesheet
