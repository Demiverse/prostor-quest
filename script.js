// Game state
let progress = 0;
let collected = {};
let currentAspect = null;
let musicPlaying = false;
let screenHistory = ['intro'];
let planetsPositioned = false;
let firstLaunchPlayed = false;

// DOM helper
function $id(id){ return document.getElementById(id); }

// Initialize VK Bridge
function initVK() {
  if (typeof vkBridge === 'undefined') return;
  vkBridge.send('VKWebAppInit', {})
    .then(data => {
      console.log('VK init success', data);
      // Try to (re)create stars after VK init so background isn't lost
      try { createStars(); } catch (e) {}
      // subscribe to bridge events - recreate stars on config/visibility changes
      try {
        vkBridge.subscribe((e) => {
          if(!e) return;
          // For many events it's safe to refresh visual background
          createStars();
          updateVKViewport();
        });
      } catch(e) {
        console.warn('vkBridge.subscribe failed', e);
      }
    })
    .catch(error => console.error('VK init error', error));
}

// Loader
let loader = setInterval(() => {
  progress += 10;
  const p = $id('progress');
  if (p) p.innerText = progress + '%';
  if (progress >= 100) {
    clearInterval(loader);
    showScreen('intro');
    initVK();
    createStars();
  }
}, 200);

// Create stars background
function createStars(count = 100) {
  const starsContainer = $id('stars');
  if (!starsContainer) return;
  starsContainer.innerHTML = '';
  // make sure it's visible (some wrappers in VK can change styles)
  starsContainer.style.display = 'block';

  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = size + 'px';
    star.style.height = star.style.width;
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.opacity = Math.random() * 0.7 + 0.3;
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
  }
}

// Screen management with history
function showScreen(id){
  if(id !== 'achievements' && id !== 'inventory' && id !== 'item-modal') {
    screenHistory.push(id);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $id(id);
  if(el) el.classList.add('active');

  if(id === 'map' && !planetsPositioned){ 
    positionPlanets(); 
    planetsPositioned = true;
  }

  // Update VK view height
  updateVKViewport();
}

function updateVKViewport() {
  if (typeof vkBridge !== 'undefined') {
    vkBridge.send('VKWebAppSetViewSettings', {
      status_bar_style: 'light',
      action_bar_color: '#000000'
    }).catch(console.error);
  }
}

function goBack(){
  if(screenHistory.length > 1) {
    screenHistory.pop();
    const prevScreen = screenHistory[screenHistory.length - 1];
    showScreen(prevScreen);
  } else {
    showScreen('intro');
  }
}

// Typing text with skip
function typeText(elementId, text, speed = 40){
  const el = $id(elementId);
  if(!el) return;
  let i = 0;
  el.innerHTML = '';
  let interval = setInterval(() => {
    if (i < text.length) {
      el.innerHTML += text.charAt(i);
      i++;
    } else {
      clearInterval(interval);
    }
  }, speed);
  el.onclick = () => {
    clearInterval(interval);
    el.innerHTML = text;
  };
}

// Music
let music = null;

function toggleMusic(){
  if (!music) {
    // Use local file provided in project root
    music = new Audio('StockTune-Echoes Of The Cosmos_1757438077.mp3');
    music.loop = true;
    music.preload = 'auto';
  }

  if(musicPlaying){ 
    music.pause(); 
  } else { 
    music.play().catch(() => {}); 
  }
  musicPlaying = !musicPlaying;
  updateMusicButton();
}

function updateMusicButton(){
  const btn = $id('music-btn');
  if(!btn) return;
  btn.textContent = musicPlaying ? "🔊" : "🔇";
}

// Start journey
function startJourney(){
  showScreen('dialog');
  typeText('dialog-text', "Я — Хранитель Простора. Пять Аспектов ждут тебя. Лишь собрав их вместе, ты сможешь зажечь Источник и противостоять Критику.");
}

// Open Prostor community (opens vk.com/prostor)
function openProstor() {
  if (typeof vkBridge !== 'undefined') {
    // Fallback: try opening community preview, but ensure link fallback as well
    try {
      vkBridge.send('VKWebAppShowCommunityWidgetPreviewBox', {
        group_id: 1, // placeholder (if invalid, fallback below)
        type: 'text'
      }).catch(() => {
        window.open('https://vk.com/prostor', '_blank');
      });
    } catch(e) {
      window.open('https://vk.com/prostor', '_blank');
    }
  } else {
    window.open('https://vk.com/prostor', '_blank');
  }
}

// Aspects
const aspects = {
  form: {title: 'Аспект Формы',task: 'Какая фигура считается совершенной в геометрии?',puzzle: `<input type="text" id="answer" placeholder="Твой ответ">`,answer: 'круг'},
  sound: {title: 'Аспект Звука',task: 'Что из этого — не музыкальный жанр?',puzzle: `<select id="answer"><option>Рок</option><option>Джаз</option><option>Импрессионизм</option><option>Хип-хоп</option></select>`,answer: 'Импрессионизм'},
  narrative: {title: 'Аспект Нарратива',task: 'Что должно быть в начале истории?',puzzle: `<select id="answer"><option>Герой спасает мир</option><option>Герой отправляется в путь</option><option>Герой встречает врага</option></select>`,answer: 'Герой отправляется в путь'},
  vision: {title: 'Аспект Видения',task: 'Сколько треугольников здесь? 🔺🔺🔺',puzzle: `<input type="number" id="answer" placeholder="Число">`,answer: '3'},
  will: {title: 'Аспект Воли',task: 'Что важнее всего для завершения любого проекта?',puzzle: `<select id="answer"><option>Идея</option><option>Воля</option><option>Инструменты</option></select>`,answer: 'Воля'}
};

function enterAspect(aspect){
  currentAspect = aspect;
  showScreen('aspect');
  const a = aspects[aspect];
  if(!a) return;
  $id('aspect-title').innerText = a.title;
  $id('aspect-task').innerText = a.task;
  $id('aspect-puzzle').innerHTML = a.puzzle;
  $id('aspect-error').innerText = '';
  const submit = $id('aspect-submit');
  if(submit){
    submit.onclick = () => {
      const ansEl = $id('answer');
      if(!ansEl){ showError('Нет поля ответа'); return; }
      let val = (ansEl.value || '').toString().trim();
      if(val.toLowerCase() === a.answer.toLowerCase()){ completeAspect(); }
      else { showError('Ответ неверный. Попробуй снова!'); }
    };
  }
}

function showError(msg){
  const err = $id('aspect-error');
  if(!err) return;
  err.innerText = msg;
  setTimeout(()=>{ err.innerText = ''; }, 2000);
}

function completeAspect(){
  if(!currentAspect) return;
  collected[currentAspect] = true;
  const el = $id(currentAspect);
  if(el) el.classList.add('completed');
  updateAchievements();
  updateInventory();
  showScreen('map');
  if(Object.keys(collected).length === 5){ showScreen('final'); }
}

// Ending
function ending(choice){
  showScreen('ending');
  if(choice === 'chaos'){
    $id('ending-title').innerText = 'Ты выбрал Хаос';
    $id('ending-text').innerText = 'Мир распался. Ты стал Проводником хаоса. (🌑)';
  } else {
    $id('ending-title').innerText = 'Ты сохранил Единство';
    $id('ending-text').innerText = 'Источник воссиял вновь. Ты стал Хранителем целого. (✨)';
  }
}

// Share result
function shareResult() {
  if (typeof vkBridge !== 'undefined') {
    const aspectCount = Object.keys(collected).length;
    const message = aspectCount === 5 ? 
      'Я собрал все 5 Аспектов и стал Хранителем целого в игре "Сингулярность Простора"! ✨' :
      `Я собрал ${aspectCount} из 5 Аспектов в игре "Сингулярность Простора"!`;

    vkBridge.send('VKWebAppShowWallPostBox', {
      message: message
    }).catch(console.error);
  }
}

// Planets positioning + first-launch animation
function positionPlanets(){
  const map = document.querySelector('.map-container');
  if(!map) return;
  const planets = Array.from(map.querySelectorAll('.planet'));
  const mapWidth = map.clientWidth;
  const mapHeight = map.clientHeight;

  const padding = 30;
  const safeWidth = mapWidth - padding*2;
  const safeHeight = mapHeight - padding*2;
  const numPlanets = planets.length;
  const centerX = mapWidth/2;
  const centerY = mapHeight/2;

  // compute final positions (ellipse-ish)
  planets.forEach((planet, i) => {
    const angle = (2*Math.PI/numPlanets) * i;
    const radiusRatio = 0.7 + (0.3*(i/numPlanets));
    const planetW = planet.offsetWidth || 60;
    const radiusX = Math.max(0, safeWidth/2 - planetW);
    const radiusY = Math.max(0, safeHeight/2 - planetW);
    const x = Math.cos(angle)*radiusX + centerX - planetW/2;
    const y = Math.sin(angle)*radiusY + centerY - planetW/2;
    const finalX = Math.max(padding, Math.min(x, mapWidth - planetW - padding));
    const finalY = Math.max(padding, Math.min(y, mapHeight - planetW - padding));
    planet.dataset.finalLeft = finalX;
    planet.dataset.finalTop = finalY;
  });

  // If first launch not played yet, animate planets flying out from center
  if(!firstLaunchPlayed){
    planets.forEach((planet) => {
      planet.classList.add('no-float');
      // start at center
      const startX = centerX - (planet.offsetWidth/2);
      const startY = centerY - (planet.offsetHeight/2);
      planet.style.left = startX + 'px';
      planet.style.top = startY + 'px';
      planet.style.opacity = 0;
      planet.style.transform = 'scale(0.6)';
    });

    // slight delay to allow DOM to apply start positions
    setTimeout(()=> {
      planets.forEach((planet, i) => {
        const delay = i * 140; // stagger
        setTimeout(()=> {
          planet.style.transition = 'left 700ms cubic-bezier(.2,.9,.3,1), top 700ms cubic-bezier(.2,.9,.3,1), transform 600ms, opacity 300ms';
          planet.style.left = planet.dataset.finalLeft + 'px';
          planet.style.top = planet.dataset.finalTop + 'px';
          planet.style.opacity = 1;
          planet.style.transform = 'scale(1)';
        }, delay);
      });
    }, 80);

    // after animation ends, restore floating animation and clear transitions
    const totalTime = 80 + planets.length*140 + 900;
    setTimeout(()=> {
      planets.forEach((planet) => {
        planet.classList.remove('no-float');
        planet.style.transition = '';
        planet.style.transform = '';
      });
      firstLaunchPlayed = true;
    }, totalTime);
  } else {
    // simple place planets to final positions (no animation)
    planets.forEach((planet) => {
      planet.style.left = planet.dataset.finalLeft + 'px';
      planet.style.top = planet.dataset.finalTop + 'px';
      planet.style.opacity = 1;
    });
  }
}

// Achievements
const achievements = {
  form: {icon: "🔷", name: "Покоритель Формы"},
  sound: {icon: "🎵", name: "Мастер Звука"},
  narrative: {icon: "📜", name: "Сказитель"},
  vision: {icon: "👁️", name: "Провидец"},
  will: {icon: "🔥", name: "Несгибаемая Воля"}
};

function updateAchievements(){
  const list = $id('achievements-list');
  if(!list) return;
  list.innerHTML = '';
  for(let key in achievements){
    const ach = achievements[key];
    const li = document.createElement('li');
    li.className = collected[key] ? 'ach-item done' : 'ach-item undone';
    li.innerHTML = `
      <span class="ach-icon">${ach.icon}</span> 
      <strong>${ach.name}</strong> 
      ${collected[key] ? '✅' : '❌'}
    `;
    list.appendChild(li);
  }
}

// Inventory
const inventoryItems = {
  form: { icon: "🔷", name: "Артефакт Формы", desc: "Символ совершенства и гармонии." },
  sound: { icon: "🎵", name: "Артефакт Звука", desc: "Символ музыки и вибраций." },
  narrative: { icon: "📜", name: "Артефакт Нарратива", desc: "Символ историй." },
  vision: { icon: "👁️", name: "Артефакт Видения", desc: "Символ прозрения." },
  will: { icon: "🔥", name: "Артефакт Воли", desc: "Символ силы." }
};

function updateInventory(){
  const list = $id('inventory-list');
  if(!list) return;
  list.innerHTML = '';
  for(let key in inventoryItems){
    if(collected[key]){
      const item = inventoryItems[key];
      const li = document.createElement('li');
      li.className = 'inv-item';
      li.innerHTML = `
        <span class="item-icon">${item.icon}</span> 
        <span>${item.name}</span>
      `;
      li.onclick = () => showItemModal(item.name, item.desc);
      list.appendChild(li);
    }
  }
  if(list.children.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#888;list-style:none;">Инвентарь пуст</li>';
  }
}

// Item modal
function showItemModal(title, desc){
  const titleEl = $id('item-title');
  const descEl = $id('item-desc');
  if(titleEl) titleEl.innerText = title;
  if(descEl) descEl.innerText = desc;
  showScreen('item-modal');
}

function closeItemModal(){
  showScreen('inventory');
}

// Reset progress
function resetProgress(){
  collected = {};
  planetsPositioned = false;
  firstLaunchPlayed = false;
  document.querySelectorAll('.planet').forEach(p => p.classList.remove('completed'));
  updateAchievements();
  updateInventory();
  screenHistory = ['intro'];
  showScreen('intro');
}

// Ensure stars are present on visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    try { createStars(); } catch(e) {}
  }
});

window.addEventListener('focus', () => {
  try { createStars(); } catch(e) {}
});

// Initialize
document.addEventListener('DOMContentLoaded', ()=>{
  // Create top controls
  const top = document.createElement('div');
  top.id = 'top-controls';
  top.innerHTML = `
    <button id="music-btn" title="Музыка">🔇</button>
    <button id="ach-btn" title="Достижения">🏅</button>
    <button id="inv-btn" title="Инвентарь">🎒</button>
    <button id="reset-btn" title="Сброс">↩️</button>
  `;
  document.body.appendChild(top);

  $id('music-btn').addEventListener('click', toggleMusic);
  $id('ach-btn').addEventListener('click', ()=>{ updateAchievements(); showScreen('achievements'); });
  $id('inv-btn').addEventListener('click', ()=>{ updateInventory(); showScreen('inventory'); });
  $id('reset-btn').addEventListener('click', resetProgress);

  updateMusicButton();

  // Try to create stars immediately so they exist even if VK changes styles
  try { createStars(); } catch(e) {}
});

// Make functions global
window.startJourney = startJourney;
window.showScreen = showScreen;
window.enterAspect = enterAspect;
window.ending = ending;
window.resetProgress = resetProgress;
window.closeItemModal = closeItemModal;
window.toggleMusic = toggleMusic;
window.goBack = goBack;
window.openProstor = openProstor;
window.shareResult = shareResult;
