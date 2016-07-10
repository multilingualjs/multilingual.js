/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var MultiLingual = __webpack_require__(1);

	(function ( $ ) {
	   $.fn.multilingual = function(params) {
	    var multilingual = new MultiLingual({
	      containers: this,
	      configuration: params
	    });

	    return multilingual;
	  };
	 
	}( jQuery ));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var regexs = {
	  en: "[A-Za-z]+",
	  ko: "[ㄱ-ㅎ가-힣]+",
	  jp: "[\u3040-\u309F\u30A0-\u30FF]+",
	  cn: "[\u4E00-\u9FBF]+",
	  num: "[0-9]+",
	  punct: "[（）().\&,;:-<>@%*，、。」]+"
	}

	var parseHTML = __webpack_require__(3);

	function MultiLingual(params){
	  this.containers = params.containers;
	  this.configuration = params.configuration;

	  this.init();
	}

	MultiLingual.prototype.init = function(){
	  this.finalRegex = this.composeRegex();
	 
	  for (var i = 0, len = this.containers.length; i < len; i++){
	    var container = this.containers[i];

	    this.recursiveChange(this.containers[0], container);
	  }
	};

	MultiLingual.prototype.recursiveChange = function(parent, dom){
	  if (dom.childNodes.length > 0) {
	    for (var i = dom.childNodes.length - 1; i >= 0; i--) {
	      this.recursiveChange(dom, dom.childNodes[i]);
	    }
	  } else {
	    if (dom.nodeType === 3) {
	      var configuration = this.configuration;

	      var domStr = dom.textContent.replace(this.finalRegex, function(){
	        for (var i = 1; i < arguments.length; i++) {
	          if (arguments[i] != undefined) {
	            var config = configuration[i - 1];
	            var className;

	            if (typeof config == "string"){
	              className = "ml-" + config;
	            } else {
	              className = config.className;
	            }

	            return "<span class='" + className + "'>" + arguments[i] + "</span>";
	          }
	        }
	      });

	      var newDom = parseHTML(domStr);
	      for (var i = 0; i < newDom.length; i++) {
	        parent.insertBefore(newDom[i], dom);   
	      }
	      
	      dom.remove();
	    } 
	  }
	}


	MultiLingual.prototype.unescapeRegexStr = function(input) {
	  return input.replace(/&nbsp;/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;")
	};

	MultiLingual.prototype.escapeRegexStr = function(str) {
	  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	};


	MultiLingual.prototype.computeCustomRegex = function (charset) {
	  charset = this.escapeRegexStr(charset);
	  
	  var finalStr = "([" + charset + "]+)";
	  return finalStr;
	};


	MultiLingual.prototype.composeRegex = function(){
	  var finalRegexStr = "(\?![^<>&]*>)";

	  for (var i = 0, len = this.configuration.length; i < len; i++){
	    var config = this.configuration[i];

	    if (typeof config == "string"){ // ml-en 등 미리 정해진 프리셋의 경우 
	      finalRegexStr += "(" + regexs[config] + ")";
	    } else {
	      finalRegexStr += this.computeCustomRegex(config.charset);
	    }
	    
	    if (i < this.configuration.length - 1) {
	      finalRegexStr += "|";
	    }
	  }

	  return new RegExp(finalRegexStr, "gm");
	};

	module.exports = MultiLingual;

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var rsingleTag = __webpack_require__(4);
	var buildFragment = __webpack_require__(7);
	var support = __webpack_require__(5);
	var merge = __webpack_require__(6);

	var parseHTML = function( data, context, keepScripts ) {
		if ( typeof data !== "string" ) {
			return [];
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		var base, parsed, scripts;

		if ( !context ) {

			// Stop scripts or inline event handlers from being executed immediately
			// by using document.implementation
			if ( support.createHTMLDocument ) {
				context = document.implementation.createHTMLDocument( "" );

				// Set the base href for the created document
				// so any parsed elements with URLs
				// are based on the document's URL (gh-2965)
				base = context.createElement( "base" );
				base.href = document.location.href;
				context.head.appendChild( base );
			} else {
				context = document;
			}
		}

		parsed = rsingleTag.exec( data );

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}

		parsed = buildFragment( [ data ], context, scripts );


		return merge( [], parsed.childNodes );
	};

	module.exports = parseHTML;

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

/***/ },
/* 5 */
/***/ function(module, exports) {

	var support = {};

	support.createHTMLDocument = ( function() {
		var body = document.implementation.createHTMLDocument( "" ).body;
		body.innerHTML = "<form></form><form></form>";
		return body.childNodes.length === 2;
	} )();

	module.exports = support;

/***/ },
/* 6 */
/***/ function(module, exports) {

	var merge = function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	}

	module.exports = merge;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var rhtml = /<|&#?\w+;/;
	var rtagName = /<([\w:]+)/;
	var rscriptType = /^$|\/(?:java|ecma)script/i;
	var wrapMap = __webpack_require__(8);
	var getAll = __webpack_require__(9);
	var setGlobalEval = __webpack_require__(11);
	var merge = __webpack_require__(6);
	var inArray = function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	};
	var htmlPrefilter = function( html ) {
		return html.replace( /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi, "<$1></$2>" );
	}
	// var containsFunc = require("./containsFunc");


	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;
		contains = false;
		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( typeof elem === "object" ) {

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + htmlPrefilter( elem ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {

			// Skip elements already in the context collection (trac-4087)
			if ( selection && inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}

			// contains = containsFunc( elem.ownerDocument, elem );
			// contains = true;
			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	}

	module.exports = buildFragment;

/***/ },
/* 8 */
/***/ function(module, exports) {

	var wrapMap = {

		// Support: IE <=9 only
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

	// Support: IE <=9 only
	wrapMap.optgroup = wrapMap.option;

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;

	module.exports = wrapMap;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var merge = __webpack_require__(6);
	var nodeName = __webpack_require__(10);

	function getAll( context, tag ) {

		// Support: IE <=9 - 11 only
		// Use typeof to avoid zero-argument method invocation on host objects (#15151)
		var ret = typeof context.getElementsByTagName !== "undefined" ?
				context.getElementsByTagName( tag || "*" ) :
				typeof context.querySelectorAll !== "undefined" ?
					context.querySelectorAll( tag || "*" ) :
				[];

		return tag === undefined || tag && nodeName( context, tag ) ?
			merge( [ context ], ret ) :
			ret;
	}

	module.exports = getAll;

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var dataPriv = __webpack_require__(12);

	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}

	module.exports = setGlobalEval;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var Data = __webpack_require__(13);

	module.exports = new Data();

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var rnotwhite = ( /\S+/g );
	var acceptData = function( owner ) {

		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		/* jshint -W018 */
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};

	var camelCase = __webpack_require__(14);
	var expando = ( "" + Math.random() ).replace( /\D/g, "" );
	var isEmptyObject = function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	};


	function Data() {
		this.expando = expando + Data.uid++;
	}

	Data.uid = 1;

	Data.prototype = {

		cache: function( owner ) {

			// Check if the owner object already has a cache
			var value = owner[ this.expando ];

			// If not, create one
			if ( !value ) {
				value = {};

				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see #8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {

					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;

					// Otherwise secure it in a non-enumerable property
					// configurable must be true to allow the property to be
					// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}

			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );

			// Handle: [ owner, key, value ] args
			// Always use camelCase key (gh-2257)
			if ( typeof data === "string" ) {
				cache[ camelCase( data ) ] = value;

			// Handle: [ owner, { properties } ] args
			} else {

				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ camelCase( prop ) ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :

				// Always use camelCase key (gh-2257)
				owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
		},
		access: function( owner, key, value ) {

			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
					( ( key && typeof key === "string" ) && value === undefined ) ) {

				return this.get( owner, key );
			}

			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );

			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i,
				cache = owner[ this.expando ];

			if ( cache === undefined ) {
				return;
			}

			if ( key !== undefined ) {

				// Support array or space separated string of keys
				if ( Array.isArray( key ) ) {

					// If key is an array of keys...
					// We always set camelCase keys, so remove that.
					key = key.map( camelCase );
				} else {
					key = camelCase( key );

					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					key = key in cache ?
						[ key ] :
						( key.match( rnotwhite ) || [] );
				}

				i = key.length;

				while ( i-- ) {
					delete cache[ key[ i ] ];
				}
			}

			// Remove the expando if there's no more data
			if ( key === undefined || isEmptyObject( cache ) ) {

				// Support: Chrome <=35 - 45
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !isEmptyObject( cache );
		}
	};

	module.exports = Data;

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	}

/***/ }
/******/ ]);