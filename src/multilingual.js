module.exports = MultiLingual;

var Events = require('backbone-events-standalone');
var _ = require('lodash');
var $ = require('jquery');

var regexs = {
  en: "[A-Za-z]+",
  ko: "[가-힣]+",
  numeric: "[0-9]+",
  puncutation: "[\(\).,“”\-]+"
}

function MultiLingual(params){

  this.containers = $(params.container);
  this.configuration = params.configuration;

  _.extend(this, Events);

  this.init();
}

MultiLingual.prototype = {
  init: function(){
    // debugger;
    this.compose_stylesheets();
    var final_regex = this.compose_regex();
    // var result = final_regex.exec(this.containers[0].innerHTML);
   
    var configuration = this.configuration;
    this.containers.each(_.bind(function(i, container){

      container.innerHTML = container.innerHTML.replace(final_regex, function(){
        for (var i = 1; i < arguments.length; i++) {
          if (!_.isUndefined(arguments[i])) {
            var lang = configuration[i - 1].lang;
            return "<span class='ml-" + lang + "'>" + arguments[i] + "</span>";
          }
        }
      });


    }, this));
  },

  compose_stylesheets: function(){
      // debugger;

    _.each(this.configuration, _.bind(function(config, i){
      // debugger;
      this.create_css_selector('.ml-' + config.lang, 
        'font-family:' + config.font + '; ' + 
        'font-size:' + config.fontSize + ';'
      );
    // debugger;
    }, this));


  },
  
  create_css_selector: function(selector, style) {
    if (!document.styleSheets) return;
    if (document.getElementsByTagName('head').length == 0) return;

    var styleSheet,mediaType;

    if (document.styleSheets.length > 0) {
      for (var i = 0, l = document.styleSheets.length; i < l; i++) {
        if (document.styleSheets[i].disabled) 
          continue;
        var media = document.styleSheets[i].media;
        mediaType = typeof media;

        if (mediaType === 'string') {
          if (media === '' || (media.indexOf('screen') !== -1)) {
            styleSheet = document.styleSheets[i];
          }
        }
        else if (mediaType=='object') {
          if (media.mediaText === '' || (media.mediaText.indexOf('screen') !== -1)) {
            styleSheet = document.styleSheets[i];
          }
        }

        if (typeof styleSheet !== 'undefined') 
          break;
      }
    }

    if (typeof styleSheet === 'undefined') {
      var styleSheetElement = document.createElement('style');
      styleSheetElement.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(styleSheetElement);

      for (i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].disabled) {
          continue;
        }
        styleSheet = document.styleSheets[i];
      }

      mediaType = typeof styleSheet.media;
    }

    if (mediaType === 'string') {
      for (var i = 0, l = styleSheet.rules.length; i < l; i++) {
        if(styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase()==selector.toLowerCase()) {
          styleSheet.rules[i].style.cssText = style;
          return;
        }
      }
      styleSheet.addRule(selector,style);
    }
    else if (mediaType === 'object') {
      var styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
      for (var i = 0; i < styleSheetLength; i++) {
        if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
          styleSheet.cssRules[i].style.cssText = style;
          return;
        }
      }
      styleSheet.insertRule(selector + '{' + style + '}', styleSheetLength);
    }
  },

  compose_regex: function(){
    var final_regex_str = "";

    _.each(this.configuration, _.bind(function(config, i){
      final_regex_str += "(" + regexs[config.lang] + ")";
      if (i < this.configuration.length - 1) {
        final_regex_str += "|";
      }
    }, this));
    // debugger;
    return new RegExp(final_regex_str, "gm");
  }
}