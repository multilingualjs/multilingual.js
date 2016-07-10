var MultiLingual = require("../");

$(document).ready(function(e){

	var multilingual = new MultiLingual({
		containers: document.getElementsByClassName("container1"),
		configuration: [
    	"en", "ko", "num", "punct", "cn"
  	]
  });
});
