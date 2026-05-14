# Multilingual Library – Development History

This document is a full record of the design decisions, implementation steps, attempted solutions, failures, and improvements made during the development of the Multilingual library. It is intended as a handoff document for continuing development.

---

## Project Overview

**Goal:** A lightweight, zero-dependency JavaScript library that detects writing systems in mixed-language text and wraps each segment in a `<span>` with appropriate `lang`, `data-script`, and CSS class attributes. The primary use case is enabling per-script CSS font styling on multilingual web pages.

**Final library name:** `Multilingual`  
**Main file:** `multilingual.js`  
**Demo file:** `index.html`  
**Examples file:** `example-new-api.html`

---

## Iteration Log

### Phase 1 – Initial Implementation

**What was built:**
- A class originally called `MultilingualWrapper` (later renamed).
- Used Unicode code point ranges to detect writing systems character by character.
- Supported: Latin, Korean (Hangul), Japanese (Hiragana/Katakana), Chinese (CJK), Arabic, Cyrillic, Greek, Hebrew, Thai, Devanagari.
- Used the TreeWalker DOM API to traverse all text nodes inside a target element.
- Each text node was split into segments by detected script, then each segment was replaced with a `<span>` containing:
  - `lang="..."` attribute (e.g., `lang="ko"`)
  - `data-script="..."` attribute (e.g., `data-script="korean"`)
  - CSS class name

**Design decisions:**
- Pure JavaScript, no dependencies.
- Character-level detection using Unicode ranges (not `Intl` API or regex-based heuristics).
- TreeWalker chosen for performance over recursive DOM traversal.
- Text nodes processed in **reverse order** to avoid DOM mutation issues during iteration.

---

### Phase 2 – Library Renamed to "Multilingual"

**What changed:**
- Class name `MultilingualWrapper` → `Multilingual`.
- All internal references and public API updated.
- File name kept as `multilingual.js`.

---

### Phase 3 – Short CSS Class Names

**Request:** Use short class names (`ml-ko`, `ml-en`) instead of long names (`korean-script`, `latin-script`).

**What was implemented:**
- Added a `scriptToShortClass` lookup map in the constructor:
  ```javascript
  this.scriptToShortClass = {
      latin: 'ml-en',
      korean: 'ml-ko',
      japanese: 'ml-ja',
      chinese: 'ml-zh',
      arabic: 'ml-ar',
      cyrillic: 'ml-ru',
      greek: 'ml-el',
      hebrew: 'ml-he',
      thai: 'ml-th',
      devanagari: 'ml-hi'
  };
  ```
- Controlled via `cssClasses.useShortNames: true` in config.
- Output example:
  ```html
  <span lang="ko" data-script="korean" class="ml-ko">안녕하세요</span>
  ```

---

### Phase 4 – Glyph Override System

**Request:** Users should be able to override the auto-detection for specific characters (e.g., force parentheses to be treated as Latin, force Arabic punctuation to be treated as Arabic).

**What was implemented:**
- Added a `glyphOverrides` config option, where keys are strings of characters and values are script names:
  ```javascript
  glyphOverrides: {
      '()[]{}': 'latin',
      '،؛؟': 'arabic'
  }
  ```
- In the constructor, each character from all override strings is expanded into `this.glyphOverrideMap` (a flat character → script map):
  ```javascript
  this.glyphOverrideMap = {};
  for (const [glyphs, script] of Object.entries(this.config.glyphOverrides)) {
      for (const glyph of glyphs) {
          this.glyphOverrideMap[glyph] = script;
      }
  }
  ```
- In `detectScript()`, the override map is checked **before** the Unicode ranges:
  ```javascript
  if (this.glyphOverrideMap[char]) return this.glyphOverrideMap[char];
  ```

---

### Phase 5 – Arabic Space Handling (Attempted Fix)

**Problem:** Spaces and punctuation between or around Arabic text were being classified as Latin script instead of Arabic, causing incorrect visual grouping and missed styling.

**Root cause:** Spaces and punctuation have no inherent Unicode script, so they defaulted to Latin.

**Attempted fix:**
- Added `lastNonWhitespaceScript` tracking in `segmentText()`.
- When a whitespace/punctuation character is encountered and `currentScript` is `null`, the code sets `currentScript = lastNonWhitespaceScript` to inherit context from previous content.

```javascript
let lastNonWhitespaceScript = null;

for (const char of text) {
    const isWhitespaceOrPunctuation = /[\s\p{P}]/u.test(char);
    
    if (this.config.preserveWhitespace && isWhitespaceOrPunctuation) {
        if (currentScript === null && lastNonWhitespaceScript) {
            currentScript = lastNonWhitespaceScript;
        }
        currentSegment += char;
        continue;
    }
    
    const charScript = this.detectScript(char);
    lastNonWhitespaceScript = charScript;
    // ...
}
```

**Result:** User reported the fix was still not working – Arabic text continued to show Latin-styled spaces. This issue remains **unresolved** as of this handoff.

**Notes for next agent:**
- The whitespace inheritance logic only handles the case where `currentScript` is `null` at the start of a whitespace run. It does NOT handle trailing spaces after an Arabic segment that are followed by a different-script segment. In that case, the space is appended to the previous segment (correct), but if the whitespace is at a script boundary mid-segment, the logic may break.
- The lookahead problem: spaces between `"Arabic text" + " " + "Latin text"` are ambiguous. A two-pass or lookahead algorithm may be needed to correctly assign them.
- Consider merging adjacent same-script segments after splitting, as a post-processing pass.

---

### Phase 6 – Configuration System: From Global Config Object to `Multilingual.init()`

**Problem:** The original config system used `window.MULTILINGUAL_CONFIG` set before the `<script>` tag. This was unintuitive and error-prone (order-sensitive).

**Original pattern (replaced):**
```html
<script>
window.MULTILINGUAL_CONFIG = { autoWrap: true, ... };
</script>
<script src="multilingual.js"></script>
```

**New pattern:**
```html
<script src="multilingual.js"></script>
<script>
Multilingual.init({ autoWrap: true, ... });
</script>
```

**What was implemented:**
- Removed `const MULTILINGUAL_CONFIG = {...}` as the main config object.
- Replaced with `const DEFAULT_CONFIG` (immutable defaults) and `let GLOBAL_CONFIG` (mutable, set by `init()`).
- Added `static init(config)` method on the `Multilingual` class:
  - Merges user config with `DEFAULT_CONFIG` into `GLOBAL_CONFIG`.
  - Sets `isInitialized = true` flag.
  - If `autoWrap: true`, schedules wrapping after DOM ready + `autoWrapDelay`.
  - Returns `Multilingual` class (for chaining).
- Added `static wrap(selector, config)` for one-shot wrapping without full initialization.
- Maintained `new Multilingual(config)` instance API for advanced usage.
- Added `wrapMultilingualText(selector, config)` as a convenience wrapper (backward compat).

---

### Phase 7 – Bug Fix: Stale Reference to `MULTILINGUAL_CONFIG`

**Bug:** After renaming the internal config constant, a stale reference to `MULTILINGUAL_CONFIG.skipElements` remained inside the TreeWalker `acceptNode` filter function, causing:
```
Uncaught ReferenceError: MULTILINGUAL_CONFIG is not defined
```

**Fix:** Changed the reference to `this.config.skipElements` and bound the `this` context explicitly:
```javascript
{
    acceptNode: function(node) {
        if (node.parentElement &&
            (node.parentElement.hasAttribute('data-script') ||
             this.config.skipElements.includes(node.parentElement.tagName.toLowerCase()))) {
            return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
    }.bind(this)
}
```

---

### Phase 8 – Removed Automatic Initialization Entirely

**Decision (explicit):** The library should NOT do anything without an explicit call. The `autoInit()` function that ran on `DOMContentLoaded` was removed.

**Reason:** It was possible for the library to auto-initialize with defaults even if no user config was provided, which was confusing and undesirable.

**What was removed:**
- The entire `autoInit()` function.
- The `DOMContentLoaded` / `readyState` auto-run block.
- All `window.MULTILINGUAL_CONFIG` support (no longer supported, no deprecation warning).

**What was changed:**
- `autoWrap` default changed from `true` → `false`.
- `isInitialized` flag retained (used by `init()` to track state).

**Result:** The library is now completely inert until the user explicitly calls:
- `Multilingual.init({ ... })` — initialize globally with options
- `Multilingual.wrap(selector, config)` — wrap a specific element once
- `new Multilingual(config).wrap(selector)` — instance-based usage

---

## Current File Structure

```
multilingual.js          # Main library
index.html               # Demo page (Quantum Mechanics multilingual text)
example-new-api.html     # Examples of all initialization methods
README.md                # User-facing documentation
HISTORY.md               # This file
```

---

## Current API

### `Multilingual.init(config)`
Initializes the library globally. Call once after loading the script.

```javascript
Multilingual.init({
    autoWrap: true,               // Enable auto-wrapping on init
    autoWrapSelector: '#content', // Target selector
    autoWrapDelay: 50,            // ms delay before wrapping
    debug: false,

    glyphOverrides: {
        '()[]{}': 'latin',
        '،؛؟': 'arabic'
    },

    cssClasses: {
        wrapper: 'my-class',      // Extra class on all spans
        useShortNames: true       // ml-ko, ml-ar, etc.
    }
});
```

### `Multilingual.wrap(selector, config)`
Static method. Wraps a specific element without global initialization.

```javascript
Multilingual.wrap('#content', { cssClasses: { useShortNames: true } });
```

### `new Multilingual(config).wrap(selector)`
Instance-based. Useful for multiple independent configurations.

```javascript
const ml = new Multilingual({ preserveWhitespace: false });
ml.wrap(document.querySelector('.article'));
```

---

## Configuration Options Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `autoWrap` | boolean | `false` | Wrap on init |
| `autoWrapSelector` | string | `'body'` | CSS selector to wrap |
| `autoWrapDelay` | number | `100` | Delay in ms |
| `preserveWhitespace` | boolean | `true` | Attach spaces to surrounding script |
| `minSegmentLength` | number | `1` | Skip segments shorter than this |
| `glyphOverrides` | object | `{}` | Map of character strings to script names |
| `languageOverrides` | object | `{}` | Override `lang` attribute values per script |
| `skipElements` | array | `['script','style','noscript','template']` | Tags to skip |
| `cssClasses.wrapper` | string | `''` | Extra class added to all spans |
| `cssClasses.useShortNames` | boolean | `true` | Use `ml-ko` style short class names |
| `cssClasses.scriptSpecific` | object | `{}` | Custom class names per script |
| `debug` | boolean | `false` | Console logging |

---

## Supported Scripts

| Script | `data-script` | `lang` | Short class |
|---|---|---|---|
| Latin (English, etc.) | `latin` | `en` | `ml-en` |
| Korean | `korean` | `ko` | `ml-ko` |
| Japanese | `japanese` | `ja` | `ml-ja` |
| Chinese | `chinese` | `zh` | `ml-zh` |
| Arabic | `arabic` | `ar` | `ml-ar` |
| Cyrillic | `cyrillic` | `ru` | `ml-ru` |
| Greek | `greek` | `el` | `ml-el` |
| Hebrew | `hebrew` | `he` | `ml-he` |
| Thai | `thai` | `th` | `ml-th` |
| Devanagari | `devanagari` | `hi` | `ml-hi` |

---

## Known Issues / Open Problems

### 1. Arabic (RTL) Space Handling — **Unresolved**
Spaces and punctuation adjacent to Arabic text are still sometimes classified as Latin. The `lastNonWhitespaceScript` tracking partially helps but does not fully solve the boundary case where a space sits between two different scripts (e.g., Arabic word → space → Latin word). A lookahead or two-pass segmentation algorithm is likely needed.

### 2. Segment Merging
If a whitespace character is treated as belonging to the previous script, adjacent same-script segments separated by whitespace are currently emitted as two separate `<span>` elements. A post-processing merge pass could consolidate them.

### 3. CJK Ambiguity
Chinese and Japanese both use CJK Unified Ideographs. The library currently assigns all CJK characters to `chinese`. Japanese CJK is only distinguished when Hiragana or Katakana is present in the same segment. This is a known limitation with no simple character-level fix.

### 4. `wrap()` Name Conflict
The class has both an instance method `wrap(selector)` and a static method `wrap(selector, config)`. This works in JavaScript but could be confusing. Future refactor could rename the static version to `Multilingual.wrapElement()` or similar.

### 5. `isInitialized` Flag Not Fully Used
The `isInitialized` flag is set by `static init()` but is not actively enforced anywhere to prevent double-initialization or warn the user. Consider adding a guard or warning if `init()` is called more than once.

---

## Explicit Decisions Log

| Decision | Reasoning |
|---|---|
| No automatic initialization | Library should be inert without explicit call; avoids surprises in larger apps |
| `autoWrap: false` by default | Consistent with no-auto-init philosophy |
| Removed `window.MULTILINGUAL_CONFIG` | Replaced with `Multilingual.init()` — cleaner, load-order independent |
| Short class names (`ml-ko`) | User preference; shorter to type in CSS |
| Glyph overrides as character string keys | Easier to write `'()[]{}': 'latin'` than one entry per character |
| TreeWalker over recursive DOM walk | Performance; handles deep DOM trees efficiently |
| Process text nodes in reverse order | Prevents index shifting bugs during DOM mutation |
| `bind(this)` in TreeWalker filter | Required after removing old global reference to `MULTILINGUAL_CONFIG` |
| Keep `wrapMultilingualText()` convenience function | Backward compatibility |
