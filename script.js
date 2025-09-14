// Game state
let progress = 0;
let collected = {};
let currentAspect = null;
let musicPlaying = false;
let screenHistory = ['loading'];
let planetsPositioned = false;
let firstLaunchPlayed = false;
let starsCreated = false;
let vkInited = false;
let isGoingBack = false;

// DOM helper
function $id(id){ return document.getElementById(id); }

// Initialize VK Bridge
function initVK() {
  if (typeof vkBridge === 'undefined') return Promise.resolve();
  return vkBridge.send('VKWebAppInit', {})
    .then(data => { vkInited = true; return true; })
    .catch(() => false);
}

// Loader with 8s minimum
function startLoader() {
  const startTime = Date.now();
  const loader = setInterval(() => {
    progress += 5;
    const p = $id('progress');
    if (p) p.innerText = progress + '%';
    if (progress >= 100) {
      clearInterval(loader);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 8000 - elapsed); // at least 8s
      setTimeout(async ()=>{
        await initVK();
        showScreen('intro');
      }, remaining);
    }
  }, 300);
}

// Show screen
function showScreen(id){
  if(!isGoingBack && id !== 'achievements' && id !== 'inventory' && id !== 'item-modal') {
    const last = screenHistory[screenHistory.length - 1];
    if(last !== id) screenHistory.push(id);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $id(id);
  if(el) el.classList.add('active');
  if(id === 'map' && !planetsPositioned){ positionPlanets(); planetsPositioned = true; }
}

function goBack(){
  if(screenHistory.length > 1) {
    isGoingBack = true;
    screenHistory.pop();
    const prevScreen = screenHistory[screenHistory.length - 1];
    showScreen(prevScreen);
    isGoingBack = false;
  } else {
    showScreen('intro');
  }
}

// ... (rest of script.js same as v3, omitted for brevity)
