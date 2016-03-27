module.exports = MultiLingual;

var Events = require('backbone-events-standalone');
var _ = require('lodash');
var $ = require('jquery');

var regexs = {
  en: "[A-Za-z]+",
  ko: "[가-힣]+",
  numeric: "[0-9]+",
  puncutation: "[\(\).,“”\-]+"
  // puncutation: "[\-.,\/#“”!$%\^&\*;:{}=\-_`~\(\)]+"
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