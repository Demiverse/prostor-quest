let planets = [];

function initPlanets() {
  const map = document.querySelector(".map");
  const planetsEls = Array.from(map.querySelectorAll(".aspect-btn"));
  const cx = map.offsetWidth / 2;
  const cy = map.offsetHeight / 2;
  const radius = Math.min(map.offsetWidth, map.offsetHeight) / 2.5;

  planetsEls.forEach((planet, i) => {
    let angle = (i / planetsEls.length) * Math.PI * 2;
    let x = cx + Math.cos(angle) * radius - planet.offsetWidth / 2;
    let y = cy + Math.sin(angle) * radius - planet.offsetHeight / 2;
    planet.style.left = x + "px";
    planet.style.top = y + "px";
  });
}

window.addEventListener("load", initPlanets);
window.addEventListener("resize", initPlanets);
