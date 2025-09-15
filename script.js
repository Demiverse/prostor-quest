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

// DOM helper
function $id(id){ return document.getElementById(id); }

// Initialize VK Bridge
function initVK() {
  if (typeof vkBridge === 'undefined') return Promise.resolve();
  return vkBridge.send('VKWebAppInit', {})
    .then(data => {
      console.log('VK init success', data);
      vkInited = true;
      return true;
    })
    .catch(error => {
      console.error('VK init error', error);
      return false;
    });
}

// Loader without forced delay
function startLoader() {
  const loader = setInterval(() => {
    progress += 5;
    const p = $id('progress');
    if (p) p.innerText = progress + '%';
    if (progress >= 100) {
      clearInterval(loader);
      initVK().then(() => showScreen('intro'));
    }
  }, 300);
}

// ... остальной код без изменений ...
