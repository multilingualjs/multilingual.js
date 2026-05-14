# Multilingual

A lightweight JavaScript library that detects writing systems in multilingual text and wraps each segment in a `<span>` with `lang`, `data-script`, and CSS class attributes — so you can style each script per-language with CSS.

## Features

- **Zero dependencies** — Pure JavaScript
- **10 writing systems** detected via Unicode property escapes
- **Explicit initialization** — Library is inert until you call `Multilingual.init()` or `Multilingual.wrap()`
- **CSS-friendly output** with `lang` attributes, `data-script` attributes, and short class names (`ml-ko`, `ml-en`, …)
- **Glyph overrides** — Force specific characters to a script
- **Smart whitespace handling** — Spaces and punctuation always inherit script from surrounding text

## Quick Start

```html
<script src="multilingual.js"></script>
<script>
  Multilingual.init({
    autoInit: true,
    selector: '#content',
  });
</script>
```

## API

### `Multilingual.init(config)`

Sets the default configuration. With `autoInit: true`, schedules a wrap of `selector` after `delay` ms.

```js
Multilingual.init({
  autoInit: true,
  selector: '.content, .article',
  delay: 100,

  glyphOverrides: {
    '()[]{}': 'latin',
    '،؛؟': 'arabic',
  },

  languageOverrides: { chinese: 'zh-TW' },
});
```

### `Multilingual.wrap(target, config?)`

One-shot wrap of an element (selector string or DOM element).

```js
Multilingual.wrap('#content', { glyphOverrides: { '()': 'latin' } });
```

### `new Multilingual(config).wrap(target)`

Instance-based usage for multiple independent configurations.

```js
const ml = new Multilingual({ languageOverrides: { chinese: 'zh-TW' } });
ml.wrap(document.querySelector('.article'));
```

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `autoInit` | boolean | `false` | If true, `init()` schedules a wrap of `selector` after `delay` ms. |
| `selector` | string | `'body'` | CSS selector for the auto-init wrap. |
| `delay` | number | `100` | ms to wait before the auto-init wrap. |
| `separateWhitespace` | boolean | `false` | Give whitespace its own segments with class `ml-space`. |
| `separatePunct` | boolean | `false` | Give punctuation its own segments with class `ml-punct`. |
| `separateNum` | boolean | `false` | Give digits their own segments with class `ml-num`. |
| `glyphOverrides` | object | `{}` | Map of character strings to script names (e.g. `'()': 'latin'`). |
| `languageOverrides` | object | `{}` | Override the BCP-47 `lang` attribute per script (e.g. `chinese: 'zh-TW'`). |
| `skipElements` | string[] | `['script','style','noscript','template']` | Tag names to skip during traversal. |
| `useShortNames` | boolean | `true` | Emit `ml-ko` / `ml-en` / … classes on each span. |
| `debug` | boolean | `false` | Verbose console logging. |

## Output

**Input:** `Hello 안녕하세요 こんにちは 你好`

**Output:**
```html
<span lang="en" data-script="latin" class="ml-en">Hello </span>
<span lang="ko" data-script="korean" class="ml-ko">안녕하세요 </span>
<span lang="ja" data-script="japanese" class="ml-ja">こんにちは </span>
<span lang="zh" data-script="chinese" class="ml-zh">你好</span>
```

## CSS Styling

```css
.ml-ko { font-family: 'Noto Sans KR', sans-serif; }
.ml-ja { font-family: 'Noto Sans JP', sans-serif; }
.ml-zh { font-family: 'Noto Sans SC', sans-serif; }
.ml-ar { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; }

/* Or target via data-script */
span[data-script="korean"] { color: #2196F3; }
```

## Supported Writing Systems

| Script | `data-script` | `lang` | Short class |
|---|---|---|---|
| Latin | `latin` | `en` | `ml-en` |
| Korean (Hangul) | `korean` | `ko` | `ml-ko` |
| Japanese (Hiragana/Katakana) | `japanese` | `ja` | `ml-ja` |
| Chinese (CJK Han) | `chinese` | `zh` | `ml-zh` |
| Arabic | `arabic` | `ar` | `ml-ar` |
| Cyrillic | `cyrillic` | `ru` | `ml-ru` |
| Greek | `greek` | `el` | `ml-el` |
| Hebrew | `hebrew` | `he` | `ml-he` |
| Thai | `thai` | `th` | `ml-th` |
| Devanagari | `devanagari` | `hi` | `ml-hi` |

> **Note on CJK:** Japanese kanji share Unicode's Han property with Chinese hanzi. The library classifies all standalone Han characters as `chinese`; Japanese is only detected via Hiragana or Katakana co-occurrence.

## Browser Support

Modern browsers supporting:
- ES6
- Unicode property escapes (`\p{Script=...}`)

## License

MIT
