module.exports = MultiLingual;

function MultiLingual(){

}

MultiLingual.prototype = {
  get_every_fonts: function(){
    var results = [];

    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i];
    
      for (var j = 0; j < sheet.cssRules.length; j++) {
        var rule = sheet.cssRules[j];
        results.push(rule.style.fontFamily);
      }
    
    }
    
    return results.join(", ");
  }
}