// script.js
let habits = JSON.parse(localStorage.getItem("habits")) || [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const screens = {
  main: document.getElementById("main-screen"),
  form: document.getElementById("form-screen"),
};

const iconsList = [
  "fa-glass-water",
  "fa-dumbbell",
  "fa-book",
  "fa-bed",
  "fa-person-walking",
  "fa-apple-whole",
  "fa-brain",
  "fa-pen-nib",
  "fa-mug-saucer",
  "fa-moon",
  "fa-sun",
  "fa-heart-pulse",
  "fa-medal",
  "fa-trophy",
  "fa-seedling",
];

function $(id) {
  return document.getElementById(id);
}

// ──────────────────────────────────────────────
// Переключение экранов
// ──────────────────────────────────────────────
function showScreen(name) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function deleteHabit(id) {
  if (!confirm("Вы уверены? Действие нельзя отменить.")) return;

  habits = habits.filter((h) => h.id !== id);
  saveAndRender();
}

// ──────────────────────────────────────────────
// Рендер списка привычек
// ──────────────────────────────────────────────
function renderHabits() {
  const container = $("habits-list");
  container.innerHTML = "";

  let todayDone = 0;

  habits.forEach((h) => {
    const card = document.createElement("div");
    card.className = "habit-card";
    card.innerHTML = `
      <div class="habit-icon" style="background:${h.color}20; color:${h.color}">
        <i class="fa-solid ${h.icon}"></i>
      </div>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        ${h.description ? `<div class="habit-desc">${h.description}</div>` : ""}
      </div>
      <div class="habit-check ${isDoneToday(h) ? "done" : ""}" data-id="${h.id}">
        <i class="fa-solid fa-check"></i>
      </div>
      <button class="habit-delete" data-id="${h.id}" title="Удалить привычку">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    // чекбокс
    card.querySelector(".habit-check").onclick = () => toggleHabit(h.id);

    // кнопка удаления
    card.querySelector(".habit-delete").onclick = () => {
      if (confirm(`Удалить привычку "${h.name}"?`)) {
        deleteHabit(h.id);
      }
    };

    container.appendChild(card);

    if (isDoneToday(h)) todayDone++;
  });

  // Статистика
  $("total-habits").textContent = habits.length;
  $("completion-today").textContent = habits.length
    ? Math.round((todayDone / habits.length) * 100) + "%"
    : "0%";
  $("streak-today").textContent = todayDone;

  renderMiniCalendar();
}

function isDoneToday(habit) {
  if (!habit.history) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return habit.history.includes(todayStr);
}

function toggleHabit(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;

  const today = new Date().toISOString().slice(0, 10);

  if (!habit.history) habit.history = [];
  const idx = habit.history.indexOf(today);

  if (idx === -1) {
    habit.history.push(today);
  } else {
    habit.history.splice(idx, 1);
  }

  saveAndRender();
}

// ──────────────────────────────────────────────
// Форма
// ──────────────────────────────────────────────
function initForm() {
  const iconsGrid = $("icons-grid");
  iconsGrid.innerHTML = "";

  iconsList.forEach((icon) => {
    const div = document.createElement("div");
    div.className = "icon-option";
    div.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    div.dataset.icon = icon;
    div.onclick = () => {
      iconsGrid
        .querySelectorAll(".icon-option")
        .forEach((el) => el.classList.remove("selected"));
      div.classList.add("selected");
    };
    iconsGrid.appendChild(div);
  });

  // дефолтная иконка
  iconsGrid.children[0]?.classList.add("selected");
}

function openFormForEdit(id = null) {
  $("form-title").textContent = id
    ? "Редактировать привычку"
    : "Новая привычка";
  $("edit-id").value = id || "";

  if (id) {
    const h = habits.find((x) => x.id === id);
    if (h) {
      $("name").value = h.name;
      $("description").value = h.description || "";
      $("color").value = h.color;
      $("reminder").value = h.reminder || "";

      const selectedIcon = [
        ...$("icons-grid").querySelectorAll(".icon-option"),
      ].find((el) => el.dataset.icon === h.icon);
      if (selectedIcon) {
        $("icons-grid")
          .querySelectorAll(".icon-option")
          .forEach((el) => el.classList.remove("selected"));
        selectedIcon.classList.add("selected");
      }
    }
  } else {
    $("habit-form").reset();
    $("color").value = "#4ade80";
    initForm(); // сброс иконок
  }

  showScreen("form");
}

// Сохранение формы
$("habit-form").onsubmit = (e) => {
  e.preventDefault();

  const id = $("edit-id").value;
  const name = $("name").value.trim();
  if (!name) return alert("Введите название привычки");

  const selectedIconEl = $("icons-grid").querySelector(".icon-option.selected");
  const icon = selectedIconEl ? selectedIconEl.dataset.icon : "fa-seedling";
  const color = $("color").value;
  const desc = $("description").value.trim();
  const remind = $("reminder").value;

  if (id) {
    // редактирование
    const habit = habits.find((h) => h.id === id);
    Object.assign(habit, {
      name,
      icon,
      color,
      description: desc,
      reminder: remind,
    });
  } else {
    // создание
    habits.push({
      id: Date.now().toString(),
      name,
      icon,
      color,
      description: desc,
      reminder: remind,
      history: [],
      created: new Date().toISOString(),
    });
  }

  saveAndRender();
  showScreen("main");
};

// ──────────────────────────────────────────────
// Мини-календарь
// ──────────────────────────────────────────────
function renderMiniCalendar() {
  const grid = $("calendar-grid");
  grid.innerHTML = "";

  // заголовки дней недели
  ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "day-name";
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startWeekday = (firstDay.getDay() || 7) - 1; // пн = 0

  // пустые клетки до 1-го числа
  for (let i = 0; i < startWeekday; i++) {
    grid.appendChild(document.createElement("div"));
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.textContent = d;

    if (dateStr === todayStr) dayEl.classList.add("today");

    // есть ли хоть одна отметка в этот день
    const hasCheck = habits.some((h) => h.history?.includes(dateStr));
    if (hasCheck) dayEl.classList.add("has-check");

    grid.appendChild(dayEl);
  }

  $("current-month-year").textContent = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(currentYear, currentMonth));
}

// ──────────────────────────────────────────────
// Навигация по месяцам
// ──────────────────────────────────────────────
$("prev-month").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderMiniCalendar();
};

$("next-month").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderMiniCalendar();
};

// ──────────────────────────────────────────────
// События
// ──────────────────────────────────────────────
$("btn-add").onclick = () => openFormForEdit();
$("btn-back").onclick = () => showScreen("main");
$("btn-cancel").onclick = () => showScreen("main");

function saveAndRender() {
  localStorage.setItem("habits", JSON.stringify(habits));
  renderHabits();
}

// Инициализация
initForm();
renderHabits();
