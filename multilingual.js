/**
 * Multilingual Text Library
 * Detects writing systems and wraps text segments with appropriate language spans
 */

// Default configuration settings
const DEFAULT_CONFIG = {
    // Auto-wrap settings
    autoWrap: false,                   // Automatically wrap content when initialized (disabled by default)
    autoWrapSelector: 'body',          // Which element to auto-wrap ('body', '#content', '.article', etc.)
    autoWrapDelay: 100,               // Delay in ms before auto-wrapping (allows other scripts to load)
    
    // Detection settings
    preserveWhitespace: true,          // Keep whitespace and punctuation with surrounding text
    minSegmentLength: 1,              // Minimum character length for a segment to be wrapped
    
    // Glyph overrides - specify which characters should be treated as specific scripts
    glyphOverrides: {
        // Examples:
        // '()[]{}': 'latin',           // Treat parentheses and brackets as Latin
        // '،؛؟': 'arabic',             // Arabic punctuation
        // '。、': 'japanese',          // Japanese punctuation
    },
    
    // Language detection overrides
    languageOverrides: {
        // You can override default language codes for specific scripts
        // latin: 'en',    // Default is 'en'
        // chinese: 'zh-CN', // Could be 'zh-TW' for Traditional Chinese
    },
    
    // Elements to skip during processing
    skipElements: ['script', 'style', 'noscript', 'template'],
    
    // CSS class names
    cssClasses: {
        wrapper: '',                   // Additional class for all wrapped spans
        useShortNames: true,          // Use ml-ko, ml-en instead of korean-script, latin-script
        // scriptSpecific: {
        //     latin: 'custom-latin',
        //     korean: 'custom-korean',
        //     // etc.
        // }
    },
    
    // Debug mode
    debug: false                      // Set to true for console logging
};

// Global configuration (set via Multilingual.init())
let GLOBAL_CONFIG = { ...DEFAULT_CONFIG };
let isInitialized = false;

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
     * Split text into segments by writing system
     */
    segmentText(text) {
        const segments = [];
        let currentSegment = '';
        let currentScript = null;
        let lastNonWhitespaceScript = null;
        
        for (const char of text) {
            const isWhitespaceOrPunctuation = /[\s\p{P}]/u.test(char);
            
            if (this.config.preserveWhitespace && isWhitespaceOrPunctuation) {
                // For whitespace/punctuation, inherit script from surrounding text
                if (currentScript === null && lastNonWhitespaceScript) {
                    // Start new segment with previous script context
                    currentScript = lastNonWhitespaceScript;
                }
                currentSegment += char;
                continue;
            }
            
            const charScript = this.detectScript(char);
            lastNonWhitespaceScript = charScript; // Track last meaningful script
            
            if (currentScript === null) {
                currentScript = charScript;
                currentSegment += char;
            } else if (currentScript === charScript) {
                currentSegment += char;
            } else {
                // Script changed, save current segment and start new one
                if (currentSegment.trim() && currentSegment.trim().length >= this.config.minSegmentLength) {
                    segments.push({
                        text: currentSegment,
                        script: currentScript,
                        lang: this.scriptToLang[currentScript]
                    });
                }
                currentSegment = char;
                currentScript = charScript;
            }
        }
        
        // Add the last segment
        if (currentSegment.trim() && currentSegment.trim().length >= this.config.minSegmentLength) {
            segments.push({
                text: currentSegment,
                script: currentScript,
                lang: this.scriptToLang[currentScript]
            });
        }
        
        return segments;
    }

    /**
     * Wrap text segments with spans
     */
    wrapSegments(segments) {
        return segments.map(segment => {
            const trimmedText = segment.text.trim();
            if (!trimmedText) {
                return segment.text; // Return whitespace as-is
            }
            
            // Build CSS classes
            let cssClass = this.config.cssClasses.wrapper || '';
            
            // Add short class name if enabled
            if (this.config.cssClasses.useShortNames && this.scriptToShortClass[segment.script]) {
                cssClass += (cssClass ? ' ' : '') + this.scriptToShortClass[segment.script];
            }
            
            // Add custom script-specific class if provided
            if (this.config.cssClasses.scriptSpecific && this.config.cssClasses.scriptSpecific[segment.script]) {
                cssClass += (cssClass ? ' ' : '') + this.config.cssClasses.scriptSpecific[segment.script];
            }
            
            const classAttr = cssClass ? ` class="${cssClass}"` : '';
            
            return `<span lang="${segment.lang}" data-script="${segment.script}"${classAttr}>${segment.text}</span>`;
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
     * Recursively process all text nodes in an element
     */
    processElement(element) {
        // Skip if element is in the skip list
        if (this.config.skipElements.includes(element.tagName.toLowerCase())) {
            return;
        }
        
        // Get all text nodes (not just direct children)
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip text nodes that are already inside our spans
                    if (node.parentElement && 
                        (node.parentElement.hasAttribute('data-script') || 
                         this.config.skipElements.includes(node.parentElement.tagName.toLowerCase()))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }.bind(this)  // Bind 'this' context to access this.config
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        if (this.config.debug) {
            console.log(`Processing ${textNodes.length} text nodes in element:`, element);
        }

        // Process text nodes in reverse order to avoid issues with DOM modification
        for (let i = textNodes.length - 1; i >= 0; i--) {
            this.processTextNode(textNodes[i]);
        }
    }

    /**
     * Main method to wrap multilingual text in an element
     * @param {string|HTMLElement} selector - CSS selector, element ID, class name, or DOM element
     */
    wrap(selector) {
        let elements = [];
        
        if (typeof selector === 'string') {
            // Try different selection methods
            if (selector.startsWith('#')) {
                // ID selector
                const element = document.getElementById(selector.slice(1));
                if (element) elements = [element];
            } else if (selector.startsWith('.')) {
                // Class selector
                elements = Array.from(document.getElementsByClassName(selector.slice(1)));
            } else if (selector.includes(' ') || selector.includes('>', '+', '~')) {
                // Complex CSS selector
                elements = Array.from(document.querySelectorAll(selector));
            } else {
                // Try as tag name first, then as ID, then as class
                elements = Array.from(document.getElementsByTagName(selector));
                if (elements.length === 0) {
                    const byId = document.getElementById(selector);
                    if (byId) elements = [byId];
                }
                if (elements.length === 0) {
                    elements = Array.from(document.getElementsByClassName(selector));
                }
            }
        } else if (selector instanceof HTMLElement) {
            elements = [selector];
        }

        // Process each element
        elements.forEach(element => {
            this.processElement(element);
        });

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
        // Update global configuration
        GLOBAL_CONFIG = { ...DEFAULT_CONFIG, ...config };
        isInitialized = true;
        
        if (GLOBAL_CONFIG.debug) {
            console.log('Multilingual library initialized with config:', GLOBAL_CONFIG);
        }

        // If autoWrap is enabled, start auto-wrapping
        if (GLOBAL_CONFIG.autoWrap) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        const multilingual = new Multilingual();
                        multilingual.wrap(GLOBAL_CONFIG.autoWrapSelector);
                    }, GLOBAL_CONFIG.autoWrapDelay);
                });
            } else {
                setTimeout(() => {
                    const multilingual = new Multilingual();
                    multilingual.wrap(GLOBAL_CONFIG.autoWrapSelector);
                }, GLOBAL_CONFIG.autoWrapDelay);
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

// No automatic initialization - library must be explicitly initialized

// Make Multilingual globally available
window.Multilingual = Multilingual;

// Convenience function (kept for backward compatibility)
window.wrapMultilingualText = function(selector, config = {}) {
    return Multilingual.wrap(selector, config);
};
