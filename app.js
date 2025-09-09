// app.js (финальная версия с исправленным сюжетом)

// -------------------
// Глобальное состояние
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
    activePuzzle: null
};

// -------------------
// Основные функции
// -------------------
async function initGame() {
    console.log('Инициализация игры...');
    try {
        if (typeof vkBridge !== 'undefined' && vkBridge) {
            await vkBridge.send('VKWebAppInit');
            gameState.isVKApp = true;
            console.log('VK Bridge инициализирован');
            try {
                const userInfo = await vkBridge.send('VKWebAppGetUserInfo');
                if (userInfo && userInfo.first_name) gameState.playerName = userInfo.first_name;
            } catch (e) {
                console.warn('Не удалось получить информацию о пользователе (VK):', e);
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации VK Bridge:', error);
    }

    detectPlatform();
    simulateLoading();
}

function detectPlatform() {
    const badge = document.getElementById('platform-badge');
    if (gameState.isVKApp) {
        gameState.platform = 'vk_app';
        if (badge) badge.textContent = 'VK Mini App';
    } else {
        gameState.platform = 'web';
        if (badge) badge.textContent = 'Браузер';
    }
}

function simulateLoading() {
    const progressBar = document.querySelector('.loading-progress');
    let progress = 0;

    const loadingInterval = setInterval(() => {
        progress += 2;
        if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';

        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                gameState.startTime = Date.now();
                showScreen('game');
                loadStory(0);
            }, 500);
        }
    }, 50);
}

function showScreen(screenName) {
    console.log("Переключение на экран:", screenName);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenName);
    if (screen) {
        screen.classList.add('active');
        gameState.currentScreen = screenName;
    }
}

function loadStory(index) {
    if (!Array.isArray(gameData.story)) return;
    if (index < 0 || index >= gameData.story.length) return;

    const storyStep = gameData.story[index];
    gameState.storyIndex = index;
    gameState.activePuzzle = storyStep.puzzle || null;

    updateStoryUI(storyStep);
    updateProgress();

    if (storyStep.puzzle) {
        setTimeout(() => startPuzzle(storyStep.puzzle), 300);
    }
}

function updateStoryUI(storyStep) {
    const character = gameData.characters[storyStep.character] || { name: 'СИСТЕМА', emoji: '⚡' };
    document.getElementById('character-name').textContent = character.name;
    document.getElementById('dialog-text').textContent = storyStep.text || '';
    const emojiSpan = document.querySelector('#character-image .character-emoji');
    if (emojiSpan) emojiSpan.textContent = character.emoji;

    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';

    if (storyStep.choices && storyStep.choices.length > 0) {
        storyStep.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;

            const isPuzzleCompleted = choice.puzzle ? gameState.completedPuzzles.includes(choice.puzzle) : false;
            if (isPuzzleCompleted) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.textContent += ' ✓';
            } else {
                button.addEventListener('click', () => handleChoice(choice));
            }

            choicesContainer.appendChild(button);
        });
    } else {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = 'Далее →';
        button.addEventListener('click', () => {
            const nextIndex = gameState.storyIndex + 1;
            if (nextIndex < gameData.story.length) loadStory(nextIndex);
            else checkForVictory();
        });
        choicesContainer.appendChild(button);
    }
}

function handleChoice(choice) {
    if (choice.puzzle) {
        startPuzzle(choice.puzzle);
    } else if (choice.next !== undefined) {
        loadStory(choice.next);
    } else {
        const nextIndex = gameState.storyIndex + 1;
        if (nextIndex < gameData.story.length) loadStory(nextIndex);
        else checkForVictory();
    }
}

function startPuzzle(puzzleType) {
    const puzzle = gameData.puzzles[puzzleType];
    if (!puzzle) return;
    gameState.activePuzzle = puzzleType;

    document.getElementById('puzzle-title').textContent = puzzle.title;
    document.getElementById('puzzle-description').textContent = puzzle.description;
    const puzzleBody = document.getElementById('puzzle-body');
    puzzleBody.innerHTML = puzzle.content;

    if (puzzle.init) puzzle.init(puzzleBody);
    showScreen('puzzle');
}

function checkPuzzle() {
    const puzzleType = gameState.activePuzzle;
    if (!puzzleType) return;
    const puzzle = gameData.puzzles[puzzleType];
    if (!puzzle || !puzzle.check) return;

    const result = puzzle.check();
    if (result) {
        if (!gameState.completedPuzzles.includes(puzzleType)) {
            gameState.completedPuzzles.push(puzzleType);
        }
        updateProgress();
        setTimeout(() => {
            showScreen('game');
            const idx = gameData.story.findIndex(s => s.puzzle === puzzleType);
            if (idx !== -1 && idx + 1 < gameData.story.length) loadStory(idx + 1);
            else checkForVictory();
            gameState.activePuzzle = null;
            alert('Успех! Головоломка решена!');
        }, 200);
    } else {
        alert('Попробуй еще раз!');
    }
}

function updateProgress() {
    const totalPuzzles = Object.keys(gameData.puzzles || {}).length;
    const completed = gameState.completedPuzzles.length;
    const percent = totalPuzzles > 0 ? Math.round((completed / totalPuzzles) * 100) : 0;

    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent;

    // обновляем на экране победы
    document.getElementById('puzzles-completed').textContent = `${completed}/${totalPuzzles}`;
}

function checkForVictory() {
    const totalPuzzles = Object.keys(gameData.puzzles || {}).length;
    const completed = gameState.completedPuzzles.length;
    console.log("ПРОВЕРКА ПОБЕДЫ:", { completed, total: totalPuzzles, storyIndex: gameState.storyIndex });

    if (totalPuzzles === 0) return;
    if (completed >= totalPuzzles) showVictory();
    else showScreen('game');
}

function showVictory() {
    const timeSpent = (gameState.startTime ? Date.now() - gameState.startTime : 0);
    const minutes = Math.floor(timeSpent / 60000);
    const seconds = Math.floor((timeSpent % 60000) / 1000);

    document.getElementById('completion-time').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    updateProgress(); // чтобы puzzles-completed было точным

    showScreen('victory');
}

// -------------------
// Рестарт игры
// -------------------
function restartGame() {
    console.log("🔄 Перезапуск игры...");

    // сбрасываем состояние
    gameState.storyIndex = 0;
    gameState.completedPuzzles = [];
    gameState.activePuzzle = null;
    gameState.startTime = Date.now();

    // сброс прогресса
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-percent').textContent = '0';
    document.getElementById('puzzles-completed').textContent = `0/${Object.keys(gameData.puzzles).length}`;
    document.getElementById('completion-time').textContent = '00:00';

    // показываем загрузочный экран
    showScreen('loading');

    // сброс полоски загрузки
    const progressBar = document.querySelector('.loading-progress');
    if (progressBar) progressBar.style.width = '0%';

    simulateLoading();
}

// -------------------
// Данные игры
// -------------------
const gameData = {
    characters: {
        system: { name: 'СИСТЕМА', emoji: '⚡' },
        mentor: { name: 'НАСТАВНИК', emoji: '👨‍💼' },
        design: { name: 'АСПЕКТ ДИЗАЙНА', emoji: '🎨' },
        music: { name: 'АСПЕКТ МУЗЫКИ', emoji: '🎵' },
        show: { name: 'АСПЕКТ ШОУ', emoji: '🎭' }
    },
    story: [
        { 
            character: 'system', 
            text: '⚠️ ТРЕВОГА! Творческое ядро атаковано.', 
            choices: [{ text: "Продолжить", next: 1 }] 
        },
        { 
            character: 'mentor', 
            text: 'Стажер, ты наш последний шанс восстановить Простор!', 
            choices: [{ text: "Я готов!", next: 2 }] 
        },
        { 
            character: 'mentor', 
            text: 'С чего начнём?', 
            choices: [
                { text: 'Дизайн 🎨', puzzle: 'design' },
                { text: 'Музыка 🎵', puzzle: 'music' },
                { text: 'Шоу 🎭', puzzle: 'show' }
            ] 
        },

        { character: 'design', text: 'Я, Аспект Дизайна, жду твоего испытания!', puzzle: 'design', choices: [] },
        { character: 'design', text: 'Потрясающе! Я снова с вами!', choices: [{ text: "Дальше", next: 5 }] },

        { character: 'mentor', text: 'Выбери следующий аспект:', choices: [
            { text: 'Музыка 🎵', puzzle: 'music' },
            { text: 'Шоу 🎭', puzzle: 'show' }
        ]},
        { character: 'music', text: 'Я, Аспект Музыки, готов к испытанию!', puzzle: 'music', choices: [] },
        { character: 'music', text: 'Великолепно! Я в строю!', choices: [{ text: "Дальше", next: 8 }] },

        { character: 'mentor', text: 'Остался последний аспект — Шоу!', choices: [{ text: 'Перейти к Шоу 🎭', puzzle: 'show' }] },
        { character: 'show', text: 'Я, Аспект Шоу, жду испытания!', puzzle: 'show', choices: [] },
        { character: 'show', text: 'Браво! Я снова с вами!', choices: [{ text: "Финал", next: 11 }] },

        { character: 'mentor', text: '🎉 Ты восстановил все аспекты творчества! Простор спасён!', choices: [] }
    ],
    puzzles: {
        design: {
            title: 'Испытание Дизайна',
            description: 'Расставь цвета в порядке радуги',
            content: `<div id="color-puzzle">
                <div draggable="true" data-color="red">🔴 Красный</div>
                <div draggable="true" data-color="orange">🟠 Оранжевый</div>
                <div draggable="true" data-color="yellow">🟡 Желтый</div>
                <div draggable="true" data-color="green">🟢 Зеленый</div>
                <div draggable="true" data-color="blue">🔵 Синий</div>
            </div>`,
            init: function(body) {
                const cont = body.querySelector('#color-puzzle');
                let dragged = null;
                cont.querySelectorAll('[draggable="true"]').forEach(item => {
                    item.addEventListener('dragstart', () => { dragged = item; });
                    item.addEventListener('drop', e => {
                        e.preventDefault();
                        if (dragged && dragged !== item) cont.insertBefore(dragged, item);
                    });
                    item.addEventListener('dragover', e => e.preventDefault());
                });
            },
            check: function() {
                const colors = Array.from(document.querySelectorAll('#color-puzzle [data-color]'))
                    .map(el => el.dataset.color);
                return JSON.stringify(colors) === JSON.stringify(['red','orange','yellow','green','blue']);
            }
        },
        music: {
            title: 'Испытание Музыки',
            description: 'Повтори мелодию',
            content: `<div id="music-buttons">
                <button class="music-btn" data-note="1">🎵1</button>
                <button class="music-btn" data-note="2">🎵2</button>
                <button class="music-btn" data-note="3">🎵3</button>
            </div>`,
            init: function(body) {
                let seq = [];
                const correct = ['1','2','3'];
                body.querySelectorAll('.music-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        seq.push(btn.dataset.note);
                        if (seq.length === correct.length) {
                            if (JSON.stringify(seq) === JSON.stringify(correct)) checkPuzzle();
                            else { alert('Неправильно!'); seq=[]; }
                        }
                    });
                });
            },
            check: () => true
        },
        show: {
            title: 'Испытание Шоу',
            description: 'Выбери правильный сценарий',
            content: `<div id="scenario-list">
                <button class="scenario-btn" data-correct="false">Герой сдается</button>
                <button class="scenario-btn" data-correct="true">Герой побеждает</button>
                <button class="scenario-btn" data-correct="false">Герой ломает всё</button>
            </div>`,
            init: function(body) {
                body.querySelectorAll('.scenario-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.dataset.correct === "true") checkPuzzle();
                        else alert('Попробуй еще раз');
                    });
                });
            },
            check: () => true
        }
    }
};

// -------------------
// Отладочный HUD
// -------------------
const debugDiv = document.createElement("div");
debugDiv.style.position = "fixed";
debugDiv.style.bottom = "0";
debugDiv.style.left = "0";
debugDiv.style.right = "0";
debugDiv.style.background = "rgba(0,0,0,0.7)";
debugDiv.style.color = "lime";
debugDiv.style.fontSize = "12px";
debugDiv.style.fontFamily = "monospace";
debugDiv.style.padding = "4px 8px";
debugDiv.style.zIndex = "9999";
document.body.appendChild(debugDiv);

function updateDebugHUD() {
    debugDiv.textContent =
        `storyIndex=${gameState.storyIndex} | ` +
        `activePuzzle=${gameState.activePuzzle || "—"} | ` +
        `completed=${gameState.completedPuzzles.length}/${Object.keys(gameData.puzzles).length}`;
}

const _origLoadStory = loadStory;
loadStory = function(index) {
    console.log("ЗАГРУЗКА СЮЖЕТА:", index, gameData.story[index]);
    _origLoadStory(index);
    updateDebugHUD();
};

const _origCheckForVictory = checkForVictory;
checkForVictory = function() {
    console.log("ПРОВЕРКА ПОБЕДЫ:", {
        completed: gameState.completedPuzzles.length,
        total: Object.keys(gameData.puzzles).length,
        storyIndex: gameState.storyIndex
    });
    _origCheckForVictory();
    updateDebugHUD();
};

document.addEventListener("DOMContentLoaded", () => {
    console.log('Документ загружен, запускаем игру...');
    initGame();
    updateDebugHUD();
});
