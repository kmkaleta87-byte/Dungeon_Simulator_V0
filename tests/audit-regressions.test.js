const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBrowserGame(leaderboardApi = "") {
  const screen = { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}, insertAdjacentHTML: () => {} };
  const button = { hidden: false, addEventListener: () => {} };
  const storage = new Map();
  const context = {
    document: { querySelector: selector => selector === "#game-screen" ? screen : button },
    window: { LEADERBOARD_API: leaderboardApi },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    confirm: () => true,
    Math: Object.assign(Object.create(Math), { random: () => 0.5 })
  };
  vm.createContext(context);
  for (const file of ["game-index-data.js", "game-rules.js", "script.js"]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context);
  }
  vm.runInContext("render = () => {}; save = () => {};", context);
  return context;
}

test("floor health growth survives the render-time save migration", () => {
  const context = loadBrowserGame();
  vm.runInContext("newRun('Tester'); state.hp=80; render=()=>migrateBrowserSave(); advanceFloor();", context);
  assert.equal(vm.runInContext("state.maxHp", context), 108);
  assert.equal(vm.runInContext("state.baseMaxHp", context), 108);
});

test("reopening a shop does not replace already purchased potion stock", () => {
  const context = loadBrowserGame();
  vm.runInContext("newRun('Tester'); state.gold=10000; state.currentFloor.rooms[0].type='shop'; openShop(); buyPotion(0); openShop();", context);
  assert.equal(vm.runInContext("state.shopPotions.length", context), 1);
});

test("local leaderboard keeps each difficulty's top 100 independently", () => {
  const context = loadBrowserGame();
  vm.runInContext(`localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([
    ...Array.from({length: 105}, (_, i) => ({name: "Easy " + i, className: "Mage", difficulty: "easy", floors: 1000 - i, level: 1, date: i})),
    {name: "Normal record", className: "Warrior", difficulty: "normal", floors: 1, level: 1, date: 200}
  ]))`, context);
  assert.equal(vm.runInContext("loadLeaderboard('normal')[0].name", context), "Normal record");
});

test("completed runs populate the local leaderboard when no global API is configured", () => {
  const context = loadBrowserGame();
  vm.runInContext("newRun('Local Tester'); state.floor=20; state.floorsCleared=20; state.milestonePending=true; finishMilestoneRun();", context);
  assert.equal(vm.runInContext("loadLeaderboard('normal')[0].name", context), "Local Tester");
  assert.equal(vm.runInContext("loadLeaderboard('normal')[0].floors", context), 20);
});

test("a failed global score submission can be retried", async () => {
  const context = loadBrowserGame("https://api.example");
  let requests = 0;
  context.fetch = async () => {
    requests++;
    if (requests === 1) throw new TypeError("offline");
    return { ok: true, json: async () => ({ result: "accepted" }) };
  };
  vm.runInContext("state={name:'Retry Tester',difficulty:'normal',floorsCleared:2,level:3}; submitCompletedRun(state)", context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(vm.runInContext("state.leaderboardSubmitted", context), false);
  vm.runInContext("submitCompletedRun(state)", context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(vm.runInContext("state.leaderboardSubmitted", context), true);
  assert.equal(requests, 2);
});

test("game log content and CSS class values are escaped before HTML rendering", () => {
  const context = loadBrowserGame();
  vm.runInContext(`state = {log: [{text: '<img src=x onerror=alert(1)>', tone: '" onmouseover="alert(1)'}]}`, context);
  const markup = vm.runInContext("renderLog()", context);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(markup, /<img src=x/);
  assert.doesNotMatch(markup, /class="[^"]*"\s+onmouseover=/);
});

test("V1.2 bug-fix notes include every audit correction", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("patch-notes.js", "utf8"), context);
  const bugs = context.window.GAME_PATCH_NOTES["v1.2"].sections.find(section => section.heading === "Bugs").items.join(" ");
  for (const correction of ["Maximum health gained", "Reopening a shop", "Local leaderboard records", "Failed global score submissions", "event log"]) {
    assert.match(bugs, new RegExp(correction));
  }
});
