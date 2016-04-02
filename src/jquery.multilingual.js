(function ( $ ) {
  var regexs = {
    en: "[A-Za-z]+",
    ko: "[가-힣]+",
    num: "[0-9]+",
    punct: "[\(\).,“”\-]+"
  }

  function MultiLingual(params){
    this.containers = params.containers;
    this.configuration = params.configuration;

    this.init();
  }

  MultiLingual.prototype = {
    init: function(){
      var final_regex = this.compose_regex();
      // var result = final_regex.exec(this.containers[0].innerHTML);
     
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
    

    compose_regex: function(){
      var final_regex_str = "(\?![^<>&]*>)";

      for (var i = 0, len = this.configuration.length; i < len; i++){
        var config = this.configuration[i];

        if (typeof config == "string"){
          final_regex_str += "(" + regexs[config] + ")";
        } else {
          final_regex_str += "(" + config.charset + ")";
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