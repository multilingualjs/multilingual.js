# Multilingual

A lightweight JavaScript library that automatically detects writing systems in multilingual text and wraps them with language-specific spans for CSS styling.

## Features

- **Zero dependencies** - Pure JavaScript
- **Automatic detection** of 10+ writing systems (Latin, Korean, Japanese, Chinese, Arabic, etc.)
- **Explicit initialization** - Only works when you call `Multilingual.init()`
- **CSS-friendly** output with `lang` attributes and `data-script` attributes
- **Short class names** - `ml-ko`, `ml-en`, etc. for easy styling
- **Glyph overrides** - Control which characters belong to which script
- **Flexible configuration** - Multiple ways to configure and use
- **Smart space handling** - Whitespace inherits script from surrounding text
- **Performance optimized** for large documents

## Quick Start

1. **Include the library**:
```html
<script src="multilingual.js"></script>
```

2. **Initialize with your configuration**:
```html
<script>
Multilingual.init({
    autoWrap: true,
    autoWrapSelector: '#content',
    cssClasses: {
        useShortNames: true  // Use ml-ko, ml-en classes
    }
});
</script>
```

The library **requires explicit initialization** and will not work until you call `Multilingual.init()`.

## Configuration Methods

### Method 1: Initialize with Configuration (Recommended)

Call `Multilingual.init()` after loading the library:

```html
<script src="multilingual.js"></script>
<script>
Multilingual.init({
    autoWrap: true,                   // Enable auto-wrapping
    autoWrapSelector: '.content, .article',
    autoWrapDelay: 100,
    
    // Override specific characters
    glyphOverrides: {
        '()[]{}': 'latin',    // Parentheses as Latin
        '،؛؟': 'arabic'       // Arabic punctuation
    },
    
    cssClasses: {
        wrapper: 'multilingual-text',
        useShortNames: true,  // Use ml-ko, ml-en classes
        scriptSpecific: {
            korean: 'korean-script',
            japanese: 'japanese-script'
        }
    }
});
</script>
```

### Method 2: Static Method Calls

Use static methods for one-time wrapping without auto-initialization:

```javascript
// Wrap specific elements
Multilingual.wrap('#content', {
    cssClasses: { useShortNames: true },
    glyphOverrides: { '()': 'latin' }
});

// Create instance for advanced usage
const multilingual = new Multilingual({
    preserveWhitespace: false,
    languageOverrides: { chinese: 'zh-TW' }
});
multilingual.wrap(document.querySelector('.article'));
```

## Configuration Options

Pass these options to `Multilingual.init()` or when creating a new instance:

```javascript
Multilingual.init({
    // Auto-wrap settings
    autoWrap: false,                   // Enable auto-wrapping (disabled by default)
    autoWrapSelector: 'body',          // CSS selector for elements to wrap
    autoWrapDelay: 100,               // Delay before processing (ms)
    
    // Detection settings
    preserveWhitespace: true,          // Keep whitespace with surrounding text
    minSegmentLength: 1,              // Minimum characters to wrap
    
    // Glyph overrides - control script assignment for specific characters
    glyphOverrides: {
        '()[]{}': 'latin',            // Parentheses and brackets as Latin
        '،؛؟': 'arabic',              // Arabic punctuation
        '。、': 'japanese',           // Japanese punctuation
        '""''': 'latin'               // English quotes as Latin
    },
    
    // Language overrides
    languageOverrides: {
        chinese: 'zh-TW',             // Override default language codes
        latin: 'en-US'
    },
    
    // CSS classes
    cssClasses: {
        wrapper: 'multilingual-text',  // Class for all wrapped spans
        useShortNames: true,          // Use ml-ko, ml-en instead of long names
        scriptSpecific: {             // Classes for specific scripts
            korean: 'korean-script',
            japanese: 'japanese-script'
        }
    },
    
    // Elements to skip
    skipElements: ['script', 'style', 'code', 'pre'],
    
    // Debug mode
    debug: false                      // Console logging
});
```

## Output

**Input:**
```
Hello 안녕하세요 こんにちは 你好
```

**Output:**
```html
<span lang="en" data-script="latin" class="multilingual-text ml-en">Hello </span>
<span lang="ko" data-script="korean" class="multilingual-text ml-ko">안녕하세요 </span>
<span lang="ja" data-script="japanese" class="multilingual-text ml-ja">こんにちは </span>
<span lang="zh" data-script="chinese" class="multilingual-text ml-zh">你好</span>
```

## CSS Styling

Style different writing systems using short class names or `data-script` attributes:

```css
/* Using short class names (recommended) */
.ml-ko {
    background-color: #e8f4fd;
    font-family: 'Noto Sans KR', sans-serif;
}

.ml-ja {
    background-color: #fce4ec;
    font-family: 'Noto Sans JP', sans-serif;
}

.ml-zh {
    background-color: #f3e5f5;
    font-family: 'Noto Sans SC', sans-serif;
}

.ml-ar {
    background-color: #e8f5e8;
    direction: rtl;
    font-family: 'Noto Sans Arabic', sans-serif;
}

/* Or using data-script attributes */
span[data-script="korean"] {
    background-color: #e8f4fd;
}
```

## Supported Writing Systems

- **Latin** (English, European languages) → `lang="en"`
- **Korean** (Hangul) → `lang="ko"`
- **Japanese** (Hiragana, Katakana) → `lang="ja"`
- **Chinese** (CJK Ideographs) → `lang="zh"`
- **Arabic** → `lang="ar"`
- **Cyrillic** (Russian, etc.) → `lang="ru"`
- **Greek** → `lang="el"`
- **Hebrew** → `lang="he"`
- **Thai** → `lang="th"`
- **Devanagari** (Hindi, etc.) → `lang="hi"`

## Browser Support

Works in all modern browsers that support:
- ES6 (let/const, arrow functions)
- Unicode property escapes in regex (`\p{Script=...}`)

## License

MIT License - feel free to use in any project.
