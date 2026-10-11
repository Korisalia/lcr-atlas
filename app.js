const countries = [
  { code: "mx", name: "Мексика", capital: "Мехико", region: "Мексика" },
  { code: "gt", name: "Гватемала", capital: "Гватемала", region: "Центральная Америка" },
  { code: "hn", name: "Гондурас", capital: "Тегусигальпа", region: "Центральная Америка" },
  { code: "sv", name: "Сальвадор", capital: "Сан-Сальвадор", region: "Центральная Америка" },
  { code: "ni", name: "Никарагуа", capital: "Манагуа", region: "Центральная Америка" },
  { code: "cr", name: "Коста-Рика", capital: "Сан-Хосе", region: "Центральная Америка" },
  { code: "pa", name: "Панама", capital: "Панама", region: "Центральная Америка" },
  { code: "cu", name: "Куба", capital: "Гавана", region: "Карибы" },
  { code: "do", name: "Доминиканская Республика", capital: "Санто-Доминго", region: "Карибы" },
  { code: "ht", name: "Гаити", capital: "Порт-о-Пренс", region: "Карибы" },
  { code: "ar", name: "Аргентина", capital: "Буэнос-Айрес", region: "Южная Америка" },
  { code: "bo", name: "Боливия", capital: "Сукре", note: "Правительство находится в Ла-Пасе", region: "Южная Америка" },
  { code: "br", name: "Бразилия", capital: "Бразилиа", region: "Южная Америка" },
  { code: "cl", name: "Чили", capital: "Сантьяго", region: "Южная Америка" },
  { code: "co", name: "Колумбия", capital: "Богота", region: "Южная Америка" },
  { code: "ec", name: "Эквадор", capital: "Кито", region: "Южная Америка" },
  { code: "py", name: "Парагвай", capital: "Асунсьон", region: "Южная Америка" },
  { code: "pe", name: "Перу", capital: "Лима", region: "Южная Америка" },
  { code: "uy", name: "Уругвай", capital: "Монтевидео", region: "Южная Америка" },
  { code: "ve", name: "Венесуэла", capital: "Каракас", region: "Южная Америка" },
];

const regions = ["Все", "Мексика", "Центральная Америка", "Карибы", "Южная Америка"];
const state = {
  mode: "mix",
  roundLength: 10,
  questions: [],
  questionIndex: 0,
  correct: 0,
  missed: new Set(),
  region: "Все",
};

const $ = (selector) => document.querySelector(selector);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const flagUrl = (country, size = "w320") => `https://flagcdn.com/${size}/${country.code}.png`;

function buildQuestion(country) {
  const kind = state.mode === "mix"
    ? ["flag", "capital", "capital"][Math.floor(Math.random() * 3)]
    : state.mode;

  if (kind === "flag") {
    const choices = shuffle([country, ...shuffle(countries.filter((item) => item.code !== country.code)).slice(0, 3)]);
    return {
      kind,
      country,
      prompt: "Какой стране принадлежит этот флаг?",
      answer: country.name,
      choices: choices.map((item) => item.name),
    };
  }

  const reverse = kind === "capital" && Math.random() > 0.68;
  if (reverse) {
    const choices = shuffle([country, ...shuffle(countries.filter((item) => item.code !== country.code)).slice(0, 3)]);
    return {
      kind,
      country,
      prompt: `Столица какой страны — ${country.capital}?`,
      answer: country.name,
      choices: choices.map((item) => item.name),
    };
  }

  const choices = shuffle([country.capital, ...shuffle(countries.filter((item) => item.code !== country.code)).slice(0, 3).map((item) => item.capital)]);
  return {
    kind,
    country,
    prompt: `Как называется столица страны «${country.name}»?`,
    answer: country.capital,
    choices,
  };
}

function startRound(pool = countries) {
  const roundCountries = shuffle(pool).slice(0, Math.min(state.roundLength, pool.length));
  state.questions = roundCountries.map(buildQuestion);
  state.questionIndex = 0;
  state.correct = 0;
  state.missed = new Set();
  $("#finishPanel").hidden = true;
  $("#questionPanel").hidden = false;
  $("#deckTitle").textContent = pool.length === countries.length ? "Тренировка" : "Повтор ошибок";
  renderQuestion();
}

function renderQuestion() {
  const question = state.questions[state.questionIndex];
  if (!question) return showResults();

  const position = state.questionIndex + 1;
  const percent = ((position - 1) / state.questions.length) * 100;
  $("#questionStatus").textContent = `${String(position).padStart(2, "0")} / ${String(state.questions.length).padStart(2, "0")}`;
  $("#progress").style.width = `${percent}%`;
  $("#score").textContent = String(state.correct).padStart(2, "0");
  $("#questionPrompt").textContent = question.prompt;
  $("#questionKind").textContent = question.kind === "flag" ? "ФЛАГ" : "СТОЛИЦЫ";
  $("#questionFlag").hidden = question.kind !== "flag";
  $("#questionFlag").src = question.kind === "flag" ? flagUrl(question.country) : "";
  $("#questionFlag").alt = `Флаг: ${question.country.name}`;
  $("#answerList").replaceChildren();
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#nextButton").hidden = true;

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.dataset.answer = choice;
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${choice}</span><span class="option-mark" aria-hidden="true"></span>`;
    button.addEventListener("click", () => submitAnswer(button, question));
    $("#answerList").append(button);
  });
}

function submitAnswer(selected, question) {
  const isCorrect = selected.dataset.answer === question.answer;
  const buttons = [...$("#answerList").querySelectorAll("button")];
  buttons.forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === question.answer) button.classList.add("is-correct");
  });

  if (isCorrect) {
    state.correct += 1;
    selected.classList.add("is-correct");
    $("#feedback").textContent = "Верно! Хорошая работа.";
    $("#feedback").className = "feedback is-correct";
  } else {
    state.missed.add(question.country.code);
    selected.classList.add("is-wrong");
    $("#feedback").textContent = `Правильный ответ: ${question.answer}${question.country.note ? ` · ${question.country.note}` : ""}`;
    $("#feedback").className = "feedback is-wrong";
  }

  $("#score").textContent = String(state.correct).padStart(2, "0");
  $("#progress").style.width = `${((state.questionIndex + 1) / state.questions.length) * 100}%`;
  $("#nextButton").hidden = false;
  $("#nextButton").textContent = state.questionIndex === state.questions.length - 1 ? "Итоги раунда" : "Дальше";
  $("#nextButton").focus();
}

function showResults() {
  $("#questionPanel").hidden = true;
  $("#finishPanel").hidden = false;
  $("#resultScore").textContent = `${state.correct} / ${state.questions.length}`;
  const missedCountries = countries.filter((country) => state.missed.has(country.code));
  $("#resultMessage").textContent = state.missed.size === 0
    ? "Без ошибок. Раунд пройден!"
    : `Ошибки — это план следующего раунда. Повтори ${state.missed.size} ${state.missed.size === 1 ? "страну" : "страны"}.`;
  $("#missedList").innerHTML = missedCountries.map((country) => `
    <li><img src="${flagUrl(country, "w40")}" alt=""><span>${country.name}</span><strong>${country.capital}</strong></li>
  `).join("");
  $("#repeatButton").hidden = missedCountries.length === 0;
  $("#progress").style.width = "100%";
}

function renderAtlas() {
  const query = $("#atlasSearch").value.trim().toLocaleLowerCase("ru");
  const visible = countries.filter((country) => {
    const matchesRegion = state.region === "Все" || country.region === state.region;
    const matchesQuery = `${country.name} ${country.capital} ${country.region}`.toLocaleLowerCase("ru").includes(query);
    return matchesRegion && matchesQuery;
  });
  $("#atlasCount").textContent = `${visible.length} ${visible.length === 1 ? "страна" : "стран"}`;
  $("#atlasList").innerHTML = visible.map((country, index) => `
    <article class="atlas-row">
      <span class="atlas-index">${String(index + 1).padStart(2, "0")}</span>
      <img class="atlas-flag" src="${flagUrl(country, "w80")}" alt="Флаг: ${country.name}" loading="lazy">
      <span class="atlas-country"><strong>${country.name}</strong><small>${country.region}</small></span>
      <span class="atlas-capital">${country.capital}${country.note ? `<small>${country.note}</small>` : ""}</span>
    </article>
  `).join("");
}

function setView(view) {
  const isAtlas = view === "atlas";
  $("#trainingView").hidden = isAtlas;
  $("#atlasView").hidden = !isAtlas;
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
    button.setAttribute("aria-current", button.dataset.view === view ? "page" : "false");
  });
  if (isAtlas) renderAtlas();
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
    startRound();
  });
});

document.querySelectorAll("[data-length]").forEach((button) => {
  button.addEventListener("click", () => {
    state.roundLength = Number(button.dataset.length);
    document.querySelectorAll("[data-length]").forEach((item) => item.classList.toggle("is-active", item === button));
    startRound();
  });
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-region]").forEach((button) => {
  button.addEventListener("click", () => {
    state.region = button.dataset.region;
    document.querySelectorAll("[data-region]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderAtlas();
  });
});

$("#nextButton").addEventListener("click", () => {
  state.questionIndex += 1;
  renderQuestion();
});
$("#restartButton").addEventListener("click", () => startRound());
$("#repeatButton").addEventListener("click", () => startRound(countries.filter((country) => state.missed.has(country.code))));
$("#atlasSearch").addEventListener("input", renderAtlas);

renderAtlas();
startRound();
