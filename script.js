let progress = 0;
let collected = {};
let currentAspect = null;

let loader = setInterval(() => {
  progress += 10;
  document.getElementById('progress').innerText = progress + '%';
  if (progress >= 100) {
    clearInterval(loader);
    showScreen('intro');
  }
}, 200);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function typeText(elementId, text, speed = 40) {
  let i = 0;
  let el = document.getElementById(elementId);
  el.innerText = "";
  let interval;

  function finish() {
    clearInterval(interval);
    el.innerText = text;
    el.onclick = null;
  }

  interval = setInterval(() => {
    el.innerText += text.charAt(i);
    i++;
    if (i >= text.length) finish();
  }, speed);

  el.onclick = finish;
}

// Музыка
const music = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-toggle");
let musicPlaying = true; // сразу true

window.addEventListener("load", () => {
  music.play();
  musicBtn.textContent = "🔊";
});

musicBtn.onclick = () => {
  if (musicPlaying) {
    music.pause();
    musicBtn.textContent = "🔇";
  } else {
    music.play();
    musicBtn.textContent = "🔊";
  }
  musicPlaying = !musicPlaying;
};

function startJourney() {
  showScreen('dialog');
  typeText("dialog-text",
    "Я — Хранитель. Пять Аспектов ждут тебя. Лишь собрав их вместе, ты сможешь зажечь Источник и противостоять Критику."
  );
  if (!musicPlaying) {
    music.play();
    musicBtn.textContent = "🔊";
    musicPlaying = true;
  }
}

const aspects = {
  form: {title: 'Аспект Формы',task: 'Какая фигура считается совершенной в геометрии?',puzzle: `<input type="text" id="answer" placeholder="Твой ответ">`,answer: 'круг'},
  sound: {title: 'Аспект Звука',task: 'Что из этого — не музыкальный жанр?',puzzle: `<select id="answer"><option>Рок</option><option>Джаз</option><option>Импрессионизм</option><option>Хип-хоп</option></select>`,answer: 'Импрессионизм'},
  narrative: {title: 'Аспект Нарратива',task: 'Что должно быть в начале истории?',puzzle: `<select id="answer"><option>Герой спасает мир</option><option>Герой отправляется в путь</option><option>Герой встречает врага</option></select>`,answer: 'Герой отправляется в путь'},
  vision: {title: 'Аспект Видения',task: 'Сколько треугольников здесь? 🔺🔺🔺',puzzle: `<input type="number" id="answer" placeholder="Число">`,answer: '3'},
  will: {title: 'Аспект Воли',task: 'Что важнее всего для завершения любого проекта?',puzzle: `<select id="answer"><option>Идея</option><option>Воля</option><option>Инструменты</option></select>`,answer: 'Воля'}
};

function enterAspect(aspect) {
  currentAspect = aspect;
  showScreen('aspect');
  document.getElementById('aspect-title').innerText = aspects[aspect].title;
  document.getElementById('aspect-task').innerText = aspects[aspect].task;
  document.getElementById('aspect-puzzle').innerHTML = aspects[aspect].puzzle;
  document.getElementById('aspect-error').style.display = 'none';

  document.getElementById('aspect-submit').onclick = () => {
    let val = document.getElementById('answer').value.trim();
    if (val.toLowerCase() === aspects[aspect].answer.toLowerCase()) {
      completeAspect();
    } else {
      showError('Ответ неверный. Попробуй снова!');
    }
  };
}

function showError(msg) {
  let err = document.getElementById('aspect-error');
  err.innerText = msg;
  err.style.display = 'block';
  setTimeout(() => {
    err.style.display = 'none';
  }, 2000);
}

function completeAspect() {
  collected[currentAspect] = true;
  document.getElementById(currentAspect).classList.add('completed');
  showScreen('map');
  if (Object.keys(collected).length === 5) {showScreen('final');}
}

function ending(choice) {
  showScreen('ending');
  if (choice === 'chaos') {
    document.getElementById('ending-title').innerText = 'Ты выбрал Хаос';
    document.getElementById('ending-text').innerText = 'Мир распался. Ты стал Проводником хаоса. (🌑)';
  } else {
    document.getElementById('ending-title').innerText = 'Ты сохранил Единство';
    document.getElementById('ending-text').innerText = 'Источник воссиял вновь. Ты стал Хранителем целого. (✨)';
  }
}

// Размещение планет по кругу (с лёгкой случайностью)
function positionPlanets() {
  const map = document.querySelector(".map");
  const planets = map.querySelectorAll(".aspect-btn");
  const radius = map.offsetWidth / 2 - 80;

  planets.forEach((planet, i) => {
    let angle = (Math.PI * 2 / planets.length) * i + (Math.random() * 0.5);
    let x = Math.cos(angle) * radius + map.offsetWidth/2 - planet.offsetWidth/2;
    let y = Math.sin(angle) * radius + map.offsetHeight/2 - planet.offsetHeight/2;
    planet.style.left = x + "px";
    planet.style.top = y + "px";
  });
  drawLinks();
}

function drawLinks() {
  const canvas = document.getElementById("links");
  const ctx = canvas.getContext("2d");
  const map = document.querySelector(".map");
  canvas.width = map.offsetWidth;
  canvas.height = map.offsetHeight;

  const center = map.querySelector(".center");
  const centerRect = center.getBoundingClientRect();
  const mapRect = map.getBoundingClientRect();
  const cx = centerRect.left - mapRect.left + center.offsetWidth/2;
  const cy = centerRect.top - mapRect.top + center.offsetHeight/2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(0, 200, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "cyan";

  document.querySelectorAll(".aspect-btn").forEach(p => {
    const r = p.getBoundingClientRect();
    const x = r.left - mapRect.left + p.offsetWidth/2;
    const y = r.top - mapRect.top + p.offsetHeight/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
}

window.addEventListener("load", positionPlanets);
window.addEventListener("resize", positionPlanets);
