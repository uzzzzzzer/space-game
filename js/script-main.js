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