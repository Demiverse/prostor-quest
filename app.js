// app.js (исправленная версия + отладка)

// Глобальные переменные
let gameState = {
    currentScreen: 'loading',
    storyIndex: 0,
    completedPuzzles: [],
    startTime: null,
    playerName: 'Стажер',
    soundEnabled: false,
    platform: 'web',
    isVKApp: false,
    activePuzzle: null // <- текущая открытая головоломка
};

// Основные функции
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
        } else {
            console.log('vkBridge не найден — работаем в вебе');
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
        document.body.classList.add('vk-app');
    } else {
        gameState.platform = 'web';
        if (badge) badge.textContent = 'Браузер';
        document.body.classList.remove('vk-app');
    }
}

function simulateLoading() {
    const progressBar = document.querySelector('.loading-progress');
    let progress = 0;
    
    const loadingInterval = setInterval(() => {
        progress += 2;
        if (progressBar) progressBar.style.width = Math.min(progress,100) + '%';
        
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
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screen = document.getElementById('screen-' + screenName);
    if (screen) {
        screen.classList.add('active');
        gameState.currentScreen = screenName;
    } else {
        console.warn('Экран не найден:', screenName);
    }
}

function loadStory(index) {
    if (!Array.isArray(gameData.story)) {
        console.error('gameData.story не определён или не массив');
        return;
    }
    if (index < 0 || index >= gameData.story.length) {
        console.error('Неверный индекс истории:', index);
        return;
    }
    
    const storyStep = gameData.story[index];
    gameState.storyIndex = index;
    gameState.activePuzzle = storyStep.puzzle || null;
    
    updateStoryUI(storyStep);
    updateProgress();
    
    if (storyStep.puzzle) {
        setTimeout(() => {
            startPuzzle(storyStep.puzzle);
        }, 300);
    }
}

function updateStoryUI(storyStep) {
    const character = gameData.characters[storyStep.character] || { name: 'СИСТЕМА', emoji: '⚡' };
    const characterImage = document.getElementById('character-image');
    const characterName = document.getElementById('character-name');
    const dialogText = document.getElementById('dialog-text');
    const choicesContainer = document.getElementById('choices-container');
    
    if (characterImage && character.emoji) {
        const emojiSpan = characterImage.querySelector('.character-emoji');
        if (emojiSpan) emojiSpan.textContent = character.emoji;
    }
    
    if (characterName) {
        characterName.textContent = character.name;
    }
    
    if (dialogText) {
        dialogText.textContent = storyStep.text || '';
    }
    
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        
        if (storyStep.choices && storyStep.choices.length > 0) {
            storyStep.choices.forEach(choice => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.textContent = choice.text;
                
                const isPuzzleCompleted = choice.puzzle ? 
                    gameState.completedPuzzles.includes(choice.puzzle) : false;
                
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
                if (nextIndex < gameData.story.length) {
                    loadStory(nextIndex);
                } else {
                    checkForVictory();
                }
            });
            choicesContainer.appendChild(button);
        }
    }
}

function handleChoice(choice) {
    if (choice.puzzle) {
        startPuzzle(choice.puzzle);
    } else if (choice.next) {
        const nextIndex = gameData.story.findIndex(step => step.id === choice.next);
        if (nextIndex !== -1) {
            loadStory(nextIndex);
        } else {
            console.warn('Не найден шаг истории с id:', choice.next);
        }
    } else {
        const nextIndex = gameState.storyIndex + 1;
        if (nextIndex < gameData.story.length) {
            loadStory(nextIndex);
        } else {
            checkForVictory();
        }
    }
}

function startPuzzle(puzzleType) {
    const puzzle = gameData.puzzles[puzzleType];
    if (!puzzle) {
        console.error('Головоломка не найдена:', puzzleType);
        return;
    }
    
    gameState.activePuzzle = puzzleType;
    
    document.getElementById('puzzle-title').textContent = puzzle.title;
    document.getElementById('puzzle-description').textContent = puzzle.description;
    
    const puzzleBody = document.getElementById('puzzle-body');
    if (puzzleBody) {
        puzzleBody.innerHTML = puzzle.content;
        if (puzzle.init && typeof puzzle.init === 'function') {
            try {
                puzzle.init(puzzleBody);
            } catch (e) {
                console.error('Ошибка при инициализации паззла:', e);
            }
        }
    }
    
    showScreen('puzzle');
}

function checkPuzzle() {
    const puzzleType = gameState.activePuzzle || (gameData.story[gameState.storyIndex] && gameData.story[gameState.storyIndex].puzzle);
    if (!puzzleType) {
        console.warn('Нет активной головоломки для проверки');
        return;
    }
    
    const puzzle = gameData.puzzles[puzzleType];
    if (puzzle && typeof puzzle.check === 'function') {
        try {
            const result = puzzle.check();
            if (result) {
                if (!gameState.completedPuzzles.includes(puzzleType)) {
                    gameState.completedPuzzles.push(puzzleType);
                }
                
                updateProgress();
                setTimeout(() => {
                    showScreen('game');
                    
                    const idx = gameData.story.findIndex(s => s.puzzle === puzzleType);
                    if (idx !== -1) {
                        const nextIdx = idx + 1;
                        if (nextIdx < gameData.story.length) {
                            loadStory(nextIdx);
                        } else {
                            checkForVictory();
                        }
                    } else {
                        updateStoryUI(gameData.story[gameState.storyIndex]);
                    }
                    
                    gameState.activePuzzle = null;
                    
                    try {
                        const successAudio = document.getElementById('success-sound');
                        if (successAudio && gameState.soundEnabled) successAudio.play();
                    } catch (e) {}
                    
                    alert('Успех! Головоломка решена!');
                }, 200);
            } else {
                alert('Попробуй еще раз!');
            }
        } catch (e) {
            console.error('Ошибка в проверке паззла:', e);
            alert('Ошибка при проверке головоломки. Посмотри консоль разработчика.');
        }
    } else {
        console.warn('Проверка головоломки недоступна для:', puzzleType);
    }
}

function updateProgress() {
    const totalPuzzles = Object.keys(gameData.puzzles || {}).length;
    const completed = gameState.completedPuzzles.length;
    const percent = totalPuzzles > 0 ? Math.round((completed / totalPuzzles) * 100) : 0;
    
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent;
}

function checkForVictory() {
    const totalPuzzles = Object.keys(gameData.puzzles || {}).length;
    const completed = gameState.completedPuzzles.length;
    
    console.log(`Проверка победы: ${completed}/${totalPuzzles} головоломок пройдено`);
    
    if (totalPuzzles === 0) {
        console.warn('totalPuzzles === 0 — пропускаем проверку победы');
        return;
    }
    
    if (completed >= totalPuzzles) {
        console.log('Все головоломки пройдены, показываем победу!');
        showVictory();
    } else {
        console.log('Еще не все головоломки пройдены, продолжаем игру');
        showScreen('game');
    }
}

function showVictory() {
    const timeSpent = (gameState.startTime ? Date.now() - gameState.startTime : 0);
    const minutes = Math.floor(timeSpent / 60000);
    const seconds = Math.floor((timeSpent % 60000) / 1000);
    
    const completionTimeEl = document.getElementById('completion-time');
    const puzzlesCompletedEl = document.getElementById('puzzles-completed');
    
    if (completionTimeEl) completionTimeEl.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (puzzlesCompletedEl) puzzlesCompletedEl.textContent = 
        `${gameState.completedPuzzles.length}/${Object.keys(gameData.puzzles || {}).length}`;
    
    showScreen('victory');
}

function showHint() { alert('💡 Подсказка: Расставь цвета в порядке радуги!'); }
async function shareResult() { alert('Поделиться результатом!'); }
function restartGame() { gameState.storyIndex = 0; gameState.completedPuzzles = []; gameState.startTime = Date.now(); gameState.activePuzzle = null; showScreen('game'); loadStory(0); updateProgress(); }
function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function toggleSound() { gameState.soundEnabled = !gameState.soundEnabled; }
function backToGame() { showScreen('game'); }
function showHelp() { alert('🎮 Управление:\n\n• Кнопки выбора\n• Решай паззлы\n• Меню для настроек'); }

// --- GameData ---
const gameData = { /* ... твои characters, story и puzzles как раньше ... */ };

// --- Запуск ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Документ загружен, запускаем игру...');
    initGame();
});

// --- ОТЛАДКА ---
const debugDiv = document.createElement("div");
debugDiv.id = "debug-info";
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
        `completed=${gameState.completedPuzzles.length}/${Object.keys(gameData.puzzles || {}).length}`;
}

const _origLoadStory = loadStory;
loadStory = function (index) {
    console.log("ЗАГРУЗКА СЮЖЕТА:", index, gameData.story[index]);
    _origLoadStory(index);
    updateDebugHUD();
};

const _origCheckForVictory = checkForVictory;
checkForVictory = function () {
    console.log("ПРОВЕРКА ПОБЕДЫ:", {
        completed: gameState.completedPuzzles.length,
        total: Object.keys(gameData.puzzles || {}).length,
        storyIndex: gameState.storyIndex,
    });
    _origCheckForVictory();
    updateDebugHUD();
};

document.addEventListener("DOMContentLoaded", updateDebugHUD);
