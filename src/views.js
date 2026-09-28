import { DAYS, GOAL, TACTICS, CONTRACTS, CASE } from "./content.js";
import { clock, currentCalls, chance, shiftReady } from "./engine.js";
export const asset = (p) => import.meta.env.BASE_URL + "assets/" + p;
export const money = (n) => "$" + n.toLocaleString("en-US");
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pic = (id, cls = "") =>
  `<img class="${cls}" src="${asset("art/" + id + ".svg")}" alt="">`;
const bar = (n, cls = "") =>
  `<span class="meter ${cls}"><i style="width:${Math.min(100, n)}%"></i></span>`;
export function menu(saved) {
  return `<main class="menu"><div class="menu-art">${pic("harbor")}</div><div class="menu-shade"></div><div class="menu-top"><span>BELLWETHER POLICE DEPARTMENT</span><span>EST. 1924</span></div><section class="menu-copy"><span class="edition">A POLICE STORY IN SEVEN SHIFTS</span><h1>LOW<br>WATER<span>НИЗКАЯ ВОДА</span></h1><p>Семь дней, чтобы спасти брата.<br>Целый город, чтобы потерять себя.</p><div class="menu-actions">${saved ? '<button class="primary" data-action="continue">Продолжить смену <span>↗</span></button>' : ""}<button class="${saved ? "ghost" : "primary"}" data-action="new">${saved ? "Начать заново" : "Начать историю"} <span>→</span></button><button class="ghost" data-action="intro">Вступительный ролик <span>▷</span></button><button class="ghost" data-action="settings">Звук и управление <span>☷</span></button></div></section><footer class="menu-bottom"><span>SEPTEMBER 1991 · BELLWETHER, NORTH COAST</span><span>Оригинальная история · EN voices / RU subtitles</span></footer></main>`;
}
function header(s, paused, speed) {
  return `<header class="topbar"><button class="wordmark" data-action="menu" title="В главное меню">LOW WATER<span>BELLWETHER P.D.</span></button><div class="shift-heading"><span>СМЕНА ${String(s.day).padStart(2, "0")} / 07</span><strong>${DAYS[s.day - 1].title}</strong></div><div class="top-stat"><span>ФОНД СПАСЕНИЯ</span><b>${money(s.cash)} <small>/ 40 000</small></b>${bar((s.cash / GOAL) * 100, "gold")}</div><div class="top-stat compact"><span>ДОВЕРИЕ</span><b>${s.trust}<small> / 100</small></b>${bar(s.trust)}</div><div class="top-stat compact"><span>ПОДОЗРЕНИЯ</span><b>${s.heat}<small> / 100</small></b>${bar(s.heat, "red")}</div><button class="icon-button" data-action="settings" aria-label="Звук и управление">☷</button></header><nav class="commandbar"><div><span class="live-dot ${paused ? "off" : ""}"></span><b id="clock">${clock(s)}</b><span>${DAYS[s.day - 1].weather}</span></div><div class="time-controls"><button data-action="pause" aria-label="${paused ? "Продолжить время" : "Пауза"}" class="${paused ? "active" : ""}">${paused ? "▶ Продолжить" : "Ⅱ Пауза"}</button><button data-action="speed" class="${speed === 3 ? "active" : ""}">${speed}×</button><span class="keyboard-hint">SPACE — пауза</span></div><button data-action="brief" class="text-button">Утренний брифинг ↗</button></nav>`;
}
function map(s, selected) {
  const calls = currentCalls(s);
  return `<section class="city-panel" aria-label="Карта города"><div class="map-caption"><span>ОПЕРАТИВНАЯ КАРТА</span><strong>BELLWETHER</strong><small>СЕКТОР 04 · СЕВЕРНОЕ ПОБЕРЕЖЬЕ</small></div><div class="map-stage">${pic("city", "city-art")}<div class="district" style="left:23%;top:47%">OLD QUARTER</div><div class="district" style="left:59%;top:22%">NORTH DOCKS</div><div class="district" style="left:44%;top:68%">FREIGHT YARD</div>${calls.map((c, i) => `<button class="map-pin ${c.id === selected ? "selected" : ""}" data-action="call" data-id="${c.id}" style="left:${c.x}%;top:${c.y}%" aria-label="${c.title}"><span>${String(i + 1).padStart(2, "0")}</span><em>${c.title}</em></button>`).join("")}${s.jobs
    .filter((j) => j.type === "call")
    .map(
      (j) =>
        `<div class="unit-marker" style="left:${j.call.x}%;top:${j.call.y}%">▰ <span>ЭКИПАЖ · ${j.end - s.time} м</span></div>`,
    )
    .join(
      "",
    )}<div class="station-pin" style="left:48%;top:50%">★<small>УЧАСТОК</small></div></div><div class="map-bottom"><span><i class="legend-dot"></i> Вызов <i class="legend-dot blue"></i> Экипаж</span><span>${s.jobs.length} ЭКИПАЖЕЙ НА ЗАДАНИИ</span></div></section>`;
}
function callList(s, selected) {
  const calls = currentCalls(s);
  return `<aside class="dispatch-panel"><div class="panel-heading"><h2>Диспетчерская</h2><span class="count">${calls.length.toString().padStart(2, "0")}</span></div><div class="dispatch-scroll">${calls.length ? calls.map((c, i) => `<button class="call-card ${selected === c.id ? "selected" : ""}" data-action="call" data-id="${c.id}"><span class="call-meta">КОД ${c.type === "force" ? "10-31" : c.type === "talk" ? "10-16" : "10-66"} <em>${c.deadline - s.time} мин</em></span><strong>${c.title}</strong><span>${c.place}</span><div class="call-bottom"><span>${c.difficulty >= 130 ? "Высокий риск" : "Средний риск"}</span><b>↗</b></div></button>`).join("") : `<div class="quiet-state"><span>◌</span><h3>Линия свободна</h3><p>Экипажи на связи. Новые вызовы появятся в течение смены.</p></div>`}${s.jobs.length ? `<h3 class="subheading">На задании</h3>${s.jobs.map((j) => `<div class="job-row"><span>${esc(j.call?.title || j.contract?.title || "Проверка счетов")}</span><b>${Math.max(0, j.end - s.time)} м</b></div>`).join("")}` : ""}</div><div class="radio-strip"><span class="waveform">▂▅▃▇▂▄▆▃▂</span><div><b>DISPATCH / 104.2</b><small>Беллвезер, приём.</small></div></div></aside>`;
}
function roster(s, selection) {
  return `<section class="roster-panel"><div class="panel-heading"><h2>Личный состав <small>Смена A</small></h2><span>Выберите офицеров → отправьте на вызов</span></div><div class="officers">${s.officers.map((o) => `<button class="officer ${selection.includes(o.id) ? "selected" : ""} ${o.busy ? "busy" : ""}" data-action="officer" data-id="${o.id}" ${o.busy || o.stamina < 20 ? "disabled" : ""} aria-pressed="${selection.includes(o.id)}"><div class="portrait">${pic(o.id)}<span class="officer-status">${o.busy ? "НА ЗАДАНИИ" : o.stamina < 20 ? "ОТДЫХ" : "НА СВЯЗИ"}</span><span class="select-check">${selection.includes(o.id) ? "✓" : "+"}</span></div><div class="officer-info"><strong>${o.name}</strong><small>${o.trait}</small><div class="officer-skills"><span title="Профессионализм">ПРОФ <b>${o.skill}</b></span><span title="Переговоры">РЕЧЬ <b>${o.talk}</b></span></div><div class="stamina">${bar(o.stamina, o.stamina < 40 ? "red" : "")}<small>${o.stamina}% сил</small></div></div></button>`).join("")}</div></section>`;
}
function dossier(s, ui) {
  const c = currentCalls(s).find((c) => c.id === ui.call);
  return `<aside class="dossier"><div class="dossier-tabs"><button data-action="tab" data-id="dispatch" class="${ui.tab === "dispatch" ? "active" : ""}">ВЫЗОВ</button><button data-action="tab" data-id="case" class="${ui.tab === "case" ? "active" : ""}">ДЕЛО <span>${s.clues}</span></button><button data-action="tab" data-id="office" class="${ui.tab === "office" ? "active" : ""}">КАБИНЕТ ${s.deals.includes(s.day) ? "" : "•"}</button></div><div class="dossier-body">${ui.tab === "case" ? caseView(s, ui) : ui.tab === "office" ? officeView(s, ui) : c ? callView(s, c, ui) : `<div class="empty-dossier"><span class="seal">BPD</span><h2>Город ждёт решения.</h2><p>Выберите вызов на карте или в диспетчерской. Отметьте офицеров внизу и назначьте тактику.</p><p>В кабинете доступны законные контракты и личные предложения. В деле — улики о продаже порта.</p></div>`}</div></aside>`;
}
function callView(s, c, ui) {
  const estimate = chance(s, c, ui.selection, ui.tactic);
  return `<div class="file-label">INCIDENT REPORT <span>#${s.day}${DAYS[s.day - 1].calls.indexOf(c) + 1}04</span></div><h2>${c.title}</h2><div class="location">${c.place} · осталось ${c.deadline - s.time} мин</div><p class="description">${c.description}</p><div class="details-line"><span>Сложность <b>${c.difficulty}</b></span><span>Выезд <b>${c.duration} мин</b></span></div><h3>Тактика операции</h3><div class="tactics">${TACTICS.map((t) => `<button data-action="tactic" data-id="${t.id}" class="${ui.tactic === t.id ? "selected" : ""}"><span class="radio-circle"></span><div><b>${t.label}</b><small>${t.hint}</small></div></button>`).join("")}</div><div class="dispatch-summary"><span>Сила экипажа <b>${estimate.power} / ${c.difficulty}</b></span>${bar((estimate.power / c.difficulty) * 100)}<p>${ui.selection.length ? `${ui.selection.length} офицера выбрано. Верная тактика даёт +30, ошибка −25.` : "Отметьте от 1 до 3 свободных офицеров внизу."}</p></div><button class="primary full" data-action="dispatch" ${!ui.selection.length || !ui.tactic ? "disabled" : ""}>Отправить экипаж <span>→</span></button><p class="fineprint">Премия за успех: ${money(350 + c.difficulty * 3)}${c.clue ? " · возможна улика по делу порта" : ""}</p>`;
}
function caseView(s, ui) {
  return `<div class="file-label">ДЕЛО № 91–006 <span>КОНФИДЕНЦИАЛЬНО</span></div><h2>${CASE.title}</h2><p>Кто организовал поджог и выкуп порта? Нужны четыре улики, чтобы запросить ордер.</p><div class="evidence-count">${String(s.clues).padStart(2, "0")}<small> / 06 УЛИК</small></div><ol class="clues">${
    CASE.clues
      .slice(0, s.clues)
      .map((c) => `<li>${c}</li>`)
      .join("") ||
    "<li>Ищите улики на вызовах или поручите проверку счетов одному офицеру.</li>"
  }</ol>${s.caseSolved ? '<div class="case-stamp">ДЕЛО РАСКРЫТО</div><p>Шоу обвинён. Премия $5 000 уже в фонде.</p>' : s.accusation ? '<div class="case-stamp failed">ОБВИНЕНИЕ ОТКЛОНЕНО</div><p>След уничтожен. Город запомнит поспешный ордер.</p>' : `<button class="secondary full" data-action="investigate" ${ui.selection.length !== 1 || s.investigations.includes(s.day) || s.clues >= 6 ? "disabled" : ""}>Проверить счета · 150 мин</button><p class="fineprint">Выберите одного офицера. Одна проверка за смену.</p>${s.clues >= 4 ? `<h3>Запросить ордер</h3><p class="fineprint">Обвинение необратимо. Сопоставьте найденные улики.</p>${CASE.suspects.map((p) => `<button class="suspect" data-action="accuse" data-id="${p.id}"><b>${p.name}</b><span>${p.role} ↗</span></button>`).join("")}` : ""}`}`;
}
function officeView(s, ui) {
  const d = DAYS[s.day - 1].deal;
  return `<div class="file-label">ЛИЧНОЕ ДЕЛО <span>МАРА ВЕЙЛ</span></div><h2>Цена новой жизни</h2><p>До последнего парома — ${8 - s.day} смен. Нужно ${money(GOAL)} для Элиаса.</p><div class="fund-amount">${money(s.cash)}</div>${bar((s.cash / GOAL) * 100, "gold")}<h3>Входящее предложение</h3><article class="deal"><span>${d.from}</span><h4>${d.title}</h4><p>${d.text}</p>${s.deals.includes(s.day) ? '<p class="decision-made">Решение принято</p>' : `<div class="deal-effects">${d.cash < 0 ? "−" : "+"}${money(Math.abs(d.cash))} · подозрения ${d.heat > 0 ? "+" : ""}${d.heat} · доверие ${d.trust > 0 ? "+" : ""}${d.trust}</div><div class="deal-actions"><button class="danger" data-action="deal" data-id="yes" ${s.cash + d.cash < 0 ? "disabled" : ""}>Принять</button><button class="secondary" data-action="deal" data-id="no">Отказаться</button></div>`}</article><h3>Законные контракты</h3><p class="fineprint">Гонорар начальнику за организацию. Выберите одного офицера.</p>${CONTRACTS.map((c) => `<div class="contract"><div><b>${c.title}</b><span>${money(c.pay)} · ${c.duration} мин</span></div><button class="secondary" data-action="contract" data-id="${c.id}" ${ui.selection.length !== 1 || s.contracts.includes(s.day + ":" + c.id) ? "disabled" : ""}>${s.contracts.includes(s.day + ":" + c.id) ? "Взято" : "Взять"}</button></div>`).join("")}`;
}
export function game(s, ui) {
  return `${header(s, ui.paused, ui.speed)}<main class="game-layout">${callList(s, ui.call)}${map(s, ui.call)}${dossier(s, ui)}${roster(s, ui.selection)}</main><footer class="statusbar"><button data-action="journal">Журнал смены <span>${s.log.length}</span></button><div class="ticker ${s.log[0]?.kind || ""}">${esc(s.log[0]?.text || "Доброе утро, шеф. Диспетчерская ждёт вашего решения.")}</div><button data-action="end" ${shiftReady(s) ? "" : "disabled"}>Завершить смену →</button></footer>${ui.paused ? '<div class="pause-label">ВРЕМЯ ОСТАНОВЛЕНО</div>' : ""}`;
}
export function settings(settings) {
  return `<span class="file-label">НАСТРОЙКИ</span><h2>Звук и управление</h2><p>Диалоги — на английском. Русские субтитры включены всегда.</p>${[
    ["music", "Музыка"],
    ["effects", "Звуки города"],
    ["voice", "Голоса"],
  ]
    .map(
      ([key, label]) =>
        `<label class="volume-control">${label}<input type="range" min="0" max="1" step=".05" value="${settings[key]}" data-volume="${key}"></label>`,
    )
    .join(
      "",
    )}<div class="controls-help"><p><kbd>Space</kbd> Пауза / продолжить</p><p><kbd>1</kbd> — <kbd>6</kbd> Выбрать офицера</p><p><kbd>Esc</kbd> Закрыть окно</p></div><p class="fineprint">При открытии документов время останавливается. Прогресс сохраняется автоматически в этом браузере.</p><button class="primary full" data-action="close">Вернуться →</button>`;
}
export function ending(s, line) {
  const endings = {
    clean: [
      "Утро без сирен",
      "Элиас уехал под новым именем. Вы сохранили должность и дали городу шанс начать сначала.",
    ],
    dirty: [
      "Билет в один конец",
      "Элиас успел на паром. Цена спасения — ваша должность. Инспектор уже ждёт у двери.",
    ],
    poor: [
      "Город услышит",
      "Денег на отъезд не хватило. Вы с Элиасом передаёте портовую книгу в прямой эфир. Теперь правда принадлежит всем.",
    ],
    fired: [
      "Значок на столе",
      "Вас отстранили до последнего парома. Рейес сохранила копию дела. История города продолжается без вашего приказа.",
    ],
  };
  const [title, desc] = endings[s.ended];
  return `<div class="ending-art">${pic("harbor")}</div><span class="file-label">ЭПИЛОГ · ${s.ended === "fired" ? "ОТСТРАНЕНИЕ" : "ПОСЛЕДНИЙ ПАРОМ"}</span><h2>${title}</h2><p>${desc}</p>${s.caseSolved ? "<p>Шоу предстанет перед судом. Продажа порта заморожена.</p>" : "<p>Шоу избежал обвинения. Покупатель получил порт.</p>"}<div class="ending-stats"><span><b>${money(s.cash)}</b>фонд Элиаса</span><span><b>${s.stats.resolved}</b>вызовов закрыто</span><span><b>${s.stats.bribes}</b>грязных сделок</span></div>${line ? `<div class="dialogue-line"><b>${esc(line.speaker)}</b><p lang="en">${esc(line.en)}</p><p class="subtitle">${esc(line.ru)}</p></div>` : ""}<button class="primary full" data-action="menu">Вернуться в меню →</button>`;
}
