var assert = require('chai').assert;
var lodash = require('lodash');
var MultiLingual = require('../multilingual');
var $ = require("jquery");

describe('국문, 영문 분리', function() {
  

  it('국문, 영문을 분리해낸다', function(){
  var multilingual;
    multilingual = new MultiLingual({
      container: ".container1",
      configuration: [
        {
          lang: "en",
          font: "Times"
        },
        {
          lang: "ko",
          font: "Apple SD Gothic Neo"
        },
        {
          lang: "numeric",
          font: "Times"
        },
        {
          lang: "puncutation",
          font: "Times"
        }
      ]
    });
    assert.equal($(".container1 .ml-ko").length, 3);
    assert.equal($(".container1 .ml-en").length, 1);
    assert.equal($(".container1 .ml-puncutation").length, 2);
  })
});