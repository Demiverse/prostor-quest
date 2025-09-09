// app.js — переработанная версия с сохраненной логикой и улучшенным сюжетом для VK Mini Apps

// -------------------
// Глобальное состояние (структура и имена функций оставлены прежними)
// -------------------
let gameState = {
    currentScreen: 'loading',
    storyIndex: 0,
    completedPuzzles: [],
    startTime: null,
    playerName: 'Стажер',
    soundEnabled: false,
    platform: 'web',
    isVKApp: false,
    activePuzzle: null,
    hintsUsed: {}
};

// -------------------
// Инициализация (VK Bridge + загрузка)
// -------------------
async function initGame() {
    console.log('Инициализация игры...');
    try {
        if (typeof vkBridge !== 'undefined' && vkBridge) {
            try {
                await vkBridge.send('VKWebAppInit');
                gameState.isVKApp = true;
                // Получаем имя пользователя, если разрешено
                const user = await vkBridge.send('VKWebAppGetUserInfo');
                if (user && user.first_name) gameState.playerName = user.first_name;
                console.log('VK Bridge готов, игрок:', gameState.playerName);
            } catch (e) {
                console.warn('VK Bridge недоступен или запрос отклонён:', e);
            }
        }
    } catch (err) {
        console.warn('vkBridge не найден, запускаем в браузере.', err);
    }

    detectPlatform();
    simulateLoading();
}

// -------------------
// Платформа и загрузка
// -------------------
function detectPlatform() {
    const badge = document.getElementById('platform-badge');
    if (gameState.isVKApp) {
        gameState.platform = 'vk_app';
        if (badge) badge.textContent = 'VK Mini App — ' + (gameState.playerName || 'игрок');
        document.body.classList.add('vk-app');
    } else {
        gameState.platform = 'web';
        if (badge) badge.textContent = 'Браузер';
    }
}

function simulateLoading() {
    const progressBar = document.querySelector('.loading-progress');
    let progress = 0;
    const id = setInterval(() => {
        progress += Math.floor(Math.random()*8)+2;
        if (progressBar) progressBar.style.width = Math.min(progress,100)+'%';
        if (progress >= 100) {
            clearInterval(id);
            setTimeout(()=>{
                gameState.startTime = Date.now();
                showScreen('game');
                loadStory(0);
            }, 480);
        }
    }, 60);
}

// -------------------
// Экранные функции
// -------------------
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const screen = document.getElementById('screen-'+screenName);
    if (screen) screen.classList.add('active');
    gameState.currentScreen = screenName;
}

function toggleMenu(){ document.getElementById('side-menu').classList.toggle('active'); playClick(); }
function toggleSound(){ gameState.soundEnabled = !gameState.soundEnabled; document.getElementById('sound-icon').textContent = gameState.soundEnabled ? '🔊' : '🔈'; playClick(); updateSoundUI(); }
function updateSoundUI(){ const bg = document.getElementById('background-music'); if(!bg) return; if(gameState.soundEnabled) { bg.play().catch(()=>{}); } else { bg.pause(); } }
function backToGame(){ playClick(); showScreen('game'); }
function playClick(){ if(gameState.soundEnabled) document.getElementById('click-sound').play().catch(()=>{}); }
function playSuccess(){ if(gameState.soundEnabled) document.getElementById('success-sound').play().catch(()=>{}); }

// -------------------
// Загрузка сюжета и обновление UI
// -------------------
function loadStory(index){
    if(!Array.isArray(gameData.story)) return;
    if(index<0 || index>=gameData.story.length) return;
    const step = gameData.story[index];
    gameState.storyIndex = index;
    gameState.activePuzzle = step.puzzle || null;
    updateStoryUI(step);
    updateProgress();
    // Если шаг содержит пазл — запускаем его автоматически через небольшую задержку
    if(step.puzzle) setTimeout(()=> startPuzzle(step.puzzle), 350);
}

function updateStoryUI(step){
    const character = gameData.characters[step.character] || {name:'СИСТЕМА', emoji:'⚡'};
    document.getElementById('character-name').textContent = character.name;
    document.getElementById('dialog-text').textContent = step.text || '';
    const emojiSpan = document.querySelector('#character-image .character-emoji');
    if(emojiSpan) emojiSpan.textContent = character.emoji;

    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    if(step.choices && step.choices.length){
        step.choices.forEach(choice=>{
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            const isDone = choice.puzzle ? gameState.completedPuzzles.includes(choice.puzzle) : false;
            if(isDone){ btn.disabled=true; btn.style.opacity='0.6'; btn.textContent += ' ✓'; }
            else{
                btn.addEventListener('click', ()=> handleChoice(choice));
            }
            choicesContainer.appendChild(btn);
        });
    } else {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = 'Далее →';
        btn.addEventListener('click', ()=>{
            const nextIndex = gameState.storyIndex+1;
            if(nextIndex < gameData.story.length) loadStory(nextIndex);
            else checkForVictory();
        });
        choicesContainer.appendChild(btn);
    }
}

// -------------------
// Обработка выбора
// -------------------
function handleChoice(choice){
    playClick();
    if(choice.puzzle) startPuzzle(choice.puzzle);
    else if(choice.next !== undefined) loadStory(choice.next);
    else {
        const nextIndex = gameState.storyIndex+1;
        if(nextIndex < gameData.story.length) loadStory(nextIndex);
        else checkForVictory();
    }
}

// -------------------
// Пазлы: запуск, проверка, подсказки
// -------------------
function startPuzzle(puzzleType){
    const puzzle = gameData.puzzles[puzzleType];
    if(!puzzle) return;
    gameState.activePuzzle = puzzleType;
    document.getElementById('puzzle-title').textContent = puzzle.title;
    document.getElementById('puzzle-description').textContent = puzzle.description;
    const body = document.getElementById('puzzle-body');
    body.innerHTML = puzzle.content;
    // сброс локальных подсказок для пазла
    if(!gameState.hintsUsed[puzzleType]) gameState.hintsUsed[puzzleType] = 0;
    if(puzzle.init) puzzle.init(body);
    showScreen('puzzle');
}

function checkPuzzle(){
    const puzzleType = gameState.activePuzzle;
    if(!puzzleType) return;
    const puzzle = gameData.puzzles[puzzleType];
    if(!puzzle || !puzzle.check) return;
    const ok = puzzle.check();
    if(ok){
        if(!gameState.completedPuzzles.includes(puzzleType)) gameState.completedPuzzles.push(puzzleType);
        updateProgress();
        playSuccess();
        setTimeout(()=>{
            showScreen('game');
            // ищем шаг с этим пазлом чтобы двигаться дальше по сюжету
            const idx = gameData.story.findIndex(s=>s.puzzle===puzzleType);
            if(idx!==-1 && idx+1 < gameData.story.length) loadStory(idx+1);
            else checkForVictory();
            gameState.activePuzzle = null;
            alert('Успех! Головоломка решена!');
        },200);
    } else {
        alert('Неправильно — попробуй ещё раз.');
    }
}

function showHint(){
    const p = gameState.activePuzzle;
    if(!p) { alert('Сначала открой испытание.'); return; }
    const puzzle = gameData.puzzles[p];
    if(!puzzle || !puzzle.hint) { alert('Подсказок нет.'); return; }
    gameState.hintsUsed[p] = (gameState.hintsUsed[p] || 0) + 1;
    const hintText = puzzle.hint(gameState.hintsUsed[p]);
    alert('Подсказка: ' + hintText);
}

// -------------------
// Прогресс и победа
// -------------------
function updateProgress(){
    const total = Object.keys(gameData.puzzles).length;
    const completed = gameState.completedPuzzles.length;
    const percent = total>0 ? Math.round((completed/total)*100) : 0;
    document.getElementById('progress-fill').style.width = percent+'%';
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('puzzles-completed').textContent = `${completed}/${total}`;
}

function checkForVictory(){
    const total = Object.keys(gameData.puzzles).length;
    const completed = gameState.completedPuzzles.length;
    if(total === 0) return;
    if(completed >= total) showVictory();
    else showScreen('game');
}

function showVictory(){
    const spent = gameState.startTime ? Date.now() - gameState.startTime : 0;
    const minutes = Math.floor(spent/60000), seconds = Math.floor((spent%60000)/1000);
    document.getElementById('completion-time').textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    updateProgress();
    showScreen('victory');
}

// -------------------
// Рестарт и помощь
// -------------------
function restartGame(){
    console.log('Перезапуск...');
    gameState.storyIndex = 0; gameState.completedPuzzles = []; gameState.activePuzzle = null; gameState.startTime = Date.now(); gameState.hintsUsed = {};
    document.getElementById('progress-fill').style.width = '0%'; document.getElementById('progress-percent').textContent = '0';
    document.getElementById('puzzles-completed').textContent = `0/${Object.keys(gameData.puzzles).length}`;
    document.getElementById('completion-time').textContent = '00:00';
    showScreen('loading');
    simulateLoading();
}

function showHelp(){
    alert('Привет! Это квест-головоломка для VK Mini Apps. Тебе предстоит восстановить три аспекта Простора: Дизайн, Музыку и Шоу. Используй подсказки и внимательность — удачи!');
}

// -------------------
// Поделиться (VK) — если доступно — иначе простое окно
// -------------------
async function shareResult(){
    const text = `${gameState.playerName} восстановил Простор в игре "Код Единства"!`;
    if(gameState.isVKApp && typeof vkBridge !== 'undefined') {
        try {
            await vkBridge.send('VKWebAppShare', {link: 'https://vk.com/app_link_placeholder', text });
        } catch(e){ alert('Не удалось поделиться через VK: '+e); }
    } else {
        prompt('Скопируй текст и поделись с друзьями:', text);
    }
}

// -------------------
// Данные игры: персонажи, сюжет и пазлы (логика и функции сохранены, но улучшены загадки и подсказки)
// -------------------
const gameData = {
    characters: {
        system: { name: 'СИСТЕМА', emoji: '⚡' },
        mentor: { name: 'НАСТАВНИК', emoji: '🧭' },
        design: { name: 'АСПЕКТ ДИЗАЙНА', emoji: '🎨' },
        music: { name: 'АСПЕКТ МУЗЫКИ', emoji: '🎵' },
        show: { name: 'АСПЕКТ ШОУ', emoji: '🎭' }
    },
    story: [
        { character:'system', text:'⚠️ Тревога: Простор теряет краски, ноты и свет. Стажер — ты наш последний шанс!', choices:[{text:'Принять вызов', next:1}] },
        { character:'mentor', text:'Я — Наставник. Три аспекта были разорены. Восстанови их, и Простор вновь объединится.', choices:[{text:'Слушаю команду', next:2}] },
        { character:'mentor', text:'С чего начнем? Выбери аспект, чтобы пройти испытание.', choices:[
            {text:'Дизайн 🎨', puzzle:'design'},
            {text:'Музыка 🎵', puzzle:'music'},
            {text:'Шоу 🎭', puzzle:'show'}
        ]},
        // Каждый аспект имеет два шага: подготовка (запуск пазла) и подтверждение восстановления
        { character:'design', text:'Я — Дизайн. Мои цвета перепутались. Восстанови радугу.', puzzle:'design', choices:[] },
        { character:'design', text:'Цвета вернулись — Дизайн восстановлен.', choices:[{text:'Вернуться к Наставнику', next:6}] },

        { character:'mentor', text:'Отлично. Выбери следующий аспект.', choices:[
            {text:'Музыка 🎵', puzzle:'music'},
            {text:'Шоу 🎭', puzzle:'show'}
        ]},
        { character:'music', text:'Я — Музыка. Мелодия памяти исчезла. Повтори её в точности.', puzzle:'music', choices:[] },
        { character:'music', text:'Ноты снова звучат — Музыка восстановлена.', choices:[{text:'Дальше', next:9}] },

        { character:'mentor', text:'Остался последний аспект — Шоу. Оно требует выбора истории.', choices:[{text:'К сценарию →', puzzle:'show'}] },
        { character:'show', text:'Я — Шоу. Выбери правильный сценарий — в нём искра Простора.', puzzle:'show', choices:[] },
        { character:'show', text:'Шоу вновь сияет — ты вернул единство!', choices:[{text:'Финал', next:11}] },

        { character:'mentor', text:'🎉 Ты восстановил все аспекты. Простор спасён. Поздравляем!', choices:[] }
    ],
    puzzles: {
        design: {
            title:'Испытание Дизайна',
            description:'Перетащи полоски так, чтобы они шли в порядке радуги (от красного до фиолетового).',
            content: `<div id="color-puzzle" class="color-puzzle" aria-label="Пазл цвета">
                <div class="cp-row" draggable="true" data-color="green">🟢 Зеленый</div>
                <div class="cp-row" draggable="true" data-color="yellow">🟡 Желтый</div>
                <div class="cp-row" draggable="true" data-color="blue">🔵 Синий</div>
                <div class="cp-row" draggable="true" data-color="red">🔴 Красный</div>
                <div class="cp-row" draggable="true" data-color="purple">🟣 Фиолетовый</div>
            </div>`,
            init: function(body){
                const cont = body.querySelector('#color-puzzle');
                let dragged = null;
                cont.querySelectorAll('.cp-row').forEach(item=>{
                    item.addEventListener('dragstart', e=>{ dragged = item; item.classList.add('dragging'); });
                    item.addEventListener('dragend', e=>{ dragged=null; item.classList.remove('dragging'); });
                    item.addEventListener('dragover', e=>{ e.preventDefault(); const after = getDragAfterElement(cont, e.clientY); if(after==null) cont.appendChild(dragged); else cont.insertBefore(dragged, after); });
                });
                // helper
                function getDragAfterElement(container,y){
                    const draggableElements = [...container.querySelectorAll('.cp-row:not(.dragging)')];
                    return draggableElements.reduce((closest, child)=>{
                        const box = child.getBoundingClientRect();
                        const offset = y - box.top - box.height/2;
                        if(offset < 0 && offset > closest.offset) return {offset, element: child};
                        return closest;
                    }, {offset: Number.NEGATIVE_INFINITY}).element || null;
                }
            },
            check: function(){
                const order = Array.from(document.querySelectorAll('#color-puzzle .cp-row')).map(el=>el.dataset.color);
                // правильный порядок: red, orange (we don't have orange so we use yellow), yellow, green, blue, purple — adapted to available items
                const target = ['red','yellow','green','blue','purple'];
                return JSON.stringify(order) === JSON.stringify(target);
            },
            hint: function(count){
                if(count===1) return 'Сначала должен быть 🔴 Красный.';
                return 'Подумай о порядке цветов радуги: красный — жёлтый — зелёный — синий — фиолетовый.';
            }
        },
        music: {
            title:'Испытание Музыки',
            description:'Повтори мелодию — последовательность нот из 5 кликов. Слушай аккуратно.',
            content: `<div id="music-puzzle" class="music-puzzle">
                <div id="melody-visual" class="melody-visual">🎶</div>
                <div class="music-buttons">
                    <button class="music-btn" data-note="1">🎵1</button>
                    <button class="music-btn" data-note="2">🎵2</button>
                    <button class="music-btn" data-note="3">🎵3</button>
                    <button class="music-btn" data-note="4">🎵4</button>
                </div>
                <div style="font-size:0.9rem;margin-top:10px;color:rgba(255,255,255,0.75)">Нажми кнопки, чтобы повторить мелодию.</div>
            </div>`,
            init: function(body){
                const buttons = body.querySelectorAll('.music-btn'); let input=[];
                // случайная "мелодия" — генерируем последовательность 5 нот
                const correct = Array.from({length:5}, ()=>String(Math.floor(Math.random()*4)+1));
                // визуальная демонстрация мелодии
                let i=0;
                const vis = body.querySelector('#melody-visual');
                vis.textContent = 'Слушай...';
                const showSeq = setInterval(()=>{
                    if(i>=correct.length){ clearInterval(showSeq); vis.textContent='Твоя очередь'; return; }
                    vis.textContent = '🎶 ' + correct[i];
                    i++;
                }, 550);
                // Сохранение корректной последовательности в data для проверки
                body.dataset.correct = JSON.stringify(correct);
                // обработчик кликов
                buttons.forEach(b=> b.addEventListener('click', ()=>{
                    input.push(b.dataset.note);
                    // краткая подсветка
                    b.animate([{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:120});
                    if(input.length === correct.length){
                        // сохраняем в глобальном месте для check() — используем temporary storage
                        body.dataset.player = JSON.stringify(input);
                        // даём пользователю возможность нажать "Проверить" или можно автопроверить — тут пусть проверяет вручную
                    }
                }));
            },
            check: function(){
                const body = document.getElementById('puzzle-body');
                const correct = JSON.parse(body.dataset.correct || '[]');
                const player = JSON.parse(body.dataset.player || '[]');
                if(!player || player.length !== correct.length) return false;
                return JSON.stringify(player) === JSON.stringify(correct);
            },
            hint: function(count){
                if(count===1) return 'Запомни порядок цифр при демонстрации — их ровно 5.';
                return 'Если сбился — попробуй ещё раз: сначала слушай, потом повторяй.';
            }
        },
        show: {
            title:'Испытание Шоу',
            description:'Выбери правильный сценарий — тот, который вернёт Простору искру.',
            content: `<div id="scenario-list" class="scenario-list">
                <button class="scenario-btn" data-correct="false">Герой отказывается от мечты и уходит.</button>
                <button class="scenario-btn" data-correct="true">Герой объединяет людей, и свет возвращается.</button>
                <button class="scenario-btn" data-correct="false">Герой разоружает сцену и разгоняет толпу.</button>
            </div>`,
            init: function(body){
                body.querySelectorAll('.scenario-btn').forEach(btn=>{
                    btn.addEventListener('click', ()=>{
                        if(btn.dataset.correct === 'true'){
                            // помечаем для проверки — мы можем сразу вызвать checkPuzzle()
                            body.dataset.choice = 'true';
                            // небольшая анимация и автопроверка
                            btn.animate([{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:160});
                            setTimeout(()=> checkPuzzle(), 220);
                        } else {
                            btn.animate([{opacity:1},{opacity:0.6},{opacity:1}],{duration:200});
                            alert('Нет — этот сценарий нарушает гармонию. Подумай ещё.');
                        }
                    });
                });
            },
            check: function(){ const body = document.getElementById('puzzle-body'); return body.dataset.choice === 'true'; },
            hint: function(count){ if(count===1) return 'Ищи сценарий, где герой НЕ разрушает и НЕ уходит.'; return 'Правильный сценарий объединяет людей и возвращает свет.'; }
        }
    }
};

// -------------------
// HUD для отладки (можно скрыть в production) — легкий прозрачный слой
// -------------------
const debugDiv = document.createElement('div');
debugDiv.style.position='fixed'; debugDiv.style.bottom='6px'; debugDiv.style.left='6px'; debugDiv.style.padding='6px 8px';
debugDiv.style.fontSize='11px'; debugDiv.style.color='rgba(255,255,255,0.8)'; debugDiv.style.fontFamily='monospace';
debugDiv.style.background='rgba(0,0,0,0.2)'; debugDiv.style.borderRadius='8px'; debugDiv.style.zIndex='9999';
document.body.appendChild(debugDiv);
function updateDebugHUD(){ debugDiv.textContent = `idx=${gameState.storyIndex} | active=${gameState.activePuzzle||'—'} | done=${gameState.completedPuzzles.length}/${Object.keys(gameData.puzzles).length}`; }
const _origLoadStory = loadStory;
loadStory = function(index){ _origLoadStory(index); updateDebugHUD(); console.log('LOAD STORY', index); };
const _origCheckForVictory = checkForVictory;
checkForVictory = function(){ _origCheckForVictory(); updateDebugHUD(); console.log('CHECK VICTORY'); };

// -------------------
// Старт
// -------------------
document.addEventListener('DOMContentLoaded', ()=>{ initGame(); updateDebugHUD(); });