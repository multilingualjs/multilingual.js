$(document).ready(function(e){
  $(".container1").multilingual([
    "en", "ko", "num", "punct", "cn", "jp", {
      className: "ml-custom",
      charset: '◆〓。「☆'
    }
  ]);
});