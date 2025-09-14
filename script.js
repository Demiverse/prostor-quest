// script.js final2 with requested changes

let progress = 0;
let collected = {};
let currentAspect = null;
let musicPlaying = false;
let animationsEnabled = true;
let currentScreen = 'loading';
let modalReturnScreen = 'intro';

function $id(id){ return document.getElementById(id); }

/* Loader */
let loader = setInterval(() => {
  progress += 10;
  const p = $id('progress');
  if (p) p.innerText = progress + '%';
  if (progress >= 100) {
    clearInterval(loader);
    showScreen('intro');
  }
}, 200);

/* Screen management with history */

function showScreen(id){
  // Show a screen by id. currentScreen updated; modalReturnScreen preserved for modals.
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $id(id);
  if(el) el.classList.add('active');
  // Update currentScreen for non-modal screens
  if(id !== 'achievements' && id !== 'inventory' && id !== 'item-modal'){
    currentScreen = id;
  }
  if(id === 'map'){ setTimeout(positionPlanets, 50); }
}

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $id(id);
  if(el) el.classList.add('active');
  if(id === 'map'){ setTimeout(positionPlanets, 50); }
}

function goBack(){ showScreen(modalReturnScreen || 'map'); }

/* Typing text */

function typeText(elementId, text, speed = 40){
  const el = $id(elementId);
  if(!el) return;
  let i = 0;
  el.innerText = '';
  let interval;
  function finish(){
    clearInterval(interval);
    el.innerText = text;
    el.onclick = null;
  }
  el.onclick = finish;
  interval = setInterval(() => {
    el.innerText += text.charAt(i);
    i++;
    if(i >= text.length){
      clearInterval(interval);
      el.onclick = null;
    }
  }, speed);
}

  }, speed);
}

/* Music */
const music = document.getElementById("bg-music");
function updateMusicButton(){
  const btn = $id('music-toggle');
  if(!btn) return;
  btn.textContent = musicPlaying ? "🔊" : "🔇";
}
function toggleMusic(){
  if(!music) return;
  if(musicPlaying){ music.pause(); }
  else { music.play().catch(()=>{}); }
  musicPlaying = !musicPlaying;
  updateMusicButton();
}

/* Start journey */
function startJourney(){
  showScreen('dialog');
  typeText('dialog-text', "Я — Хранитель. Пять Аспектов ждут тебя. Лишь собрав их вместе, ты сможешь зажечь Источник и противостоять Критику.");
  if(!musicPlaying && music){
    music.play().then(()=>{ musicPlaying = true; updateMusicButton(); }).catch(()=>{});
  }
}

/* Aspects */
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
  $id('aspect-error').style.display = 'none';
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
  err.style.display = 'block';
  setTimeout(()=>{ err.style.display = 'none'; }, 2000);
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

/* Ending */
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

/* Planets positioning */
function positionPlanets(){
  const map = document.querySelector('.map');
  if(!map) return;
  const planets = map.querySelectorAll('.aspect-btn');
  const center = map.querySelector('.center');
  const mapWidth = map.offsetWidth;
  const mapHeight = map.offsetHeight;
  if(center){
    center.style.left = (mapWidth - center.offsetWidth) / 2 + 'px';
    center.style.top = (mapHeight - center.offsetHeight) / 2 + 'px';
  }
  const padding = 40;
  const safeWidth = mapWidth - padding*2;
  const safeHeight = mapHeight - padding*2;
  const numPlanets = planets.length;
  const centerX = mapWidth/2;
  const centerY = mapHeight/2;
  const maxPlanetW = Math.max(...Array.from(planets).map(p => p.offsetWidth || 70));
  const maxRadiusX = Math.max(0, safeWidth/2 - maxPlanetW);
  const maxRadiusY = Math.max(0, safeHeight/2 - maxPlanetW);
  planets.forEach((planet,i) => {
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
    planet.style.animationDelay = (i*0.5) + 's';
  });
}
let resizeTimer;
window.addEventListener('resize', ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{positionPlanets();},250); });
window.addEventListener('load', ()=>{ positionPlanets(); setTimeout(positionPlanets,100); });

/* DOMContentLoaded setup */
document.addEventListener('DOMContentLoaded', ()=>{
  const top = document.createElement('div');
  top.id = 'top-controls';
  top.innerHTML = `
    <button id="ach-btn" title="Достижения">🏅</button>
    <button id="inv-btn" title="Инвентарь">🎒</button>
    <button id="reset-btn" title="Сброс">↩️</button>
    <button id="music-toggle" title="Музыка">🔇</button>
  `;
  document.body.appendChild(top);
  $id('music-toggle').addEventListener('click', toggleMusic);
  $id('ach-btn').addEventListener('click', ()=>{ updateAchievements(); showScreen('achievements'); });
  $id('inv-btn').addEventListener('click', ()=>{ updateInventory(); showScreen('inventory'); });
  $id('reset-btn').addEventListener('click', resetProgress);
  
  // Add dialog headers inside dialog boxes
  document.querySelectorAll('.dialog-box').forEach(box => {
    if(!box.querySelector('.dialog-header')){
      const header = document.createElement('div');
      header.className = 'dialog-header';
      header.textContent = 'Хранитель Простора';
      box.appendChild(header);
    }
  });
  // Ensure modalReturnScreen is set before opening achievements/inventory
  $id('ach-btn').addEventListener('click', ()=>{ modalReturnScreen = currentScreen; updateAchievements(); showScreen('achievements'); });
  $id('inv-btn').addEventListener('click', ()=>{ modalReturnScreen = currentScreen; updateInventory(); showScreen('inventory'); });
updateMusicButton();
});

/* Achievements */
const achievements = {
  form: "Покоритель Формы",
  sound: "Мастер Звука",
  narrative: "Сказитель",
  vision: "Провидец",
  will: "Несгибаемая Воля"
};
function updateAchievements(){
  const list = $id('achievements-list');
  if(!list) return;
  list.innerHTML = '';
  for(let key in achievements){
    const li = document.createElement('li');
    li.className = collected[key] ? 'ach-done' : 'ach-undone';
    li.innerHTML = `<span class="ach-icon">${inventoryItems[key].icon}</span> <strong>${achievements[key]}</strong> ${collected[key] ? '✅' : '❌'}`;
    list.appendChild(li);
  }
}

/* Inventory items */
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
      li.innerHTML = `<span style="font-size:20px;margin-right:8px;">${item.icon}</span> ${item.name}`;
      li.style.cursor = 'pointer';
      li.onclick = ()=> showItemModal(item.name, item.desc);
      list.appendChild(li);
    }
  }
}

/* Item modal */
function showItemModal(title, desc){ modalReturnScreen = currentScreen;
  const titleEl = $id('item-title');
  const descEl = $id('item-desc');
  if(titleEl) titleEl.innerText = title;
  if(descEl) descEl.innerText = desc;
  showScreen('item-modal');
}
function closeItemModal(){ goBack(); }

/* Reset progress */
function resetProgress(){
  collected = {};
  document.querySelectorAll('.planet').forEach(p => p.classList.remove('completed'));
  updateAchievements();
  updateInventory();
  showScreen('intro');
}

/* Expose */
window.startJourney = startJourney;
window.showScreen = showScreen;
window.enterAspect = enterAspect;
window.ending = ending;
window.resetProgress = resetProgress;
window.closeItemModal = closeItemModal;
window.toggleMusic = toggleMusic;
window.goBack = goBack;
