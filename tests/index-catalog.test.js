const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("browser index includes every defined weapon with catalog descriptions", () => {
  const source = fs.readFileSync("game-index-data.js", "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const weapons = context.window.GAME_INDEX_DATA.weapons;

  for (const className of ["warrior", "archer", "mage"]) {
    assert.equal(weapons[className].length, 84, `${className} weapon count`);
    assert.ok(weapons[className].every(item => item.name && item.description));
  }
  assert.ok(weapons.archer.some(item => item.type === "Bow"));
  assert.ok(weapons.mage.some(item => item.type === "Staff"));
  assert.equal(context.window.GAME_INDEX_DATA.armor.length, 35);
  assert.equal(context.window.GAME_INDEX_DATA.items.length, 19);
  assert.ok(context.window.GAME_INDEX_DATA.armor.every(item => item.name && item.description));
  assert.ok(context.window.GAME_INDEX_DATA.items.every(item => item.name && item.description));
});
