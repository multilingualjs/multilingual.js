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
| `index.html` | active | Demo (Quantum Mechanics multilingual text) |
| `example-new-api.html` | active | API usage examples |
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

In rough priority order:

1. **Replace TreeWalker with recursive traversal** — removes `bind(this)` friction.
2. **Simplify `wrap()` selector handling** — collapse to `querySelectorAll`.
3. **Drop `wrapMultilingualText` and `isInitialized`** if no longer justified.
4. **Re-evaluate Arabic space handling** (see Known Issues) once segmentation logic is simpler.

## Done

- ✅ **Unicode ranges → `\p{Script=...}` regex** (commit pending). `SCRIPT_PATTERNS` lives at module scope; `detectScript` is now 8 lines. Order: kana before Han so Japanese isn't swallowed by `chinese`. File 437 → 381 lines (−55).

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
