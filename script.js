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
let musicPlaying = false;

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
    music.play().then(() => {
      musicBtn.textContent = "🔊";
      musicPlaying = true;
    }).catch(err => {
      console.log("Автовоспроизведение заблокировано:", err);
    });
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

// Орбиты и вращение планет
let orbits = [];

function initOrbits() {
  const map = document.querySelector(".map");
  const planets = map.querySelectorAll(".aspect-btn");
  const mapRect = map.getBoundingClientRect();
  const cx = map.offsetWidth / 2;
  const cy = map.offsetHeight / 2;

  orbits = [];
  planets.forEach((planet, i) => {
    let angle = Math.random() * Math.PI * 2;
    let radius = 150 + i * 70; // разные орбиты
    let speed = 0.001 + Math.random() * 0.002; // разная скорость
    orbits.push({planet, angle, radius, speed, cx, cy});
  });
}

function animateOrbits() {
  const canvas = document.getElementById("links");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(0, 200, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "cyan";

  const map = document.querySelector(".map");
  const mapRect = map.getBoundingClientRect();
  const cx = mapRect.left + mapRect.width / 2;
  const cy = mapRect.top + mapRect.height / 2;

  orbits.forEach(o => {
    o.angle += o.speed;
    let x = cx + Math.cos(o.angle) * o.radius;
    let y = cy + Math.sin(o.angle) * o.radius;
    o.planet.style.left = (x - mapRect.left - o.planet.offsetWidth/2) + "px";
    o.planet.style.top = (y - mapRect.top - o.planet.offsetHeight/2) + "px";

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  requestAnimationFrame(animateOrbits);
}

window.addEventListener("load", () => {
  initOrbits();
  animateOrbits();
});
window.addEventListener("resize", initOrbits);