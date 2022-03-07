const progressBars = document.querySelectorAll("#progress-bar");
const progressNext = document.getElementById("progress-next");
const progressPrev = document.getElementById("progress-prev");

const steps = document.querySelectorAll(".step");
var stats = JSON.parse(localStorage.getItem('stats'));
let active = Math.min(stats.stages,stats.passed);
progressNext.addEventListener("click", () => {
  active++;
  if (active > steps.length) {
    active = steps.length;
  }
  updateProgress();
});

progressPrev.addEventListener("click", () => {
  active--;
  if (active < 1) {
    active = 1;
  }
  updateProgress();
});

const updateProgress = () => {
  steps.forEach((step, i) => {
    if (i < active) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });
  progressBars.forEach((progressBar, i) => {
    if (i >=0) {
      progressBar.style.width = (Math.min((active-i*steps.length/progressBars.length),steps.length/progressBars.length) / (steps.length)*progressBars.length) * 100 + "%";
    } 
  });
  
  if (active === 1) {
    progressPrev.disabled = true;
  } else if (active === steps.length) {
    progressNext.disabled = true;
  } else {
    progressPrev.disabled = false;
    progressNext.disabled = false;
  }
};
updateProgress();
function go(stage){
	if(stage<=stats.passed+1){
	stats.selected=stage;
	localStorage.setItem('stats', JSON.stringify(stats));
	window.location.replace("index.html");
	}
	
}
//----------------------------------------
var stats = JSON.parse(localStorage.getItem('stats'));
var xp=stats.xp;
var next_lv_increment = 2;
var first_level = 1;
function Log(x, y) {
  return Math.log(y) / Math.log(x);
}

function get_level(xp){
  var lv = Math.floor(Log(next_lv_increment,xp/first_level));
  return lv;
}

function get_xp(lv){
	return Math.pow(next_lv_increment,lv)*first_level;
}
function prog() {
  var lv = get_level(xp);
  var need = get_xp(lv+1);
  var elem = document.getElementById("progress");   
  var fill = 0;
  var id = setInterval(frame, 1);
  function frame() {
    if (fill < xp)  {
      console.log(fill);
      fill+=xp;
      fill=Math.round(fill);
      elem.style.width = fill/need*100 + '%'; 

      document.getElementById("xp").innerHTML = fill+"/"+need+" XP of "+(lv+1) + " level";
      document.getElementById("lv").innerHTML = lv+" level";
    }
  }
}
var dct={max_speed:[2,2,3,3,3,3,4,4,4,4,5,5],
      damage:[1,1,1,1.2,1.2,1.2,1.3,1.3,1.4,1.5,1.6,2],
      health:[5,5,5,5,6,6,6,6,7,7,8,8]};
var lv = get_level(xp);
const dmg = document.getElementById("damage");
const hlth = document.getElementById("health");
const spd = document.getElementById("speed");

dmg.innerHTML = "Damage:"+dct.damage[lv]*10;
hlth.innerHTML = "Health:"+dct.health[lv]*10;
spd.innerHTML = "Speed:"+dct.max_speed[lv]*10;
