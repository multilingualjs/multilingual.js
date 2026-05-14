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

class Multilingual {
    constructor(config = {}) {
        // Merge user config with global config
        this.config = { ...GLOBAL_CONFIG, ...config };
        
        if (this.config.debug) {
            console.log('MultilingualWrapper initialized with config:', this.config);
        }
        
        // Unicode ranges for different writing systems
        this.scriptRanges = {
            latin: [
                [0x0041, 0x005A], // A-Z
                [0x0061, 0x007A], // a-z
                [0x00C0, 0x00FF], // Latin-1 Supplement
                [0x0100, 0x017F], // Latin Extended-A
                [0x0180, 0x024F], // Latin Extended-B
                [0x1E00, 0x1EFF], // Latin Extended Additional
            ],
            korean: [
                [0xAC00, 0xD7AF], // Hangul Syllables
                [0x1100, 0x11FF], // Hangul Jamo
                [0x3130, 0x318F], // Hangul Compatibility Jamo
                [0xA960, 0xA97F], // Hangul Jamo Extended-A
                [0xD7B0, 0xD7FF], // Hangul Jamo Extended-B
            ],
            japanese: [
                [0x3040, 0x309F], // Hiragana
                [0x30A0, 0x30FF], // Katakana
                [0x31F0, 0x31FF], // Katakana Phonetic Extensions
            ],
            chinese: [
                [0x4E00, 0x9FFF], // CJK Unified Ideographs
                [0x3400, 0x4DBF], // CJK Extension A
                [0x20000, 0x2A6DF], // CJK Extension B
                [0x2A700, 0x2B73F], // CJK Extension C
                [0x2B740, 0x2B81F], // CJK Extension D
                [0x2B820, 0x2CEAF], // CJK Extension E
                [0x2CEB0, 0x2EBEF], // CJK Extension F
                [0xF900, 0xFAFF], // CJK Compatibility Ideographs
            ],
            arabic: [
                [0x0600, 0x06FF], // Arabic
                [0x0750, 0x077F], // Arabic Supplement
                [0x08A0, 0x08FF], // Arabic Extended-A
                [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
                [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
            ],
            cyrillic: [
                [0x0400, 0x04FF], // Cyrillic
                [0x0500, 0x052F], // Cyrillic Supplement
                [0x2DE0, 0x2DFF], // Cyrillic Extended-A
                [0xA640, 0xA69F], // Cyrillic Extended-B
            ],
            greek: [
                [0x0370, 0x03FF], // Greek and Coptic
                [0x1F00, 0x1FFF], // Greek Extended
            ],
            hebrew: [
                [0x0590, 0x05FF], // Hebrew
                [0xFB1D, 0xFB4F], // Hebrew Presentation Forms
            ],
            thai: [
                [0x0E00, 0x0E7F], // Thai
            ],
            devanagari: [
                [0x0900, 0x097F], // Devanagari
            ]
        };

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
        // Check glyph overrides first
        if (this.glyphOverrideMap[char]) {
            return this.glyphOverrideMap[char];
        }

        const charCode = char.codePointAt(0);
        
        for (const [script, ranges] of Object.entries(this.scriptRanges)) {
            for (const [start, end] of ranges) {
                if (charCode >= start && charCode <= end) {
                    return script;
                }
            }
        }
        
        // Default to latin for unrecognized characters (numbers, punctuation, etc.)
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
