(function ( $ ) {
  var regexs = {
    en: "[A-Za-z]+",
    ko: "[가-힣]+",
    jp: "[\u3040-\u309F\u30A0-\u30FF]+",
    cn: "[\u4E00-\u9FBF]+",
    num: "[0-9]+",
    punct: "[\(\).,“”\"\'\-]|&quot;|&amp;|&lt;|&gt;|&emdash;|&endash;+"
  }

  function MultiLingual(params){
    this.containers = params.containers;
    this.configuration = params.configuration;

    this.init();
  }

  MultiLingual.prototype = {
    init: function(){
      var finalRegex = this.composeRegex();
     
      var configuration = this.configuration;

      for (var i = 0, len = this.containers.length; i < len; i++){
        var container = this.containers[i];
        container.innerHTML = this.unescapeRegexStr(container.innerHTML).replace(finalRegex, function(){
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
      }
    },

    unescapeRegexStr: function(input) {
      return input.replace(/&nbsp;/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    },

    escapeRegexStr: function(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    computeCustomRegex: function (charset) {
      charset = this.escapeRegexStr(charset);
      
      var htmlEscapedChars = [];
      var finalStr = "";

      if (charset.match(/\&/) != null || charset.match(/\&amp;/) != null){
        htmlEscapedChars.push("&amp;");
        charset = charset.replace(/\&/, "");
        charset = charset.replace(/\&amp;/, "");
      }

      if (charset.match(/</) != null || charset.match(/\&lt;/) != null){
        htmlEscapedChars.push("&lt;");
        charset = charset.replace(/</, "");
        charset = charset.replace(/\&lt;/, "");
      }

      if (charset.match(/>/) != null || charset.match(/\&gt;/) != null){
        htmlEscapedChars.push("&gt;");
        charset = charset.replace(/>/, "");
        charset = charset.replace(/\&gt;/, "");
      }

      if (charset.match(/>/) != null || charset.match(/\&emdash;/) != null){
        htmlEscapedChars.push("&emdash;");
        charset = charset.replace(/>/, "");
        charset = charset.replace(/\&emdash;/, "");
      }


      if (htmlEscapedChars.length > 0) {
        finalStr = "([" + charset + "]|" + htmlEscapedChars.join("|") + "+)";
      } else {
        finalStr = "([" + charset + "]+)";
      }
      return finalStr;
    },


    composeRegex: function(){
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
    }
  }

  $.fn.multilingual = function(params) {
    var multilingual = new MultiLingual({
      containers: this,
      configuration: params
    });

    return multilingual;
  };
 
}( jQuery ));