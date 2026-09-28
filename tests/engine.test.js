import test from "node:test";
import assert from "node:assert/strict";
import {
  freshGame,
  currentCalls,
  dispatch,
  advance,
  startContract,
  investigate,
  takeDeal,
  accuse,
  endShift,
  shiftReady,
  save,
  load,
  available,
} from "../src/engine.js";
import { DAYS } from "../src/content.js";

test("successful dispatch reserves officers, pays once, and returns a tired crew", () => {
  const s = freshGame();
  dispatch(s, "pharmacy", ["reyes", "bell"], "talk");
  assert.equal(available(s).length, 4);
  assert.equal(s.cash, 2500);
  assert.throws(() => dispatch(s, "pharmacy", ["cole"], "talk"));
  advance(s, 74);
  assert.equal(s.officers[0].busy, "pharmacy");
  advance(s, 1);
  assert.equal(s.calls.pharmacy, "resolved");
  assert.equal(s.cash, 3135);
  assert.equal(s.officers[0].busy, null);
  assert.equal(s.officers[0].stamina, 77);
  const cash = s.cash;
  advance(s, 1);
  assert.equal(s.cash, cash);
});
test("wrong tactics with a lone rookie fails and reduces trust", () => {
  const s = freshGame();
  dispatch(s, "pharmacy", ["ford"], "search");
  advance(s, 75);
  assert.equal(s.calls.pharmacy, "failed");
  assert.equal(s.cash, 2500);
  assert.equal(s.trust, 57);
  assert.equal(s.officers[5].stamina, 62);
});
test("call deadlines expire once and cannot be dispatched afterwards", () => {
  const s = freshGame();
  advance(s, 100);
  assert.equal(s.calls.pharmacy, "missed");
  assert.equal(s.stats.missed, 1);
  assert.throws(() => dispatch(s, "pharmacy", ["reyes"], "talk"));
  advance(s, 5);
  assert.equal(s.stats.missed, 1);
});
test("team validation prevents duplicate, unavailable and oversized crews", () => {
  const s = freshGame();
  for (const team of [
    [],
    ["reyes", "reyes"],
    ["ghost"],
    ["reyes", "cole", "park", "bell"],
  ])
    assert.throws(() => dispatch(s, "pharmacy", team, "talk"));
  startContract(s, "escort", "reyes");
  assert.throws(() => dispatch(s, "pharmacy", ["reyes"], "talk"));
  assert.equal(s.jobs.length, 1);
});
test("legal contracts pay only after completion and can be taken once per shift", () => {
  const s = freshGame();
  startContract(s, "escort", "ford");
  advance(s, 120);
  assert.equal(s.cash, 4300);
  assert.throws(() => startContract(s, "escort", "bell"));
  assert.equal(s.officers[5].busy, null);
});
test("offers apply visible financial and reputational effects once", () => {
  const s = freshGame();
  takeDeal(s, true);
  assert.equal(s.cash, 7000);
  assert.equal(s.heat, 16);
  assert.equal(s.trust, 59);
  assert.equal(s.stats.bribes, 1);
  assert.throws(() => takeDeal(s, true));
  const honest = freshGame();
  takeDeal(honest, false);
  assert.equal(honest.cash, 2500);
  assert.equal(honest.trust, 66);
});
test("voluntary disclosure requires sufficient funds", () => {
  const s = freshGame();
  s.day = 6;
  assert.throws(() => takeDeal(s, true));
  assert.deepEqual(s.deals, []);
  s.cash = 5000;
  s.heat = 70;
  takeDeal(s, true);
  assert.equal(s.cash, 1000);
  assert.equal(s.heat, 35);
});
test("investigation finds evidence, warrant requires evidence and pays only once", () => {
  const s = freshGame();
  assert.throws(() => accuse(s, "shaw"));
  investigate(s, "park");
  advance(s, 150);
  assert.equal(s.clues, 1);
  assert.throws(() => investigate(s, "bell"));
  s.clues = 4;
  accuse(s, "shaw");
  assert.equal(s.caseSolved, true);
  assert.equal(s.cash, 7500);
  assert.throws(() => accuse(s, "shaw"));
});
test("unsupported accusation closes the case with concrete consequences", () => {
  const s = freshGame();
  s.clues = 4;
  accuse(s, "doyle");
  assert.equal(s.caseSolved, false);
  assert.equal(s.trust, 44);
  assert.equal(s.heat, 15);
  assert.throws(() => accuse(s, "shaw"));
});
test("end-of-shift waits for late crews, pays salary, and restores fatigue", () => {
  const s = freshGame();
  s.time = 590;
  s.trust = 80;
  startContract(s, "escort", "cole");
  advance(s, 10);
  assert.equal(shiftReady(s), false);
  assert.throws(() => endShift(s));
  advance(s, 110);
  assert.equal(shiftReady(s), true);
  endShift(s);
  assert.equal(s.day, 2);
  assert.equal(s.time, 0);
  assert.equal(s.cash, 5200);
  assert.equal(s.officers[1].stamina, 100);
});
test("all four endings follow money, suspicion and job survival", () => {
  for (const [cash, heat, trust, bribes, ending] of [
    [40000, 0, 60, 0, "clean"],
    [41000, 60, 60, 2, "dirty"],
    [39999, 0, 60, 0, "poor"],
    [50000, 100, 60, 4, "fired"],
    [50000, 0, 10, 0, "fired"],
  ]) {
    const s = freshGame();
    s.day = 7;
    s.time = 600;
    s.cash = cash - 900;
    s.heat = heat;
    s.trust = trust;
    s.stats.bribes = bribes;
    endShift(s);
    assert.equal(s.ended, ending);
    assert.throws(() => endShift(s));
  }
});
test("save round-trip preserves in-flight jobs and corrupt saves are ignored", () => {
  const memory = {
    data: null,
    setItem(k, v) {
      this.data = v;
    },
    getItem() {
      return this.data;
    },
  };
  const s = freshGame();
  dispatch(s, "pharmacy", ["reyes"], "talk");
  save(s, memory);
  const resumed = load(memory);
  assert.deepEqual(resumed, s);
  advance(resumed, 75);
  assert.equal(resumed.calls.pharmacy, "resolved");
  memory.data = "{bad";
  assert.equal(load(memory), null);
  memory.data = '{"version":99}';
  assert.equal(load(memory), null);
  assert.equal(
    save(s, {
      setItem() {
        throw Error("Quota");
      },
    }),
    false,
  );
});
test("a complete clean campaign can fund relocation without accepting bribes", () => {
  const s = freshGame();
  for (let d = 1; d <= 7; d++) {
    takeDeal(s, false);
    for (const c of DAYS[d - 1].calls) {
      advance(s, Math.max(0, c.at - s.time));
      // Every call allows a crew from the available roster; use the best suited pair.
      let crew = available(s).sort(
        (a, b) =>
          (c.type === "talk" ? b.talk : b.skill) * (0.55 + b.stamina / 220) -
          (c.type === "talk" ? a.talk : a.skill) * (0.55 + a.stamina / 220),
      );
      if (crew.length < 2) {
        advance(s, 35);
        crew = available(s).sort((a, b) => b.stamina - a.stamina);
      }
      const selected = crew.slice(0, 2);
      if (
        selected.reduce(
          (sum, o) =>
            sum +
            (c.type === "talk" ? o.talk : o.skill) * (0.55 + o.stamina / 220),
          30,
        ) < c.difficulty &&
        crew[2]
      )
        selected.push(crew[2]);
      dispatch(
        s,
        c.id,
        selected.map((o) => o.id),
        c.correct,
      );
      if (s.clues >= 4 && !s.accusation) accuse(s, "shaw");
      // Time can advance to the next call while the previous crew travels.
    }
    const spare = available(s)[0];
    if (spare) startContract(s, "escort", spare.id);
    advance(s, 720 - s.time);
    endShift(s);
  }
  assert.equal(s.ended, "clean");
  assert.ok(s.cash >= 40000);
  assert.equal(s.stats.bribes, 0);
  assert.equal(s.stats.resolved, 35);
  console.log(
    "Clean campaign:",
    JSON.stringify({
      cash: s.cash,
      trust: s.trust,
      resolved: s.stats.resolved,
      clues: s.clues,
    }),
  );
});

test("last-minute training and investigation finish after 20:00, including after reload", () => {
  for (const type of ["training", "investigation"]) {
    const s = freshGame();
    s.time = 599;
    if (type === "training") startContract(s, "training", "park");
    else investigate(s, "park");
    const memory = {
      data: null,
      setItem(k, v) {
        this.data = v;
      },
      getItem() {
        return this.data;
      },
    };
    advance(s, 149);
    save(s, memory);
    const resumed = load(memory);
    assert.equal(resumed.time, 748);
    advance(resumed, 1);
    assert.equal(resumed.jobs.length, 0);
    assert.equal(shiftReady(resumed), true);
    assert.equal(resumed.officers[2].busy, null);
    endShift(resumed);
    assert.equal(resumed.day, 2);
  }
});
