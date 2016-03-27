module.exports = MultiLingual;

var Events = require('backbone-events-standalone');
var _ = require('lodash');
var $ = require('jquery');

var regexs = {
  en: "[A-Za-z]+",
  ko: "[가-힣]+",
  numeric: "[0-9]+",
  puncutation: "[.,\/#!$%\^&\*;:{}=\-_`~()]+"
}

function MultiLingual(params){

  this.containers = $(params.container);
  this.configuration = params.configuration;

  _.extend(this, Events);

  this.init();
}

MultiLingual.prototype = {
  init: function(){
    var final_regex = this.compose_regex();

    this.containers.each(_.bind(function(i, container){

      _.each(this.configuration, _.bind(function(config){
        var content = container.innerHTML;
        container.innerHTML = container.innerHTML.replace(final_regex, function(result){
          // 결과를 보고 클래스를 맞게 집어넣는 로직을 넣는다
        });
      }, this));

    }, this));
  },

  compose_regex: function(){
    // ([가-힣]+)|([A-Za-z]+)|([0-9]+)|([.,\/#!$%\^&\*;:{}=\-_`~()]+)
    var final_regex_str = "";

    _.each(this.configuration, function(config){
      final_regex_str += "(" + regexs[config.lang] + "+)|";
    });

    return new RegExp(final_regex_str, "gm");
  }
}