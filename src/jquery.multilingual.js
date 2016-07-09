var MultiLingual = require("./multilingual");

(function ( $ ) {
   $.fn.multilingual = function(params) {
    var multilingual = new MultiLingual({
      containers: this,
      configuration: params
    });

    return multilingual;
  };
 
}( jQuery ));