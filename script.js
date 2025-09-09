let progress = 0;
let collected = {};
let currentAspect = null;

// Загрузка
let loader = setInterval(() => {
  progress += 10;
  document.getElementById('progress').innerText = progress + '%';
  if (progress >= 100) {
    clearInterval(loader);
    showScreen('intro');
    startIntroDialog();
  }
}, 200);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Эффект набора текста (визуальная новелла)
function typeText(elementId, text, speed = 40) {
  let i = 0;
  let el = document.getElementById(elementId);
  el.innerText = "";
  let interval = setInterval(() => {
    el.innerText += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// Диалог вступления
function startIntroDialog() {
  typeText("dialog-text",
    "Я — Хранитель. Пять Аспектов ждут тебя. " +
    "Лишь собрав их вместе, ты сможешь зажечь Источник и противостоять Критику."
  );
}

// Аспекты (загадки)
const aspects = {
  form: {
    title: 'Аспект Формы',
    task: 'Какая фигура считается совершенной в геометрии?',
    puzzle: `<input type="text" id="answer" placeholder="Твой ответ">`,
    answer: 'круг'
  },
  sound: {
    title: 'Аспект Звука',
    task: 'Что из этого — не музыкальный жанр?',
    puzzle: `<select id="answer">
      <option>Рок</option>
      <option>Джаз</option>
      <option>Импрессионизм</option>
      <option>Хип-хоп</option>
    </select>`,
    answer: 'Импрессионизм'
  },
  narrative: {
    title: 'Аспект Нарратива',
    task: 'Что должно быть в начале истории?',
    puzzle: `<select id="answer">
      <option>Герой спасает мир</option>
      <option>Герой отправляется в путь</option>
      <option>Герой встречает врага</option>
    </select>`,
    answer: 'Герой отправляется в путь'
  },
  vision: {
    title: 'Аспект Видения',
    task: 'Сколько треугольников здесь? 🔺🔺🔺',
    puzzle: `<input type="number" id="answer" placeholder="Число">`,
    answer: '3'
  },
  will: {
    title: 'Аспект Воли',
    task: 'Что важнее всего для завершения любого проекта?',
    puzzle: `<select id="answer">
      <option>Идея</option>
      <option>Воля</option>
      <option>Инструменты</option>
    </select>`,
    answer: 'Воля'
  }
};

function enterAspect(aspect) {
  currentAspect = aspect;
  showScreen('aspect');
  document.getElementById('aspect-title').innerText = aspects[aspect].title;
  document.getElementById('aspect-task').innerText = aspects[aspect].task;
  document.getElementById('aspect-puzzle').innerHTML = aspects[aspect].puzzle;

  document.getElementById('aspect-submit').onclick = () => {
    let val = document.getElementById('answer').value.trim();
    if (val.toLowerCase() === aspects[aspect].answer.toLowerCase()) {
      completeAspect();
    } else {
      alert('Ответ неверный. Попробуй снова!');
    }
  };
}

function completeAspect() {
  collected[currentAspect] = true;
  document.getElementById(currentAspect).classList.add('completed');
  showScreen('map');
  if (Object.keys(collected).length === 5) {
    showScreen('final');
  }
}

function ending(choice) {
  showScreen('ending');
  if (choice === 'chaos') {
    document.getElementById('ending-title').innerText = 'Ты выбрал Хаос';
    document.getElementById('ending-text').innerText =
      'Мир распался. Ты стал Проводником хаоса. (🌑)';
  } else {
    document.getElementById('ending-title').innerText = 'Ты сохранил Единство';
    document.getElementById('ending-text').innerText =
      'Источник воссиял вновь. Ты стал Хранителем целого. (✨)';
  }
}
