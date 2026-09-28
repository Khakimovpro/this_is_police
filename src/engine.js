import { OFFICERS, DAYS, GOAL, CONTRACTS } from "./content.js";
export const SAVE_KEY = "low-water-save-v1";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function freshGame() {
  return {
    version: 1,
    day: 1,
    time: 0,
    cash: 2500,
    trust: 64,
    heat: 0,
    officers: OFFICERS.map((o) => ({ ...o, busy: null })),
    calls: {},
    jobs: [],
    log: [],
    deals: [],
    contracts: [],
    investigations: [],
    clues: 0,
    caseSolved: false,
    accusation: null,
    ended: null,
    stats: { resolved: 0, failed: 0, missed: 0, earned: 0, bribes: 0 },
    dayStartCash: 2500,
  };
}
export function currentCalls(s) {
  return DAYS[s.day - 1].calls.filter(
    (c) => c.at <= s.time && !s.calls[c.id] && c.deadline > s.time,
  );
}
export function available(s) {
  return s.officers.filter((o) => !o.busy && o.stamina >= 20);
}
export function note(s, text, kind = "info") {
  s.log.unshift({ day: s.day, time: s.time, text, kind });
  s.log = s.log.slice(0, 80);
}
function income(s, amount) {
  s.cash += amount;
  if (amount > 0) s.stats.earned += amount;
}
export function chance(s, call, ids, tactic) {
  const team = s.officers.filter((o) => ids.includes(o.id));
  const power = team.reduce(
    (sum, o) =>
      sum +
      (call.type === "talk" ? o.talk : o.skill) * (0.55 + o.stamina / 220),
    0,
  );
  return {
    power: Math.round(power),
    required: call.difficulty,
    bonus: tactic === call.correct ? 30 : -25,
    success: power + (tactic === call.correct ? 30 : -25) >= call.difficulty,
  };
}
function teamFor(s, ids, max = 3) {
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > max ||
    new Set(ids).size !== ids.length
  )
    throw Error("Выберите от 1 до " + max + " свободных офицеров.");
  const team = ids.map((id) => s.officers.find((o) => o.id === id));
  if (team.some((o) => !o || o.busy || o.stamina < 20))
    throw Error("Этот офицер сейчас недоступен.");
  return team;
}
function ensureActive(s) {
  if (s.ended || s.time >= 600) throw Error("Смена завершена.");
}
export function dispatch(s, callId, ids, tactic) {
  ensureActive(s);
  const c = currentCalls(s).find((c) => c.id === callId);
  if (!c) throw Error("Этот вызов уже недоступен.");
  if (!["talk", "secure", "search"].includes(tactic))
    throw Error("Выберите тактику.");
  const team = teamFor(s, ids);
  const job = {
    id: c.id,
    type: "call",
    end: s.time + c.duration,
    ids: [...ids],
    call: c,
    tactic,
    success: chance(s, c, ids, tactic).success,
  };
  team.forEach((o) => (o.busy = job.id));
  s.calls[c.id] = "enroute";
  s.jobs.push(job);
  note(
    s,
    `${team.map((o) => o.name.split(" ").at(-1)).join(" / ")} → ${c.title}`,
  );
  return job;
}
export function startContract(s, id, officerId) {
  ensureActive(s);
  const c = CONTRACTS.find((c) => c.id === id);
  if (!c) throw Error("Контракт не найден.");
  const key = s.day + ":" + id;
  if (s.contracts.includes(key)) throw Error("Этот контракт уже взят сегодня.");
  const [o] = teamFor(s, [officerId], 1);
  const job = {
    id: key,
    type: "contract",
    end: s.time + c.duration,
    ids: [o.id],
    contract: c,
  };
  o.busy = key;
  s.jobs.push(job);
  s.contracts.push(key);
  note(s, `${o.name}: ${c.title}.`);
}
export function investigate(s, officerId) {
  ensureActive(s);
  if (s.caseSolved || s.clues >= 6 || s.investigations.includes(s.day))
    throw Error("На сегодня все зацепки проверены.");
  const [o] = teamFor(s, [officerId], 1);
  const id = "investigation:" + s.day;
  o.busy = id;
  s.jobs.push({ id, type: "investigation", end: s.time + 150, ids: [o.id] });
  s.investigations.push(s.day);
  note(s, `${o.name} проверяет портовые счета.`);
}
export function takeDeal(s, accept) {
  ensureActive(s);
  if (s.deals.includes(s.day)) throw Error("Решение уже принято.");
  const d = DAYS[s.day - 1].deal;
  if (accept && s.cash + d.cash < 0) throw Error("Недостаточно денег.");
  s.deals.push(s.day);
  if (accept) {
    income(s, d.cash);
    s.heat = clamp(s.heat + d.heat, 0, 100);
    s.trust = clamp(s.trust + d.trust, 0, 100);
    if (d.heat > 0) s.stats.bribes++;
    note(
      s,
      `${d.title}: предложение принято. ${d.cash < 0 ? "−" : "+"}$${Math.abs(d.cash).toLocaleString("en-US")}.`,
      d.heat > 0 ? "bad" : "good",
    );
  } else {
    s.trust = clamp(s.trust + 2, 0, 100);
    s.heat = clamp(s.heat - 2, 0, 100);
    note(s, `${d.title}: вы отказались.`);
  }
}
export function accuse(s, suspect) {
  ensureActive(s);
  if (s.clues < 4) throw Error("Нужно собрать хотя бы четыре улики.");
  if (s.accusation) throw Error("Ордер уже выдан.");
  if (!["shaw", "doyle", "mercer"].includes(suspect))
    throw Error("Подозреваемый не найден.");
  s.accusation = suspect;
  if (suspect === "shaw") {
    s.caseSolved = true;
    income(s, 5000);
    s.trust = clamp(s.trust + 12, 0, 100);
    s.heat = clamp(s.heat - 15, 0, 100);
    note(
      s,
      "Дело Шоу передано прокурору. Премия за раскрытие: $5 000.",
      "good",
    );
  } else {
    s.trust = clamp(s.trust - 20, 0, 100);
    s.heat = clamp(s.heat + 15, 0, 100);
    note(
      s,
      "Прокурор отклонил обвинение. Настоящий организатор уничтожил оставшиеся следы.",
      "bad",
    );
  }
}
function resolve(s, job) {
  job.ids.forEach((id) => {
    const o = s.officers.find((o) => o.id === id);
    o.busy = null;
    o.stamina = clamp(o.stamina - (job.type === "call" ? 23 : 30), 0, 100);
  });
  if (job.type === "contract") {
    income(s, job.contract.pay);
    note(s, `${job.contract.title}: +$${job.contract.pay}.`, "good");
    return;
  }
  if (job.type === "investigation") {
    s.clues = Math.min(6, s.clues + 1);
    note(s, "Детектив вернулся с новой уликой по делу порта.", "good");
    return;
  }
  const c = job.call;
  s.calls[c.id] = job.success ? "resolved" : "failed";
  if (job.success) {
    const pay = 350 + c.difficulty * 3;
    income(s, pay);
    s.trust = clamp(s.trust + 2, 0, 100);
    s.stats.resolved++;
    if (c.clue) s.clues = Math.min(6, s.clues + 1);
    note(
      s,
      `${c.title}: ситуация под контролем. Премия +$${pay}${c.clue ? " · найдена улика" : ""}.`,
      "good",
    );
  } else {
    s.trust = clamp(s.trust - 7, 0, 100);
    s.stats.failed++;
    job.ids.forEach((id) => {
      const o = s.officers.find((o) => o.id === id);
      o.stamina = clamp(o.stamina - 15, 0, 100);
    });
    note(
      s,
      `${c.title}: операция сорвана. Доверие −7. Проверьте состав и тактику.`,
      "bad",
    );
  }
}
export function advance(s, minutes = 5) {
  if (s.ended) return;
  const target = Math.min(750, s.time + Math.max(0, minutes));
  // Resolve at each event's actual time, even when the user fast-forwards.
  while (s.time < target) {
    s.time = Math.min(target, s.time + 1);
    for (const c of DAYS[s.day - 1].calls) {
      if (!s.calls[c.id] && c.deadline <= s.time) {
        s.calls[c.id] = "missed";
        s.stats.missed++;
        s.trust = clamp(s.trust - 5, 0, 100);
        note(s, `${c.title}: вызов потерян. Доверие −5.`, "bad");
      }
    }
    const finished = s.jobs.filter((j) => j.end <= s.time);
    s.jobs = s.jobs.filter((j) => j.end > s.time);
    finished.forEach((j) => resolve(s, j));
  }
}
export function shiftReady(s) {
  return s.time >= 600 && s.jobs.length === 0;
}
export function endShift(s) {
  if (s.ended || !shiftReady(s))
    throw Error("Дождитесь окончания смены и возвращения экипажей.");
  income(s, 900);
  note(s, "Зарплата начальника: +$900.", "good");
  const report = {
    day: s.day,
    income: s.cash - s.dayStartCash,
    cash: s.cash,
    trust: s.trust,
    heat: s.heat,
  };
  if (s.trust <= 10 || s.heat >= 100) s.ended = "fired";
  else if (s.day === 7)
    s.ended =
      s.cash < GOAL
        ? "poor"
        : s.heat > 45 || s.stats.bribes >= 3
          ? "dirty"
          : "clean";
  else {
    s.day++;
    s.time = 0;
    s.dayStartCash = s.cash;
    s.officers.forEach((o) => (o.stamina = clamp(o.stamina + 45, 0, 100)));
  }
  return report;
}
export function save(s, storage = localStorage) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function load(storage = localStorage) {
  try {
    const s = JSON.parse(storage.getItem(SAVE_KEY));
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.day) ||
      s.day < 1 ||
      s.day > 7 ||
      !Number.isFinite(s.time) ||
      s.time < 0 ||
      s.time > 750 ||
      !Array.isArray(s.officers) ||
      s.officers.length !== 6
    )
      return null;
    for (const k of ["cash", "trust", "heat", "clues"])
      if (!Number.isFinite(s[k])) return null;
    for (const k of ["jobs", "log", "deals", "contracts", "investigations"])
      if (!Array.isArray(s[k])) return null;
    if (
      !s.calls ||
      !s.stats ||
      s.officers.some(
        (o, i) => o.id !== OFFICERS[i].id || !Number.isFinite(o.stamina),
      )
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
export function clock(s) {
  const n = 480 + s.time;
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
