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

    // Attach whitespace and punctuation to the surrounding script's segment.
    preserveWhitespace: true,

    // Force specific characters to a script. Examples:
    //   '()[]{}': 'latin',  '،؛؟': 'arabic',  '。、': 'japanese'
    glyphOverrides: {},

    // Override the lang attribute emitted for a script (e.g. chinese: 'zh-TW').
    languageOverrides: {},

    // Elements whose contents are not processed.
    skipElements: ['script', 'style', 'noscript', 'template'],

    // CSS class behavior.
    cssClasses: {
        useShortNames: true,          // Emit ml-ko / ml-en / ... shortcuts
        scriptSpecific: {}            // Optional { korean: 'my-ko', ... }
    },

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
            devanagari: 'ml-hi'
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
     * Three phases:
     *   1. Tag every char with a script. Whitespace/punctuation without an
     *      explicit glyph override gets `null` (inheritable).
     *   2. Inheritable chars adopt the nearest neighbor script — prefer the
     *      previous char, fall back to the next. Pure-neutral text → 'latin'.
     *   3. Group consecutive same-script chars into segments.
     */
    segmentText(text) {
        const tagged = [...text].map(char => {
            if (this.glyphOverrideMap[char]) return { char, script: this.glyphOverrideMap[char] };
            if (this.config.preserveWhitespace && /[\s\p{P}]/u.test(char)) return { char, script: null };
            return { char, script: this.detectScript(char) };
        });

        let prev = null;
        for (const t of tagged) {
            if (t.script !== null) { prev = t.script; }
            else if (prev) { t.script = prev; }
        }
        let next = null;
        for (let i = tagged.length - 1; i >= 0; i--) {
            if (tagged[i].script !== null) { next = tagged[i].script; }
            else { tagged[i].script = next ?? 'latin'; }
        }

        const segments = [];
        for (const { char, script } of tagged) {
            const last = segments[segments.length - 1];
            if (last && last.script === script) last.text += char;
            else segments.push({ text: char, script, lang: this.scriptToLang[script] });
        }

        return segments;
    }

    /**
     * Wrap text segments with spans
     */
    wrapSegments(segments) {
        const { useShortNames, scriptSpecific = {} } = this.config.cssClasses;
        return segments.map(({ text, script, lang }) => {
            if (!text.trim()) return text; // whitespace-only segment, no wrap

            const classes = [
                useShortNames && this.scriptToShortClass[script],
                scriptSpecific[script],
            ].filter(Boolean);

            const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
            return `<span lang="${lang}" data-script="${script}"${classAttr}>${text}</span>`;
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
