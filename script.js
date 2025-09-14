// Game state
let progress = 0;
let collected = {};
let currentAspect = null;
let musicPlaying = false;
let screenHistory = ['intro'];
let planetsPositioned = false;

// DOM helper
function $id(id){ return document.getElementById(id); }

// Initialize VK Bridge
function initVK() {
  vkBridge.send('VKWebAppInit', {})
    .then(data => console.log('VK init success', data))
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
function createStars() {
  const starsContainer = $id('stars');
  starsContainer.innerHTML = '';
  
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = Math.random() * 2 + 1 + 'px';
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
    music = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_5b735d9f7f.mp3?filename=ambient-piano-amp-strings-120799.mp3');
    music.loop = true;
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

// Open Prostor community
function openProstor() {
  if (typeof vkBridge !== 'undefined') {
    vkBridge.send('VKWebAppShowCommunityWidgetPreviewBox', {
      group_id: 123456, // Заменить на реальный ID группы Простор
      type: 'text'
    }).catch(console.error);
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

// Planets positioning
function positionPlanets(){
  const map = document.querySelector('.map-container');
  if(!map) return;
  const planets = map.querySelectorAll('.planet');
  const mapWidth = map.offsetWidth;
  const mapHeight = map.offsetHeight;
  
  const padding = 30;
  const safeWidth = mapWidth - padding*2;
  const safeHeight = mapHeight - padding*2;
  const numPlanets = planets.length;
  const centerX = mapWidth/2;
  const centerY = mapHeight/2;
  const maxPlanetW = Math.max(...Array.from(planets).map(p => p.offsetWidth || 60));
  const maxRadiusX = Math.max(0, safeWidth/2 - maxPlanetW);
  const maxRadiusY = Math.max(0, safeHeight/2 - maxPlanetW);
  
  planets.forEach((planet, i) => {
    const angle = (2*Math.PI/numPlanets) * i;
    const radiusRatio = 0.7 + (0.3*(i/numPlanets));
    const radiusX = maxRadiusX * radiusRatio;
    const radiusY = maxRadiusY * radiusRatio;
    const x = Math.cos(angle)*radiusX + centerX - planet.offsetWidth/2;
    const y = Math.sin(angle)*radiusY + centerY - planet.offsetHeight/2;
    const finalX = Math.max(padding, Math.min(x, mapWidth - planet.offsetWidth - padding));
    const finalY = Math.max(padding, Math.min(y, mapHeight - planet.offsetHeight - padding));
    
    planet.style.left = finalX + 'px';
    planet.style.top = finalY + 'px';
  });
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
  document.querySelectorAll('.planet').forEach(p => p.classList.remove('completed'));
  updateAchievements();
  updateInventory();
  screenHistory = ['intro'];
  showScreen('intro');
}

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