// ==== Данные ====
const adminUser = { username: "admin", password: "12345" };
let currentUser = null;
let currentTestIndex = null;

// ==== Логин ====
function handleLogin() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (username === adminUser.username && password === adminUser.password) {
    currentUser = "admin";
    showAdminPanel();
    return;
  }

  const students = getStudents();
  const student = students.find(s => s.username === username && s.password === password);
  if (student) {
    currentUser = username;
    showStudentTests();
    return;
  }

  alert("Неверные данные для входа");
}

function logout() {
  currentUser = null;
  document.getElementById("auth").classList.remove("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("student-panel").classList.add("hidden");
  document.getElementById("student-tests").classList.add("hidden");
}

// ==== Управление студентами (только админ) ====
function getStudents() {
  return JSON.parse(localStorage.getItem("students")) || [];
}

function saveStudents(students) {
  localStorage.setItem("students", JSON.stringify(students));
}

function createStudent() {
  const login = document.getElementById("student-login").value;
  const pass = document.getElementById("student-pass").value;

  if (!login || !pass) {
    alert("Введите логин и пароль");
    return;
  }

  let students = getStudents();
  if (students.find(s => s.username === login)) {
    alert("Такой логин уже существует");
    return;
  }

  students.push({ username: login, password: pass });
  saveStudents(students);
  document.getElementById("student-login").value = "";
  document.getElementById("student-pass").value = "";
  loadStudents();
}

function loadStudents() {
  const students = getStudents();
  const list = document.getElementById("students-list");

  if (students.length === 0) {
    list.innerHTML = "<p>Студентов пока нет</p>";
    return;
  }

  list.innerHTML = "<h4>Список студентов:</h4>" + students.map(s => `
    <p>👤 ${s.username} / ${s.password}</p>
  `).join("");
}

// ==== Управление тестами (только админ) ====
function getTests() {
  return JSON.parse(localStorage.getItem("tests")) || [];
}

function saveTests(tests) {
  localStorage.setItem("tests", JSON.stringify(tests));
}

function createTest() {
  const title = document.getElementById("test-title").value;
  if (!title) {
    alert("Введите название теста");
    return;
  }

  let tests = getTests();
  tests.push({ title, questions: [] });
  saveTests(tests);

  document.getElementById("test-title").value = "";
  loadAdminTests();
}

function addQuestion(index) {
  const text = prompt("Введите текст вопроса:");
  if (!text) return;

  let answers = [];
  let answer;
  while ((answer = prompt("Введите вариант ответа (или пусто для завершения):"))) {
    answers.push(answer);
  }

  if (answers.length === 0) {
    alert("Добавьте хотя бы один вариант ответа");
    return;
  }

  const correct = parseInt(prompt("Введите номер правильного ответа (1-" + answers.length + "):")) - 1;
  if (isNaN(correct) || correct < 0 || correct >= answers.length) {
    alert("Неверный номер правильного ответа");
    return;
  }

  let tests = getTests();
  tests[index].questions.push({ text, answers, correct });
  saveTests(tests);
  loadAdminTests();
}

function loadAdminTests() {
  const tests = getTests();
  const list = document.getElementById("admin-tests-list");

  if (tests.length === 0) {
    list.innerHTML = "<p>Тестов пока нет</p>";
    return;
  }

  list.innerHTML = tests.map((t, i) => `
    <div>
      <b>${t.title}</b> (${t.questions.length} вопросов)
      <button onclick="addQuestion(${i})">Добавить вопрос</button>
    </div>
  `).join("");
}

// ==== Студенты ====
function showStudentTests() {
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("student-tests").classList.remove("hidden");
  loadTestList();
}

function loadTestList() {
  const tests = getTests();
  const list = document.getElementById("test-list");

  if (tests.length === 0) {
    list.innerHTML = "<p>Тестов пока нет</p>";
    return;
  }

  list.innerHTML = tests.map((t, i) => `
    <button onclick="startTest(${i})">${t.title}</button>
  `).join("");
}

function startTest(index) {
  currentTestIndex = index;
  document.getElementById("student-tests").classList.add("hidden");
  document.getElementById("student-panel").classList.remove("hidden");
  loadTest();
}

function backToMenu() {
  document.getElementById("student-panel").classList.add("hidden");
  document.getElementById("student-tests").classList.remove("hidden");
}

function loadTest() {
  const tests = getTests();
  const test = tests[currentTestIndex];
  const box = document.getElementById("test-box");
  document.getElementById("student-test-title").innerText = test.title;

  box.innerHTML = test.questions.map((q, i) => `
    <div class="question">
      <p><b>${i+1}. ${q.text}</b></p>
      ${q.answers.map((ans, idx) => `
        <label>
          <input type="radio" name="q${i}" value="${idx}" /> ${ans}
        </label><br>
      `).join("")}
    </div>
  `).join("");
}

function finishTest() {
  const tests = getTests();
  const test = tests[currentTestIndex];
  let score = 0;
  let reviewHTML = "";

  test.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const selectedIndex = selected ? parseInt(selected.value) : null;

    if (selectedIndex === q.correct) {
      score++;
    }

    reviewHTML += `<div class="student-question">`;
    reviewHTML += `<h3>${i + 1}. ${q.text}</h3>`;

    q.answers.forEach((ans, idx) => {
      let cssClass = "";
      if (idx === q.correct) cssClass = "correct";
      if (selectedIndex === idx && idx !== q.correct) cssClass = "incorrect";

      reviewHTML += `<p class="${cssClass}">${idx + 1}) ${ans}</p>`;
    });

    if (selectedIndex === null) {
      reviewHTML += `<p class="incorrect">Вы не выбрали ответ</p>`;
    }

    reviewHTML += `</div>`;
  });

  const resultBox = document.getElementById("test-result");
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `
    <h3>Ваш результат: ${score} из ${test.questions.length}</h3>
    <h4>Разбор ответов:</h4>
    ${reviewHTML}
  `;
}

// ==== Панель админа ====
function showAdminPanel() {
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("admin-panel").classList.remove("hidden");
  loadStudents();
  loadAdminTests();
}

// ==== Анти-скриншот защита ====
document.addEventListener("keydown", function(e) {
  if (
    e.key === "PrintScreen" ||
    (e.ctrlKey && e.key === "s") ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
    e.key === "F12"
  ) {
    e.preventDefault();
    alert("Скриншоты и сохранение запрещены!");
  }
});
let editingTestIndex = null; // в какой тест добавляем вопрос

function addQuestion(testIndex) {
  editingTestIndex = testIndex;
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("question-form").classList.remove("hidden");

  document.getElementById("question-text").value = "";
  document.getElementById("answers-box").innerHTML = "";
  addAnswerField();
  addAnswerField();
}

function addAnswerField() {
  const box = document.getElementById("answers-box");
  const id = Date.now();

  const div = document.createElement("div");
  div.className = "answer-item";
  div.innerHTML = `
    <input type="radio" name="correct" value="${id}" />
    <input type="text" placeholder="Вариант ответа" data-id="${id}" />
    <button onclick="this.parentElement.remove()">❌</button>
  `;
  box.appendChild(div);
}

function saveQuestion() {
  const questionText = document.getElementById("question-text").value.trim();
  if (!questionText) {
    alert("Введите текст вопроса");
    return;
  }

  const answersInputs = document.querySelectorAll("#answers-box input[type='text']");
  let answers = [];
  let ids = [];
  answersInputs.forEach(inp => {
    if (inp.value.trim()) {
      answers.push(inp.value.trim());
      ids.push(inp.dataset.id);
    }
  });

  if (answers.length < 2) {
    alert("Добавьте минимум два варианта ответа");
    return;
  }

  const correctRadio = document.querySelector("#answers-box input[type='radio']:checked");
  if (!correctRadio) {
    alert("Выберите правильный ответ");
    return;
  }

  const correctId = correctRadio.value;
  const correctIndex = ids.indexOf(correctId);

  let tests = getTests();
  tests[editingTestIndex].questions.push({
    text: questionText,
    answers,
    correct: correctIndex
  });
  saveTests(tests);

  cancelQuestion();
  loadAdminTests();
}

function cancelQuestion() {
  document.getElementById("question-form").classList.add("hidden");
  document.getElementById("admin-panel").classList.remove("hidden");
}

window.onblur = function() {
  const testPanel = document.getElementById("student-panel");
  if (!testPanel.classList.contains("hidden")) {
    testPanel.innerHTML += `<div class="warning">⚠ Вы покинули окно — тест может быть аннулирован!</div>`;
  }
};
