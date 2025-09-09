// app.js (исправленная версия)

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
    
    // 1. Инициализация VK Bridge для Mini Apps (защищённо)
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
    
    // 2. Определяем платформу
    detectPlatform();
    
    // 3. Запускаем загрузку
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
    // Проверяем границы массива
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
    // Когда загружаем шаг истории, сбрасываем activePuzzle (если мы не на паззле)
    gameState.activePuzzle = storyStep.puzzle || null;
    
    updateStoryUI(storyStep);
    updateProgress();
    
    // Если в этом шаге есть головоломка (шаг истории содержит поле puzzle), запускаем её
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
                
                // Проверяем, пройдена ли уже эта головоломка
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
            // Кнопка "Далее" для обычных шагов
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = 'Далее →';
            button.addEventListener('click', () => {
                const nextIndex = gameState.storyIndex + 1;
                if (nextIndex < gameData.story.length) {
                    loadStory(nextIndex);
                } else {
                    // Достигнут конец истории - проверяем победу
                    checkForVictory();
                }
            });
            choicesContainer.appendChild(button);
        }
    }
}

function handleChoice(choice) {
    if (choice.puzzle) {
        // Запускаем паззл, пометив текущую активную головоломку
        startPuzzle(choice.puzzle);
    } else if (choice.next) {
        const nextIndex = gameData.story.findIndex(step => step.id === choice.next);
        if (nextIndex !== -1) {
            loadStory(nextIndex);
        } else {
            console.warn('Не найден шаг истории с id:', choice.next);
        }
    } else {
        // Просто переходим к следующему шагу
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
    
    // Установим активную головоломку — чтобы checkPuzzle работал независимо от storyIndex
    gameState.activePuzzle = puzzleType;
    
    document.getElementById('puzzle-title').textContent = puzzle.title;
    document.getElementById('puzzle-description').textContent = puzzle.description;
    
    const puzzleBody = document.getElementById('puzzle-body');
    if (puzzleBody) {
        puzzleBody.innerHTML = puzzle.content;
        
        // Навешиваем обработчики локально на только что созданные элементы внутри puzzleBody
        if (puzzle.init && typeof puzzle.init === 'function') {
            try {
                // Передаём puzzleBody для локального query, чтобы init мог использовать его
                puzzle.init(puzzleBody);
            } catch (e) {
                console.error('Ошибка при инициализации паззла:', e);
            }
        }
    }
    
    showScreen('puzzle');
}

function checkPuzzle() {
    // Определим тип паззла: сначала из activePuzzle, затем из текущего шага истории
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
                // Головоломка решена успешно
                if (!gameState.completedPuzzles.includes(puzzleType)) {
                    gameState.completedPuzzles.push(puzzleType);
                }
                
                updateProgress();
                // небольшая задержка перед возвратом на игровой экран
                setTimeout(() => {
                    showScreen('game');
                    
                    // Автоматически продвигаем историю до шага после того шага, который содержит этот puzzle (если есть)
                    const idx = gameData.story.findIndex(s => s.puzzle === puzzleType);
                    if (idx !== -1) {
                        const nextIdx = idx + 1;
                        if (nextIdx < gameData.story.length) {
                            loadStory(nextIdx);
                        } else {
                            // Если паззл был в самом конце — проверим победу
                            checkForVictory();
                        }
                    } else {
                        // Если соответствующего шага истории нет, просто остаёмся в игре и обновляем интерфейс
                        updateStoryUI(gameData.story[gameState.storyIndex]);
                    }
                    
                    // Сброс activePuzzle
                    gameState.activePuzzle = null;
                    
                    // Попросту уведомление о успехе
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
    
    // Защита: если нет паззлов, не показывать победу автоматически
    if (totalPuzzles === 0) {
        console.warn('totalPuzzles === 0 — пропускаем проверку победы');
        return;
    }
    
    // Показываем победу ТОЛЬКО если пройдены ВСЕ головоломки
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

function showHint() {
    alert('💡 Подсказка: Расставь цвета в порядке радуги!');
}

async function shareResult() {
    if (gameState.isVKApp) {
        try {
            await vkBridge.send('VKWebAppShare', {
                link: 'https://vk.com/apps?act=manage',
                title: 'Я прошел квест "Простор: Код Единства"!',
                text: `Я восстановил единство Простора за ${document.getElementById('completion-time').textContent}! 🎉`
            });
        } catch (error) {
            alert('Поделиться результатом: Я прошел квест "Простор: Код Единства"!');
        }
    } else {
        alert('Поделиться результатом: Я прошел квест "Простор: Код Единства"!');
    }
}

function restartGame() {
    gameState.storyIndex = 0;
    gameState.completedPuzzles = [];
    gameState.startTime = Date.now();
    gameState.activePuzzle = null;
    
    showScreen('game');
    loadStory(0);
    updateProgress();
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundBtn = document.querySelector('.sound-btn');
    const soundIcon = document.getElementById('sound-icon');
    
    if (soundBtn) {
        soundBtn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    }
    if (soundIcon) {
        soundIcon.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    }
}

function backToGame() {
    showScreen('game');
}

function showHelp() {
    alert('🎮 Управление:\n\n• Нажимайте на кнопки для выбора действий\n• Решайте головоломки чтобы продвигаться\n• Используйте меню для настроек');
}

// Данные игры (оставлены ваши — без изменений)
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
            text: 'ТРЕВОГА! Творческое ядро "Простора" атаковано вирусом "Критиком".',
            choices: []
        },
        {
            character: 'system',
            text: 'Система разобщена. Аспекты творчества отключены. Необходима немедленная перезагрузка.',
            choices: []
        },
        {
            character: 'mentor',
            text: 'Стажер, ты наш последний шанс. "Критик" убедил каждый Аспект, что он самодостаточен.',
            choices: []
        },
        {
            character: 'mentor',
            text: 'Тебе нужно восстановить связи между направлениями. Выбери, с чего начнем:',
            choices: [
                { text: 'Дизайн 🎨', puzzle: 'design' },
                { text: 'Музыка 🎵', puzzle: 'music' },
                { text: 'Шоу 🎭', puzzle: 'show' }
            ]
        },
        {
            character: 'design',
            text: 'Отлично! Я, Аспект Дизайна, жду твоего испытания!',
            puzzle: 'design',
            choices: []
        },
        {
            character: 'design',
            text: 'Потрясающе! Ты восстановил гармонию цвета. Я снова с вами!',
            choices: []
        },
        {
            character: 'mentor',
            text: 'Отлично! Один Аспект восстановлен. Выбери следующий:',
            choices: [
                { text: 'Музыка 🎵', puzzle: 'music' },
                { text: 'Шоу 🎭', puzzle: 'show' }
            ]
        },
        {
            character: 'music',
            text: 'Приветствую! Я, Аспект Музыки, готов к твоему испытанию!',
            puzzle: 'music',
            choices: []
        },
        {
            character: 'music',
            text: 'Великолепно! Ты восстановил гармонию звука. Я в строю!',
            choices: []
        },
        {
            character: 'mentor',
            text: 'Прекрасно! Остался последний Аспект. Вперед!',
            choices: [
                { text: 'Шоу 🎭', puzzle: 'show' }
            ]
        },
        {
            character: 'show',
            text: 'И вот мы встретились! Я, Аспект Шоу, жду твоего испытания!',
            puzzle: 'show',
            choices: []
        },
        {
            character: 'show',
            text: 'Браво! Ты восстановил искусство повествования. Я снова с вами!',
            choices: []
        },
        {
            character: 'mentor',
            text: 'Невероятно! Ты восстановил все аспекты творчества. "Простор" спасен!',
            choices: []
        }
    ],

    puzzles: {
        design: {
            title: 'Испытание Дизайна',
            description: 'Расставь цвета в порядке радуги',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <h3>🎨 Расставь цвета радуги</h3>
                    <p>Перетащи цвета в правильном порядке</p>
                    <div id="color-puzzle" style="display: flex; gap: 10px; justify-content: center; margin: 20px 0; flex-wrap: wrap;">
                        <div draggable="true" data-color="red" style="padding: 15px; background: #ff6b6b; border-radius: 10px; cursor: grab;">🔴 Красный</div>
                        <div draggable="true" data-color="orange" style="padding: 15px; background: #ffa502; border-radius: 10px; cursor: grab;">🟠 Оранжевый</div>
                        <div draggable="true" data-color="yellow" style="padding: 15px; background: #ffd700; border-radius: 10px; cursor: grab;">🟡 Желтый</div>
                        <div draggable="true" data-color="green" style="padding: 15px; background: #2ed573; border-radius: 10px; cursor: grab;">🟢 Зеленый</div>
                        <div draggable="true" data-color="blue" style="padding: 15px; background: #1e90ff; border-radius: 10px; cursor: grab;">🔵 Синий</div>
                    </div>
                    <p>Правильный порядок: Красный, Оранжевый, Желтый, Зеленый, Синий</p>
                </div>
            `,
            init: function(puzzleBody) {
                // Локальные селекторы внутри puzzleBody
                const puzzleContainer = puzzleBody.querySelector('#color-puzzle');
                if (!puzzleContainer) return;
                let draggedItem = null;
                
                puzzleContainer.querySelectorAll('[draggable="true"]').forEach(item => {
                    item.addEventListener('dragstart', function(e) {
                        draggedItem = this;
                        setTimeout(() => this.style.opacity = '0.5', 0);
                    });
                    
                    item.addEventListener('dragend', function() {
                        this.style.opacity = '1';
                        draggedItem = null;
                    });
                    
                    item.addEventListener('dragover', function(e) {
                        e.preventDefault();
                    });
                    
                    item.addEventListener('drop', function(e) {
                        e.preventDefault();
                        if (draggedItem && draggedItem !== this) {
                            const allItems = Array.from(puzzleContainer.children);
                            const thisIndex = allItems.indexOf(this);
                            const draggedIndex = allItems.indexOf(draggedItem);
                            
                            if (draggedIndex > thisIndex) {
                                puzzleContainer.insertBefore(draggedItem, this);
                            } else {
                                puzzleContainer.insertBefore(draggedItem, this.nextSibling);
                            }
                        }
                    });
                });
            },
            check: function() {
                const container = document.querySelector('#color-puzzle');
                if (!container) return false;
                const colors = Array.from(container.querySelectorAll('div'))
                    .map(item => item.getAttribute('data-color'));
                
                const correctOrder = ['red', 'orange', 'yellow', 'green', 'blue'];
                return JSON.stringify(colors) === JSON.stringify(correctOrder);
            }
        },
        music: {
            title: 'Испытание Музыки',
            description: 'Послушай и повтори мелодию',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <h3>🎵 Музыкальное испытание</h3>
                    <p>Нажми кнопки в правильной последовательности</p>
                    <div id="music-buttons" style="display: flex; gap: 10px; justify-content: center; margin: 20px 0; flex-wrap: wrap;">
                        <button class="music-btn" data-note="1" style="padding: 15px; background: #ff6b6b; border-radius: 10px; border: none; color: white;">🎵 1</button>
                        <button class="music-btn" data-note="2" style="padding: 15px; background: #ffa502; border-radius: 10px; border: none; color: white;">🎵 2</button>
                        <button class="music-btn" data-note="3" style="padding: 15px; background: #ffd700; border-radius: 10px; border: none; color: white;">🎵 3</button>
                    </div>
                    <p>Правильная последовательность: 1, 2, 3</p>
                </div>
            `,
            init: function(puzzleBody) {
                let sequence = [];
                const correctSequence = ['1', '2', '3'];
                const container = puzzleBody.querySelector('#music-buttons');
                if (!container) return;
                
                container.querySelectorAll('.music-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const note = this.getAttribute('data-note');
                        sequence.push(note);
                        
                        if (sequence.length === correctSequence.length) {
                            if (JSON.stringify(sequence) === JSON.stringify(correctSequence)) {
                                alert('Правильно! Мелодия восстановлена!');
                                // вызываем глобальную проверку
                                checkPuzzle();
                            } else {
                                alert('Неправильная последовательность! Попробуй еще раз.');
                                sequence = [];
                            }
                        }
                    });
                });
            },
            check: function() {
                // Для этого паззла мы используем эвентику в init — возвращаем true при вызове checkPuzzle по факту вызова
                return true;
            }
        },
        show: {
            title: 'Испытание Шоу',
            description: 'Выбери правильный сценарий',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <h3>🎭 Испытание Шоу</h3>
                    <p>Выбери правильный вариант развития событий</p>
                    <div id="scenario-list" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                        <button class="scenario-btn" data-correct="false" style="padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: none; color: white; text-align: left;">Герой сдается и уходит</button>
                        <button class="scenario-btn" data-correct="true" style="padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: none; color: white; text-align: left;">Герой находит решение и побеждает</button>
                        <button class="scenario-btn" data-correct="false" style="padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: none; color: white; text-align: left;">Герой злится и все ломает</button>
                    </div>
                </div>
            `,
            init: function(puzzleBody) {
                const container = puzzleBody.querySelector('#scenario-list');
                if (!container) return;
                container.querySelectorAll('.scenario-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const isCorrect = this.getAttribute('data-correct') === 'true';
                        if (isCorrect) {
                            alert('Правильно! Сценарий восстановлен!');
                            checkPuzzle();
                        } else {
                            alert('Неправильный выбор! Попробуй еще раз.');
                        }
                    });
                });
            },
            check: function() {
                return true;
            }
        }
    }
};

// Запускаем игру когда страница загрузится
document.addEventListener('DOMContentLoaded', function() {
    console.log('Документ загружен, запускаем игру...');
    initGame();
});
