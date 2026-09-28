import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const failures = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__playedAudio = [];
    window.Audio = function (src) {
      const a = new NativeAudio(src);
      window.__playedAudio.push(a);
      return a;
    };
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.status() + " " + r.url());
  });
  await page.goto("http://127.0.0.1:4319");
  await page.waitForSelector(".menu-actions");
  await page.screenshot({
    path: "work/initial-release/menu.png",
    fullPage: true,
  });
  await page.waitForFunction(async () => {
    const r = await fetch("./assets/dialogue.json");
    return r.ok;
  });
  await page.getByRole("button", { name: "Начать историю" }).click();
  await page.waitForSelector(".film");
  await page.screenshot({ path: "work/initial-release/intro.png" });
  assert.match(await page.locator(".subtitle").textContent(), /[А-Яа-яЁё]/);
  await page.waitForFunction(() =>
    window.__playedAudio.some(
      (a) => a.src.includes("intro-1") && a.currentTime > 0 && !a.paused,
    ),
  );
  assert.ok(
    await page.evaluate(() =>
      window.__playedAudio.some(
        (a) => a.src.includes("low-tide") && a.currentTime > 0 && !a.paused,
      ),
    ),
  );
  await page.getByRole("button", { name: "Пропустить" }).click();
  await page.getByRole("button", { name: "На службу" }).click();
  await page.locator('[data-action="officer"][data-id="reyes"]').click();
  await page.locator('[data-action="officer"][data-id="bell"]').click();
  await page.locator('[data-action="tactic"][data-id="talk"]').click();
  await page.screenshot({
    path: "work/initial-release/game.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Отправить экипаж" }).click();
  assert.equal(await page.locator(".officer.busy").count(), 2);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Продолжить смену" }).click();
  await page.getByRole("button", { name: "На службу" }).click();
  assert.equal(await page.locator(".officer.busy").count(), 2);
  const clockBefore = await page.locator("#clock").textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator("#clock").textContent(), clockBefore);
  await page
    .getByRole("button", { name: "Продолжить время", exact: true })
    .click();
  await page.locator('[data-action="speed"]').click();
  await page.waitForFunction(
    () => document.querySelectorAll(".officer.busy").length === 0,
    {},
    { timeout: 15000 },
  );
  assert.notEqual(await page.locator("#clock").textContent(), clockBefore);
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("low-water-save-v1")).cash,
    ),
    3135,
  );
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await page
    .getByRole("button", { name: "Звук и управление", exact: true })
    .click();
  await page.locator('[data-volume="music"]').fill("0");
  await page.getByRole("button", { name: "Вернуться", exact: false }).click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("low-water-audio")).music,
    ),
    0,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "work/initial-release/mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.locator('[data-action="tab"][data-id="office"]').click();
  await page.locator('[data-action="deal"][data-id="no"]').click();
  assert.equal(await page.locator(".decision-made").count(), 1);
  await page.keyboard.press("Space");
  assert.equal(
    await page.getByRole("button", { name: "Пауза", exact: true }).count(),
    1,
  );
  await page.keyboard.press("Space");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page
    .getByRole("button", { name: "Продолжить время", exact: true })
    .click();
  await page.locator('[data-action="tab"][data-id="case"]').focus();
  await page.locator(".dossier-body").evaluate((el) => (el.scrollTop = 150));
  const scrollBefore = await page
    .locator(".dossier-body")
    .evaluate((el) => el.scrollTop);
  assert.ok(scrollBefore > 0);
  await page.waitForTimeout(1200);
  assert.equal(
    await page.locator(".dossier-body").evaluate((el) => el.scrollTop),
    scrollBefore,
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.id),
    "case",
  );
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  const campaignSave = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("low-water-save-v1")),
  );
  for (const end of ["clean", "dirty", "poor", "fired"]) {
    const epilogue = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    epilogue.setDefaultTimeout(15000);
    epilogue.on("pageerror", (e) => errors.push(e.message));
    await epilogue.addInitScript(
      (s) => localStorage.setItem("low-water-save-v1", JSON.stringify(s)),
      { ...campaignSave, ended: end },
    );
    if (end === "clean")
      await epilogue.route("**/assets/dialogue.json", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });
    await epilogue.goto("http://127.0.0.1:4319");
    await epilogue.getByRole("button", { name: "Продолжить смену" }).click();
    const expected = await epilogue.evaluate(
      async (end) =>
        (await (await fetch("./assets/dialogue.json")).json()).find(
          (x) => x.id === "ending-" + end,
        ).ru,
      end,
    );
    assert.equal(
      await epilogue.locator(".modal .subtitle").textContent(),
      expected,
    );
    await epilogue.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  await fs.writeFile(
    "work/initial-release/browser-results.json",
    JSON.stringify(
      {
        passed: true,
        desktop: [1440, 1000],
        mobile: [390, 844],
        consoleErrors: errors,
        failedRequests: failures,
        checks: [
          "new game",
          "narrated intro",
          "dispatch",
          "busy officers",
          "save and reload",
          "paused clock",
          "volume persistence",
          "mobile overflow",
          "offer decision",
          "keyboard pause",
          "real timer advancement",
          "crew return and payment",
          "voice playback",
          "music playback",
          "Russian subtitles",
          "scroll and focus survive ticks",
          "subtitles in all four endings",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Browser smoke passed: 17 checks, no JS errors, no failed requests.",
  );
} finally {
  await browser.close();
}
