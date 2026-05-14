/**
 * Multilingual Text Library
 * Detects writing systems and wraps text segments with appropriate language spans
 */

// Default configuration settings
const DEFAULT_CONFIG = {
    // When `autoInit` is true, init() schedules a wrap of `selector` after `delay` ms.
    autoInit: false,
    selector: 'body',
    delay: 100,

    // When false (default), whitespace / punctuation / digits merge into the
    // surrounding script's span. Set any of these true to give that category
    // its own segment with its own class (ml-space / ml-punct / ml-num) —
    // useful for typographic control (tabular numbers, styled punctuation,
    // visible spaces, etc.). Separated categories don't participate in
    // inheritance: e.g. with separatePunct on, the space in "Hello, world"
    // inherits the nearest real script (latin), not the punct script.
    separateWhitespace: false,
    separatePunct: false,
    separateNum: false,

    // Force specific characters to a script. Examples:
    //   '()[]{}': 'latin',  '،؛؟': 'arabic',  '。、': 'japanese'
    glyphOverrides: {},

    // Override the lang attribute emitted for a script (e.g. chinese: 'zh-TW').
    languageOverrides: {},

    // Elements whose contents are not processed.
    skipElements: ['script', 'style', 'noscript', 'template'],

    // Emit short class names (ml-ko, ml-en, ...) on each span.
    useShortNames: true,

    debug: false
};

// Global configuration (set via Multilingual.init())
let GLOBAL_CONFIG = { ...DEFAULT_CONFIG };

// Script detection via Unicode property escapes. Order matters: Hiragana/Katakana
// are matched before Han so Japanese kana don't fall through to chinese.
const SCRIPT_PATTERNS = {
    korean:     /\p{Script=Hangul}/u,
    japanese:   /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
    chinese:    /\p{Script=Han}/u,
    arabic:     /\p{Script=Arabic}/u,
    cyrillic:   /\p{Script=Cyrillic}/u,
    greek:      /\p{Script=Greek}/u,
    hebrew:     /\p{Script=Hebrew}/u,
    thai:       /\p{Script=Thai}/u,
    devanagari: /\p{Script=Devanagari}/u,
    latin:      /\p{Script=Latin}/u,
};

// Category-pseudo-scripts. Excluded from inheritance propagation so that, e.g.,
// a separated punct segment doesn't bleed its script onto adjacent whitespace.
const CATEGORY_SCRIPTS = new Set(['whitespace', 'punctuation', 'number']);

class Multilingual {
    constructor(config = {}) {
        // Merge user config with global config
        this.config = { ...GLOBAL_CONFIG, ...config };

        if (this.config.debug) {
            console.log('MultilingualWrapper initialized with config:', this.config);
        }

        // Language codes for each script
        this.scriptToLang = {
            latin: 'en',
            korean: 'ko',
            japanese: 'ja',
            chinese: 'zh',
            arabic: 'ar',
            cyrillic: 'ru',
            greek: 'el',
            hebrew: 'he',
            thai: 'th',
            devanagari: 'hi',
            ...this.config.languageOverrides
        };

        // Short class names for CSS
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
            devanagari: 'ml-hi',
            whitespace:  'ml-space',
            punctuation: 'ml-punct',
            number:      'ml-num',
        };

        // Build glyph override map
        this.glyphOverrideMap = {};
        if (this.config.glyphOverrides) {
            for (const [glyphs, script] of Object.entries(this.config.glyphOverrides)) {
                for (const glyph of glyphs) {
                    this.glyphOverrideMap[glyph] = script;
                }
            }
        }
    }

    /**
     * Detect the writing system of a character
     */
    detectScript(char) {
        if (this.glyphOverrideMap[char]) {
            return this.glyphOverrideMap[char];
        }
        for (const [script, pattern] of Object.entries(SCRIPT_PATTERNS)) {
            if (pattern.test(char)) return script;
        }
        // Default to latin for unrecognized characters (digits, punctuation, etc.)
        return 'latin';
    }

    /**
     * Split text into segments by writing system.
     *
     *   1. Tag every char. Whitespace / punctuation / digits get either their
     *      category-script (if separated) or `null` (inheritable). Letters get
     *      their detected script.
     *   2. Fill nulls by inheriting the nearest *real* script (skipping over
     *      separated category-scripts so they don't bleed onto neighbors).
     *      Leading-only nulls fall back to 'latin'.
     *   3. Group consecutive same-script chars into segments.
     */
    segmentText(text) {
        const { separateWhitespace, separatePunct, separateNum } = this.config;

        const tagged = [...text].map(char => {
            if (this.glyphOverrideMap[char]) return { char, script: this.glyphOverrideMap[char] };
            if (/\s/u.test(char))     return { char, script: separateWhitespace ? 'whitespace'  : null };
            if (/\p{P}/u.test(char))  return { char, script: separatePunct      ? 'punctuation' : null };
            if (/\p{N}/u.test(char))  return { char, script: separateNum        ? 'number'      : 'latin' };
            return { char, script: this.detectScript(char) };
        });

        let prev = null;
        for (const t of tagged) {
            if (t.script === null) { if (prev) t.script = prev; }
            else if (!CATEGORY_SCRIPTS.has(t.script)) prev = t.script;
        }
        let next = null;
        for (let i = tagged.length - 1; i >= 0; i--) {
            if (tagged[i].script === null) tagged[i].script = next ?? 'latin';
            else if (!CATEGORY_SCRIPTS.has(tagged[i].script)) next = tagged[i].script;
        }

        const segments = [];
        for (const { char, script } of tagged) {
            const last = segments[segments.length - 1];
            if (last && last.script === script) last.text += char;
            else segments.push({ text: char, script });
        }
        return segments;
    }

    /**
     * Wrap text segments with spans
     */
    wrapSegments(segments) {
        return segments.map(({ text, script }) => {
            // Pure-whitespace segments that inherited a script (rather than being
            // explicitly tagged 'whitespace') stay as bare text — no point wrapping
            // " " in a korean span just because it inherited from a neighbor.
            if (script !== 'whitespace' && !text.trim()) return text;
            const lang = this.scriptToLang[script];
            const cls = this.config.useShortNames ? this.scriptToShortClass[script] : null;
            const langAttr  = lang ? ` lang="${lang}"` : '';
            const classAttr = cls  ? ` class="${cls}"` : '';
            return `<span${langAttr} data-script="${script}"${classAttr}>${text}</span>`;
        }).join('');
    }

    /**
     * Process a text node and replace it with wrapped content
     */
    processTextNode(textNode) {
        const text = textNode.textContent;
        if (!text.trim()) return; // Skip empty text nodes
        
        const segments = this.segmentText(text);
        const wrappedHTML = this.wrapSegments(segments);
        
        // Create a temporary container to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = wrappedHTML;
        
        // Replace the text node with the new nodes
        const parent = textNode.parentNode;
        while (temp.firstChild) {
            parent.insertBefore(temp.firstChild, textNode);
        }
        parent.removeChild(textNode);
    }

    /**
     * Recursively walk an element and process all eligible text nodes.
     * Snapshots childNodes before iterating so that DOM mutations from
     * processTextNode don't break the walk.
     */
    processElement(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            return this.processTextNode(element);
        }
        if (element.nodeType !== Node.ELEMENT_NODE) return;

        const tag = element.tagName.toLowerCase();
        if (this.config.skipElements.includes(tag)) return;
        if (element.hasAttribute('data-script')) return;

        for (const child of [...element.childNodes]) {
            this.processElement(child);
        }
    }

    /**
     * Wrap multilingual text in matching elements.
     * @param {string|Element} target - CSS selector or DOM element
     * @returns {number} - Number of elements processed
     */
    wrap(target) {
        const elements = target instanceof Element
            ? [target]
            : [...document.querySelectorAll(target)];

        elements.forEach(el => this.processElement(el));

        if (this.config.debug) {
            console.log(`Wrapped ${elements.length} elements`);
        }
        return elements.length;
    }

    /**
     * Initialize the Multilingual library with configuration
     * @param {Object} config - Configuration options
     * @returns {Multilingual} - Returns the Multilingual class for chaining
     */
    static init(config = {}) {
        GLOBAL_CONFIG = { ...DEFAULT_CONFIG, ...config };

        if (GLOBAL_CONFIG.debug) {
            console.log('Multilingual initialized:', GLOBAL_CONFIG);
        }

        if (GLOBAL_CONFIG.autoInit) {
            const run = () => setTimeout(
                () => new Multilingual().wrap(GLOBAL_CONFIG.selector),
                GLOBAL_CONFIG.delay
            );
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', run);
            } else {
                run();
            }
        }

        return Multilingual;
    }

    /**
     * Wrap text in specified elements with configuration
     * @param {string|HTMLElement} selector - CSS selector or element
     * @param {Object} config - Optional configuration override
     * @returns {number} - Number of elements processed
     */
    static wrap(selector, config = {}) {
        const multilingual = new Multilingual(config);
        return multilingual.wrap(selector);
    }
}

// Library is inert until Multilingual.init() or Multilingual.wrap() is called.
window.Multilingual = Multilingual;
