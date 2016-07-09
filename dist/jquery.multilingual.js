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
/***/ function(module, exports) {

	var regexs = {
	  en: "[A-Za-z]+",
	  ko: "[ㄱ-ㅎ가-힣]+",
	  jp: "[\u3040-\u309F\u30A0-\u30FF]+",
	  cn: "[\u4E00-\u9FBF]+",
	  num: "[0-9]+",
	  punct: "[（）.\&,;:-<>@%*，、。」]+"
	}

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

	      var newDom = this.parseHTML(domStr);
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

	MultiLingual.prototype.parseHTML = function(string) {
	  const context = document.implementation.createHTMLDocument();

	  // Set the base href for the created document so any parsed elements with URLs
	  // are based on the document's URL
	  const base = context.createElement('base');
	  base.href = document.location.href;
	  context.head.appendChild(base);

	  context.body.innerHTML = string;
	  return context.body.children;
	}


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

/***/ }
/******/ ]);