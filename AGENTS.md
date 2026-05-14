# AGENTS.md

Working context for agents continuing this project. Update as decisions are made.

## Project Goal

A lightweight, zero-dependency JavaScript library that detects writing systems in mixed-language text and wraps each segment in a `<span>` with `lang`, `data-script`, and CSS class attributes. Primary use case: per-script CSS font styling.

**Guiding principle:** maximally simple and elegant. Prefer fewer lines, fewer abstractions, fewer config knobs over completeness.

## Current Branch State

- `main` — v2.0 snapshot (commit `ae1368a`)
- `v2.1` — active refactor branch (current)

## File Inventory

| File | Status | Purpose |
|---|---|---|
| `multilingual.js` | active | Main library |
| `index.html` | active | Single-page demo: overview, configuration examples, options table, complex sample |
| `README.md` | active | User docs |
| `HISTORY.md` | reference | Phase-by-phase build log from v1/v2 |
| `AGENTS.md` | this file | Live working context |

## Architectural Review (2026-05-14)

Evaluated the v2.0 approach against the "simple and elegant" goal:

### 1. TreeWalker vs recursive DOM traversal — **switch to recursive**

TreeWalker's perf advantage only matters on very deep trees. The current code needs `.bind(this)` inside `acceptNode` (Phase 7 bug fix) — that friction is a code smell. A plain recursive function is ~8 lines, more readable, no binding gymnastics.

### 2. Hardcoded Unicode ranges vs `\p{Script=...}` regex — **switch to regex**

Current code hardcodes ~70 lines of code-point ranges (CJK Extensions A–F, Hangul Jamo Extended A/B, Latin Extended A/B, etc.) — essentially a hand-rolled reimplementation of Unicode's `Script` property. Modern JS supports this natively:

```js
const SCRIPTS = {
  latin:    /\p{Script=Latin}/u,
  korean:   /\p{Script=Hangul}/u,
  japanese: /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
  chinese:  /\p{Script=Han}/u,
  // ...
};
```

Shorter, auto-handles future Unicode additions, can't miss a block. Browser support already documented as a requirement in README.

### 3. Other simplification candidates

- `wrap()` selector parsing manually handles `#`/`.` prefixes — `querySelectorAll` already does this.
- `wrapMultilingualText` global function — kept for backward compat. Drop if we're simplifying.
- `isInitialized` flag — set but never read.

## Cleanup Done (v2.1)

Commit `599b040`:
- Deleted empty: `config-examples.js`, `examples.html`, `multilingual-wrapper.js`
- Deleted stale: `configuration-demo.html` (used removed `window.MULTILINGUAL_CONFIG` API)

## Pending Work

None on the v2.1 simplification track. Possible next moves:
- Validate visually in browser against `index.html` and `example-new-api.html`.
- Verify the Arabic space handling against any concrete failing case the original user had (HISTORY.md "Phase 5" was vague; couldn't reproduce in this pass).
- Consider tightening `wrapSegments` (still uses string templates + class concat logic).

## Done

- ✅ **Unicode ranges → `\p{Script=...}` regex** (`f66a245`). `SCRIPT_PATTERNS` at module scope; `detectScript` is 8 lines. Order: kana before Han so Japanese isn't swallowed by `chinese`. File 437 → 381 (−55).
- ✅ **TreeWalker → recursive traversal** (`d76c38e`). `processElement` is now a 9-line recursive function; `bind(this)` gone. Snapshots `childNodes` before recursing so `processTextNode`'s DOM mutations don't break iteration. The `data-script` and `skipElements` guards now live on the recursive function itself. Dropped debug log for text-node count (the `wrap()` element-count log remains). File 381 → 359 (−22).
- ✅ **`wrap()` collapsed to `querySelectorAll`**. 30+ lines of `#`/`.`/tag/class-name prefix parsing replaced by `target instanceof Element ? [target] : [...document.querySelectorAll(target)]`. Browsers' native selector engine handles every form.
- ✅ **Dropped legacy surface**: removed `wrapMultilingualText` global shim and the unused `isInitialized` flag. Removed the duplicate setTimeout block in `static init` (DOMContentLoaded path and immediate path share one `run` closure).
- ✅ **`segmentText` rewritten as a three-phase tagger** (43 → 27 lines). Phase 1: tag each char with a script or `null` (inheritable). Phase 2: previous-fill nulls. Phase 3: forward-fill any remaining nulls (handles leading whitespace), fallback to `'latin'`. Final pass groups consecutive same-script chars into segments and applies `minSegmentLength`.
  - **Bugfix as side effect**: `glyphOverrides` for punctuation now actually works. Previously, characters listed in `glyphOverrides` that were also matched by `\p{P}` would hit the whitespace branch first and inherit a neighbor script, ignoring the user's override.
- ✅ **README cleanup**: dropped "TreeWalker API" from the browser-support list (no longer required).

- ✅ **Config naming + trimming**.
  - `autoWrap` → `autoInit`. `autoWrapSelector` → `selector`. `autoWrapDelay` → `delay`. (Previous names were awkward because `init()` is already the explicit call — the "auto" is about wrapping on init, not about init itself; `autoInit` reads correctly.)
  - Removed `minSegmentLength` (no realistic use case; `1` covered everything).
  - Removed `cssClasses.wrapper` (redundant — every span already has `data-script` and the `ml-xx` short class, providing two CSS-target paths).
  - Updated [index.html](index.html), [example-new-api.html](example-new-api.html), and [README.md](README.md) to match. (HISTORY.md left as-is — it's a frozen v2.0 record.)

- ✅ **Further config trim + examples rewrite**.
  - **Initially dropped `preserveWhitespace`** because the `false` branch produced arbitrary fallback-to-latin behavior. Reinstated in the next pass under a better name (see below) once a legitimate use case surfaced.
  - **Dropped `cssClasses.scriptSpecific`**. Library already exposes two CSS-target paths (`data-script` attribute + `ml-xx` class). Adding a third just renames the same target — no new capability.
  - **Flattened `cssClasses.useShortNames` → top-level `useShortNames`** since `cssClasses` no longer has multiple keys.
  - **Kept `languageOverrides`** — it has a real BCP-47 justification (Traditional vs Simplified Chinese, hyphenation, screen-reader pronunciation, font fallbacks via `[lang^="zh-Hant"]`). Improved its rationale in `examples.html`.
  - **Renamed `example-new-api.html` → `examples.html`** (API is no longer "new"). Rewrote as a feature gallery instead of an API-style gallery: each section demos one config option with before/after columns.

- ✅ **Merged `index.html` + `examples.html` into single-page guide** (this pass).
  - Renamed `separateWhitespace` → `separateSpace` so the option, data-script value (`space`), and class (`ml-space`) are all consistent (matching the pattern that `separatePunct/Num` already had).
  - Restyled `.ml-space` from a thin dotted outline to a solid grey box, matching the other category boxes. The outline implied "decoration"; the spans are real segments.
  - Combined index.html (Quantum Mechanics demo) and examples.html (option gallery) into one entry-point page. New structure:
    1. **Overview** — what the library does and why (per-script CSS in mixed-language pages).
    2. **Try it** — a single paragraph with 5 scripts, auto-wrapped on load.
    3. **Configuration** — one h3 per option with before/after columns. The `languageOverrides` example now visualizes the `lang` attribute via `::after` so you don't have to inspect the DOM.
    4. **All options** — single table matching README.
    5. **Complex sample** — Quantum Mechanics in 5 languages with `glyphOverrides`, `languageOverrides`, `separateNum`, and `skipElements` all stacked. The inline `<code>` block stays unwrapped; digits like `1900` / `۱۹۰۰` render in green `ml-num` boxes with tabular-nums.
  - Deleted `examples.html` (content moved into index.html).

- ✅ **Replaced `wrapWhitespace` with three category-separation flags**.
  - User reframed: the option isn't about *visual bleed* but about *typographic control* of three independent character categories. Whitespace, punctuation, and digits are conceptually three separate things, each with its own use case (visible spaces / styled punct / tabular nums). Lumping them under one boolean lost that distinction.
  - Dropped `wrapWhitespace`. Added three independent booleans (default `false`):
    - `separateWhitespace` → spans get `data-script="whitespace"` + `class="ml-space"`
    - `separatePunct` → `data-script="punctuation"` + `class="ml-punct"`
    - `separateNum` → `data-script="number"` + `class="ml-num"`
  - **Category-pseudo-scripts don't propagate during inheritance.** A `CATEGORY_SCRIPTS` set carries `'whitespace'`, `'punctuation'`, `'number'`. The prev-fill / next-fill passes skip them when looking for a script to inherit, so an unseparated space next to a separated comma still inherits the nearest *real* script (latin/korean/etc.) instead of getting the punct script. Without this rule, `separatePunct: true` on `"한국어, 좋아요"` would put the post-comma space into the punct span; with it, the space stays Korean.
  - `lang` attribute is omitted for category-pseudo-scripts (they're not languages). `scriptToLang` lookup returns `undefined` → `wrapSegments` skips the `lang=""`.
  - Digit handling moved out of `detectScript`'s fallback: `\p{N}` is matched explicitly in `segmentText`, mapped to `'number'` or `'latin'` depending on `separateNum`. Cleaner than the implicit "digits fall through" behavior.
  - Updated `examples.html`: section 2 demos all four states (default + each flag + all three).

## SCRIPT_PATTERNS coverage

Within the 10 supported scripts (Latin, Korean, Japanese kana, Chinese Han, Arabic, Cyrillic, Greek, Hebrew, Thai, Devanagari), `\p{Script=...}` is canonical and complete — no block gaps. Limitations:

- **CJK ambiguity**: Han ideographs always classify as `chinese`. Japanese kanji-only segments will be tagged `chinese` unless Hiragana/Katakana co-occur. Known design limitation.
- **Combining marks (`Script=Inherited`)**: e.g. U+0300 COMBINING GRAVE — no script-specific match; falls through to `'latin'`. Rare in practice (most scripts use precomposed forms).
- **Unsupported scripts**: Bengali, Tamil, Tibetan, Khmer, Lao, Georgian, Armenian, Ethiopic, Mongolian, etc. — all fall through to `'latin'`. Intentional scope limit.

## Final Metrics

- `multilingual.js`: 437 → 285 lines (−152, −35%).
- Demo files collapsed: `index.html` + `example-new-api.html` (later `examples.html`) → single `index.html` covering everything.
- Empty/stale files removed: `config-examples.js`, `examples.html` (v1), `multilingual-wrapper.js`, `configuration-demo.html`.
- Config surface: 11 options → 10 (but more orthogonal: each option does one specific thing).

## Known Issues (carried over from HISTORY.md)

- **Arabic (RTL) space handling — unresolved.** Spaces between scripts get classified inconsistently. `lastNonWhitespaceScript` partially helps but doesn't cover all boundary cases. May need a two-pass / lookahead segmentation.
- **CJK ambiguity.** Han ideographs are assigned to `chinese` by default; Japanese-only detection requires Hiragana/Katakana co-presence in the segment. Acceptable limitation.
- **Same-script segments separated by whitespace** emit as two `<span>`s. A post-segmentation merge pass would consolidate.

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-14 | Branch v2.1 from v2.0 snapshot for refactor | Preserve working v2.0 on `main` |
| 2026-05-14 | Delete `configuration-demo.html` instead of rewriting | Easier to rewrite later than maintain stale demo |
| 2026-05-14 | Commit to Unicode regex over code-point ranges | Elegance + future-proofing |

## How to Update This File

- Add to **Decision Log** when making non-obvious choices.
- Move items between **Pending Work** and a "Done" sub-section as they land (with commit hash).
- Update **Known Issues** when discovering or resolving bugs.
- Keep **Architectural Review** as the rationale snapshot; don't rewrite history — append addenda if a decision is revisited.
