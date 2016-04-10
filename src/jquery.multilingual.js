(function ( $ ) {
  var regexs = {
    en: "[A-Za-z]+",
    ko: "[가-힣]+",
    jp: "[\u3040-\u309F\u30A0-\u30FF]+",
    cn: "[\u4E00-\u9FBF]+",
    num: "[0-9]+",
    punct: "[\(\).,“”\-]|&quot;|&amp;|&lt;|&gt;|&emdash;|&endash;+"
  }

  function MultiLingual(params){
    this.containers = params.containers;
    this.configuration = params.configuration;

    this.init();
  }

  MultiLingual.prototype = {
    init: function(){
      var final_regex = this.compose_regex();
     
      var configuration = this.configuration;

      for (var i = 0, len = this.containers.length; i < len; i++){
        var container = this.containers[i];
        container.innerHTML = container.innerHTML.replace(final_regex, function(){
          for (var i = 1; i < arguments.length; i++) {
            if (arguments[i] != undefined) {
              var config = configuration[i - 1];
              var class_name;

              if (typeof config == "string"){
                class_name = "ml-" + config;
              } else {
                class_name = config.className;
              }

              return "<span class='" + class_name + "'>" + arguments[i] + "</span>";
            }
          }
        });
      }

    },
    
    escape_regex_str: function(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    compute_custom_regex: function (charset) {
      charset = this.escape_regex_str(charset);
      
      var html_escaped_chars = [];
      var final_str = "";

      if (charset.match(/\&/) != null || charset.match(/\&amp;/) != null){
        html_escaped_chars.push("&amp;");
        charset = charset.replace(/\&/, "");
        charset = charset.replace(/\&amp;/, "");
      }

      if (charset.match(/</) != null || charset.match(/\&lt;/) != null){
        html_escaped_chars.push("&lt;");
        charset = charset.replace(/</, "");
        charset = charset.replace(/\&lt;/, "");
      }

      if (charset.match(/>/) != null || charset.match(/\&gt;/) != null){
        html_escaped_chars.push("&gt;");
        charset = charset.replace(/>/, "");
        charset = charset.replace(/\&gt;/, "");
      }

      if (charset.match(/>/) != null || charset.match(/\&emdash;/) != null){
        html_escaped_chars.push("&emdash;");
        charset = charset.replace(/>/, "");
        charset = charset.replace(/\&emdash;/, "");
      }


      if (html_escaped_chars.length > 0) {
        final_str = "([" + charset + "]|" + html_escaped_chars.join("|") + "+)";
      } else {
        final_str = "([" + charset + "]+)";
      }
      return final_str;
    },


    compose_regex: function(){
      var final_regex_str = "(\?![^<>&]*>)";

      for (var i = 0, len = this.configuration.length; i < len; i++){
        var config = this.configuration[i];

        if (typeof config == "string"){
          final_regex_str += "(" + regexs[config] + ")";
        } else {
          final_regex_str += this.compute_custom_regex(config.charset);
        }
        
        if (i < this.configuration.length - 1) {
          final_regex_str += "|";
        }
      }

      return new RegExp(final_regex_str, "gm");
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