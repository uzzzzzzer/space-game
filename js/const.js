var next_lv_increment = 2;
var first_level = 1;

function Log(x, y) {
  return Math.log(y) / Math.log(x);
}

function get_level(xp){
  var lv = Math.floor(Log(xp), next_lv_increment);
}

