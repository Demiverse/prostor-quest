
const inventoryItems = {
  form: { icon: "🔷", name: "Артефакт Формы", desc: "Символ совершенства и идеальной гармонии." },
  sound: { icon: "🎵", name: "Артефакт Звука", desc: "Символ музыки и вибраций, объединяющих всё." },
  narrative: { icon: "📜", name: "Артефакт Нарратива", desc: "Символ историй, связывающих миры." },
  vision: { icon: "👁️", name: "Артефакт Видения", desc: "Символ прозрения и ясности." },
  will: { icon: "🔥", name: "Артефакт Воли", desc: "Символ силы, которая ведёт вперёд." }
};


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
  
  // При переключении экрана перерисовываем планеты
  if (id === 'map') {
    setTimeout(positionPlanets, 50);
  }
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

// Улучшенное позиционирование планет
function positionPlanets() {
  const map = document.querySelector(".map");
  const planets = map.querySelectorAll(".aspect-btn");
  const center = map.querySelector(".center");

  const mapWidth = map.offsetWidth;
  const mapHeight = map.offsetHeight;
  
  // Центральная планета в центре
  center.style.left = (mapWidth - center.offsetWidth) / 2 + "px";
  center.style.top = (mapHeight - center.offsetHeight) / 2 + "px";

  // Безопасная зона (отступ от краев)
  const padding = 40;
  const safeWidth = mapWidth - padding * 2;
  const safeHeight = mapHeight - padding * 2;

  // Эллиптическое распределение для лучшего использования пространства
  const numPlanets = planets.length;
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Автоматическое определение оптимального радиуса
  const maxRadiusX = safeWidth / 2 - Math.max(...Array.from(planets).map(p => p.offsetWidth));
  const maxRadiusY = safeHeight / 2 - Math.max(...Array.from(planets).map(p => p.offsetHeight));
  
  // Используем эллипс для лучшего заполнения пространства
  planets.forEach((planet, i) => {
    const angle = (2 * Math.PI / numPlanets) * i;
    
    // Динамическое распределение радиусов
    const radiusRatio = 0.7 + (0.3 * (i / numPlanets)); // От 70% до 100%
    const radiusX = maxRadiusX * radiusRatio;
    const radiusY = maxRadiusY * radiusRatio;

    const x = Math.cos(angle) * radiusX + centerX - planet.offsetWidth / 2;
    const y = Math.sin(angle) * radiusY + centerY - planet.offsetHeight / 2;

    // Проверка границ
    const finalX = Math.max(padding, Math.min(x, mapWidth - planet.offsetWidth - padding));
    const finalY = Math.max(padding, Math.min(y, mapHeight - planet.offsetHeight - padding));

    planet.style.left = finalX + "px";
    planet.style.top = finalY + "px";
    
    // Уникальная задержка анимации для каждой планеты
    planet.style.animationDelay = `${i * 0.5}s`;
  });
}

// Автоматическое обновление при изменении размера
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(positionPlanets, 250);
});

// Инициализация после полной загрузки
window.addEventListener("load", () => {
  positionPlanets();
  // Дополнительная проверка после небольшой задержки
  setTimeout(positionPlanets, 100);
});

// Дополнительная обработка для VK Mini Apps
document.addEventListener('DOMContentLoaded', function() {
  // Проверка типа устройства
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    document.body.classList.add('mobile');
  } else {
    document.body.classList.add('desktop');
  }
  
  // Перепозиционирование при изменении ориентации
  window.addEventListener('orientationchange', function() {
    setTimeout(positionPlanets, 300);
  });
});

// Ачивки
const achievements = {
  form: "Покоритель Формы",
  sound: "Мастер Звука",
  narrative: "Сказитель",
  vision: "Провидец",
  will: "Несгибаемая Воля"
};

function updateAchievements() {
  const list = document.getElementById('achievements-list');
  list.innerHTML = "";
  for (let key in achievements) {
    const li = document.createElement('li');
    li.textContent = achievements[key] + (collected[key] ? " ✅" : " ❌");
    list.appendChild(li);
  }
}

// Инвентарь



  form: "Артефакт Формы",
  sound: "Артефакт Звука",
  narrative: "Артефакт Нарратива",
  vision: "Артефакт Видения",
  will: "Артефакт Воли"
};

function updateInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = "";
  for (let key in collected) {
    if (collected[key]) {
      const li = document.createElement('li');
      li.innerHTML = `<span style="font-size:20px;margin-right:8px;">${inventoryItems[key].icon}</span> ${inventoryItems[key].name}`;
      li.style.cursor = "pointer";
      li.onclick = () => showItemModal(inventoryItems[key].name, inventoryItems[key].desc);
      list.appendChild(li);
    }
  }
}</span> ${inventoryItems[key].name}`;
      li.style.cursor = "pointer";
      li.onclick = () => showItemModal(inventoryItems[key].name, inventoryItems[key].desc);
      list.appendChild(li);
    }
  }
}</span> ${inventoryItems[key].name} - описание заглушка`;
      list.appendChild(li);
    }
  }
}
  const list = document.getElementById('inventory-list');
  list.innerHTML = "";
  for (let key in collected) {
    if (collected[key]) {
      const li = document.createElement('li');
      li.textContent = inventoryItems[key] + " - описание заглушка";
      list.appendChild(li);
    }
  }
}

// Сброс прогресса
function resetProgress() {
  collected = {};
  document.querySelectorAll('.planet').forEach(p => p.classList.remove('completed'));
  showScreen('intro');
}

// Кнопки в диалоге
document.addEventListener("DOMContentLoaded", () => {
  // Добавим верхние кнопки
  const top = document.createElement("div");
  top.id = "top-controls";
  top.innerHTML = `
    <button onclick="showScreen('achievements')">🏅</button>
    <button onclick="showScreen('settings')">⚙️</button>
    <button id="music-toggle">🔇</button>
  `;
  document.body.appendChild(top);

  // Добавим рюкзак к диалогам
  document.querySelectorAll('.dialog-box').forEach(box => {
    const header = document.createElement("div");
    header.className = "dialog-header";
    header.textContent = "Хранитель Простора";
    box.appendChild(header);

    const inv = document.createElement("div");
    inv.className = "dialog-inventory";
    inv.textContent = "🎒";
    inv.onclick = () => { updateInventory(); showScreen('inventory'); };
    box.appendChild(inv);
  });
});


// Модалка предмета
function showItemModal(title, desc) {
  document.getElementById("item-title").innerText = title;
  document.getElementById("item-desc").innerText = desc;
  showScreen("item-modal");
}

function closeItemModal() {
  showScreen("inventory");
}

// Переопределяем updateInventory для кликабельных предметов
function updateInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = "";
  for (let key in collected) {
    if (collected[key]) {
      const li = document.createElement('li');
      li.innerHTML = `<span style="font-size:20px;margin-right:8px;">${inventoryItems[key].icon}</span> ${inventoryItems[key].name}`;
      li.style.cursor = "pointer";
      li.onclick = () => showItemModal(inventoryItems[key].name, inventoryItems[key].desc);
      list.appendChild(li);
    }
  }
}</span> ${inventoryItems[key].name}`;
      li.style.cursor = "pointer";
      li.onclick = () => showItemModal(inventoryItems[key].name, inventoryItems[key].desc);
      list.appendChild(li);
    }
  }
}</span> ${inventoryItems[key].name}`;
      li.style.cursor = "pointer";
      li.onclick = () => showItemModal(inventoryItems[key].name, "Описание этого артефакта появится позже...");
      list.appendChild(li);
    }
  }
}
