import "./style.css";
import * as engine from "./engine.js";
import { DAYS, CASE } from "./content.js";
import * as views from "./views.js";
import { sound } from "./audio.js";
const app = document.querySelector("#app");
const modal = document.createElement("dialog");
modal.className = "modal";
document.body.append(modal);
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.append(toast);
let state = engine.load(),
  screen = "menu",
  dialogue = [],
  modalType = null,
  previousFocus = null,
  introIndex = 0,
  introTimer = null,
  toastTimer = null,
  lastSaveFailed = false;
const ui = {
  paused: true,
  speed: 1,
  selection: [],
  call: null,
  tactic: null,
  tab: "dispatch",
};
const dialogueReady = fetch(views.asset("dialogue.json"))
  .then((r) => {
    if (!r.ok) throw Error("Dialogue unavailable");
    return r.json();
  })
  .then((d) => (dialogue = d))
  .catch(() => notify("Не удалось загрузить диалоги. Обновите страницу."));
function persist() {
  if (state) {
    const ok = engine.save(state);
    if (!ok && !lastSaveFailed)
      notify(
        "Сохранение недоступно: проверьте свободное место и настройки браузера.",
      );
    lastSaveFailed = !ok;
  }
}
function render() {
  const active = app.contains(document.activeElement)
    ? document.activeElement
    : null;
  let focusSelector = active?.dataset.action
    ? `[data-action="${CSS.escape(active.dataset.action)}"]`
    : null;
  if (focusSelector && active.dataset.id)
    focusSelector += `[data-id="${CSS.escape(active.dataset.id)}"]`;
  if (focusSelector && active.classList.contains("map-pin"))
    focusSelector += ".map-pin";
  if (focusSelector && active.classList.contains("call-card"))
    focusSelector += ".call-card";
  const scroll = [".dossier-body", ".dispatch-scroll"].map((selector) => {
    const el = app.querySelector(selector);
    return { selector, top: el?.scrollTop || 0, left: el?.scrollLeft || 0 };
  });
  const sameTab = app.dataset.tab === ui.tab;
  app.innerHTML = screen === "game" ? views.game(state, ui) : views.menu(state);
  app.dataset.tab = ui.tab;
  for (const item of scroll) {
    const el = app.querySelector(item.selector);
    if (el && (item.selector !== ".dossier-body" || sameTab)) {
      el.scrollTop = item.top;
      el.scrollLeft = item.left;
    }
  }
  if (focusSelector)
    app.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3800);
}
function openModal(html, type = "document", wide = false) {
  if (!modal.open) previousFocus = document.activeElement;
  modalType = type;
  modal.className = "modal" + (wide ? " wide" : "");
  modal.innerHTML = `${type === "intro" ? "" : '<button class="modal-x" data-action="close" aria-label="Закрыть">×</button>'}<div class="modal-content">${html}</div>`;
  if (!modal.open) modal.showModal();
}
function closeModal() {
  if (modalType === "ending") {
    modal.close();
    modalType = null;
    sound.stopVoice();
    screen = "menu";
    render();
    return;
  }
  if (modalType === "report") {
    closeReport();
    return;
  }
  if (modalType === "intro") {
    finishIntro();
    return;
  }
  sound.stopVoice();
  modal.close();
  modalType = null;
  previousFocus?.focus();
}
function briefing() {
  const d = dialogue.find((x) => x.id === "day-" + state.day);
  openModal(
    `<span class="file-label">${state.day + 1} СЕНТЯБРЯ 1991 · 08:00</span><h2>${DAYS[state.day - 1].headline}</h2><div class="brief-photo"><img src="${views.asset("art/harbor.svg")}" alt="Утренний порт Беллвезера"></div><p>${DAYS[state.day - 1].brief}</p>${d ? `<div class="dialogue-line"><b>${d.speaker}</b><p lang="en">“${d.en}”</p><p>${d.ru}</p></div>` : ""}<button class="primary full" data-action="close">На службу →</button>`,
    "brief",
  );
  if (d) sound.speak(d.id);
}
async function startGame(fresh = false) {
  sound.unlock();
  await dialogueReady;
  if (!dialogue.length) {
    notify("Не удалось загрузить диалоги. Обновите страницу.");
    return;
  }
  if (fresh) state = engine.freshGame();
  screen = "game";
  ui.paused = true;
  ui.selection = [];
  ui.call = engine.currentCalls(state)[0]?.id;
  ui.tactic = null;
  ui.tab = "dispatch";
  persist();
  sound.unlock();
  render();
  if (state.ended) showEnding();
  else briefing();
}
async function intro(startAfter = false) {
  sound.unlock();
  await dialogueReady;
  if (!dialogue.length) {
    notify("Не удалось загрузить диалоги. Обновите страницу.");
    return;
  }
  sound.unlock();
  sound.music("low-tide");
  introIndex = 0;
  modal.dataset.startAfter = String(startAfter);
  showIntroLine();
}
function showIntroLine() {
  const line = dialogue.filter((x) => x.id.startsWith("intro-"))[introIndex];
  if (!line) {
    finishIntro();
    return;
  }
  clearTimeout(introTimer);
  sound.stopVoice();
  openModal(
    `<div class="film" data-scene="${line.scene}"><img src="${views.asset("art/" + line.scene + ".svg")}" alt="${line.scene === "harbor" ? "Промышленный порт на рассвете" : line.scene === "phone" ? "Элиас разговаривает по телефону" : "Кабинет начальника полиции"}"><div class="film-vignette"></div><div class="film-header"><span>LOW WATER / ПРОЛОГ</span><button data-action="skip-intro">Пропустить →</button></div><div class="film-caption"><b>${line.speaker}</b><p lang="en">${line.en}</p><p class="subtitle">${line.ru}</p></div><div class="film-controls"><span>${String(introIndex + 1).padStart(2, "0")} / 06</span><button data-action="next-line">Далее →</button></div></div>`,
    "intro",
    true,
  );
  const expected = introIndex;
  const a = sound.speak(line.id, () => {
    if (modalType === "intro" && introIndex === expected) {
      introTimer = setTimeout(() => {
        introIndex++;
        showIntroLine();
      }, 1100);
    }
  });
  // Allow subtitles to complete the film if audio cannot load or autoplay is blocked.
  a.onerror = () => {
    introTimer = setTimeout(
      () => {
        if (modalType === "intro" && introIndex === expected) {
          introIndex++;
          showIntroLine();
        }
      },
      Math.max(6000, line.en.length * 60),
    );
  };
}
function finishIntro() {
  clearTimeout(introTimer);
  sound.stopVoice();
  modal.close();
  modalType = null;
  sound.music();
  if (modal.dataset.startAfter === "true") startGame(true);
}
function showEnding() {
  ui.paused = true;
  openModal(
    views.ending(
      state,
      dialogue.find((line) => line.id === "ending-" + state.ended),
    ),
    "ending",
  );
  sound.music("low-tide");
  sound.speak("ending-" + state.ended);
}
function closeReport() {
  modal.close();
  modalType = null;
  if (state.ended) showEnding();
  else {
    ui.call = engine.currentCalls(state)[0]?.id;
    ui.selection = [];
    ui.tactic = null;
    ui.tab = "dispatch";
    render();
    briefing();
  }
}
function selectedOne() {
  if (ui.selection.length !== 1)
    throw Error("Выберите одного свободного офицера.");
  return ui.selection[0];
}
function actions(action, id) {
  sound.fx("click");
  try {
    switch (action) {
      case "new":
        if (state) {
          openModal(
            '<span class="file-label">НОВАЯ ИСТОРИЯ</span><h2>Начать с первой смены?</h2><p>Текущее автосохранение будет заменено после вступления.</p><button class="primary full" data-action="confirm-new">Начать заново →</button><button class="secondary full spaced" data-action="close">Оставить текущую игру</button>',
          );
        } else intro(true);
        break;
      case "confirm-new":
        intro(true);
        break;
      case "continue":
        startGame();
        break;
      case "intro":
        intro();
        break;
      case "skip-intro":
        finishIntro();
        break;
      case "next-line":
        clearTimeout(introTimer);
        introIndex++;
        showIntroLine();
        break;
      case "settings":
        openModal(views.settings(sound.settings), "settings");
        break;
      case "close":
        closeModal();
        break;
      case "menu":
        clearTimeout(introTimer);
        sound.stopVoice();
        modal.close();
        modalType = null;
        ui.paused = true;
        screen = "menu";
        persist();
        render();
        break;
      case "pause":
        ui.paused = !ui.paused;
        render();
        break;
      case "speed":
        ui.speed = ui.speed === 1 ? 3 : 1;
        render();
        break;
      case "brief":
        briefing();
        break;
      case "call":
        ui.call = id;
        ui.tactic = null;
        ui.tab = "dispatch";
        ui.paused = true;
        sound.fx("paper");
        render();
        break;
      case "tab":
        ui.tab = id;
        ui.paused = true;
        render();
        break;
      case "officer": {
        const o = state.officers.find((o) => o.id === id);
        if (!o || o.busy || o.stamina < 20) break;
        if (ui.selection.includes(id))
          ui.selection = ui.selection.filter((x) => x !== id);
        else if (ui.selection.length < 3) ui.selection.push(id);
        else notify("В экипаже может быть не больше трёх офицеров.");
        render();
        break;
      }
      case "tactic":
        ui.tactic = id;
        render();
        break;
      case "dispatch":
        engine.dispatch(state, ui.call, ui.selection, ui.tactic);
        ui.selection = [];
        ui.call = null;
        ui.tactic = null;
        ui.paused = false;
        sound.fx("siren");
        persist();
        render();
        break;
      case "contract":
        engine.startContract(state, id, selectedOne());
        ui.selection = [];
        ui.paused = false;
        persist();
        render();
        break;
      case "investigate":
        engine.investigate(state, selectedOne());
        ui.selection = [];
        ui.paused = false;
        persist();
        render();
        break;
      case "deal":
        engine.takeDeal(state, id === "yes");
        persist();
        render();
        break;
      case "accuse":
        openModal(
          `<span class="file-label">ЗАПРОС ОРДЕРА</span><h2>${CASE.suspects.find((p) => p.id === id).name}</h2><p>Передать обвинение прокурору? На ошибочном ордере дело будет закрыто, доверие упадёт на 20 пунктов.</p><button class="primary full" data-action="confirm-accuse" data-id="${id}">Подписать ордер →</button><button class="secondary full spaced" data-action="close">Вернуться к уликам</button>`,
        );
        break;
      case "confirm-accuse":
        engine.accuse(state, id);
        closeModal();
        persist();
        render();
        break;
      case "journal":
        openModal(
          `<span class="file-label">СМЕНА ${state.day}</span><h2>Журнал дежурств</h2><div class="journal">${state.log.map((l) => `<div class="journal-line ${l.kind}"><small>Д${l.day} · ${String(Math.floor((480 + l.time) / 60)).padStart(2, "0")}:${String(l.time % 60).padStart(2, "0")}</small><p>${views.esc(l.text)}</p></div>`).join("") || "<p>Смена только начинается.</p>"}</div>`,
        );
        break;
      case "end": {
        const report = engine.endShift(state);
        ui.paused = true;
        persist();
        openModal(
          `<span class="file-label">СМЕНА ${report.day} ЗАВЕРШЕНА</span><h2>Сдать оружие.<br>Попробовать уснуть.</h2><p>Офицеры восстановят 45 пунктов сил. Зарплата начальника $900 уже зачислена.</p><div class="ending-stats"><span><b>${views.money(report.income)}</b>за эту смену</span><span><b>${report.trust}</b>доверие</span><span><b>${report.heat}</b>подозрения</span></div><p>В фонде Элиаса: <strong>${views.money(report.cash)}</strong> из $40 000.</p><button class="primary full" data-action="close">${state.ended ? "Последний паром" : "Следующее утро"} →</button>`,
          "report",
        );
        break;
      }
    }
  } catch (e) {
    notify(e.message);
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el && !el.disabled) actions(el.dataset.action, el.dataset.id);
});
document.addEventListener("input", (e) => {
  if (e.target.dataset.volume)
    sound.set(e.target.dataset.volume, Number(e.target.value));
});
modal.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea,select") || modal.open) return;
  if (screen !== "game") return;
  if (e.code === "Space") {
    e.preventDefault();
    actions("pause");
  } else if (/^[1-6]$/.test(e.key))
    actions("officer", state.officers[Number(e.key) - 1].id);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    ui.paused = true;
    persist();
    sound.suspend();
    if (screen === "game") render();
  } else sound.resume();
});
window.addEventListener("pagehide", persist);
setInterval(() => {
  if (
    screen !== "game" ||
    ui.paused ||
    modal.open ||
    state.ended ||
    document.hidden
  )
    return;
  const beforeCalls = engine.currentCalls(state).length,
    beforeLog = state.log.length;
  engine.advance(state, 4 * ui.speed);
  if (engine.currentCalls(state).length > beforeCalls) sound.fx("radio");
  if (state.log.length > beforeLog && state.log[0]?.kind === "good")
    sound.fx("success");
  if (state.log.length > beforeLog && state.log[0]?.kind === "bad")
    sound.fx("warning");
  if (engine.shiftReady(state)) {
    ui.paused = true;
    notify("Смена завершена. Подведите итоги в правом нижнем углу.");
  }
  ui.selection = ui.selection.filter((id) =>
    engine.available(state).some((o) => o.id === id),
  );
  persist();
  render();
}, 1000);
render();
