# V1.2 Second-Pass Audit Supplement

Date: 2026-10-19

This is a supplemental review of the first browser-game audit. It leaves the original findings intact and rechecks their evidence against the current working tree. No gameplay or other production logic was changed during this pass. The V1.2 patch notes link to the newly confirmed open issues below.

## 1. Newly discovered defects

### High impact: combat potion use can restore the last item in a stack

The combat action path in `combatAction("heal")` and `combatAction("mana")` decrements `item.quantity` but does not remove the item when the quantity reaches zero. The enemy turn then calls `render()`. Render-time `migrateBrowserSave()` rebuilds the inventory by calling `addInventoryItem()`, which normalizes quantities to at least one. As a result, the last consumed potion returns to the inventory. The player can repeatedly use that potion in combat without spending another item.

Reproduction executed in a VM browser harness: give the player one health potion, start combat against an enemy whose intent is Guard, set render to run the actual save migration, and call `combatAction("heal")`. The observed quantity after the combat action, enemy turn, and migration was `1`, although the potion had been consumed. This path affects both health and mana potions.

The inventory-button path has a different implementation that removes an exhausted stack, which explains why inventory-use coverage did not catch this combat-action defect. Production fix is pending, per the second-pass instruction.

### Medium impact, high confidence: global-score retry is not durable across leaving or reloading

The first audit’s retry fix resets `leaderboardSubmitted` and exposes a retry button when the failed request is handled while the same run remains active. However, completion first saves the run with `leaderboardSubmitted: true` and a “Submitting…” status. If the user returns to the title or reloads before the request rejects, the catch handler mutates only the old in-memory run because it skips `render()` and `save()` when that run is no longer active. The saved slot remains marked submitted and pending, so continuing it does not expose the retry button.

Reproduction executed with a deferred failing `fetch`: finish a milestone run, leave the run while the request is pending, then reject the request. The persisted save still contained `leaderboardSubmitted: true` and `runSubmissionStatus: "Submitting final score to the global board…"`. The first audit’s direct retry test does not cover this lifecycle race.

### Conditional save-recovery risk: a partial saved slot can crash Continue

`loadSaveSlots()` accepts any truthy parsed slot without validating its shape. The migration fills several optional fields, but rendering still requires a valid `currentFloor` and current room. A valid JSON slot such as `{}` reaches `render()` and throws a `TypeError` while reading the floor state. The title screen offers Continue for any truthy slot. A player can still recover by deleting that slot, so this is a conditional reliability risk rather than a defect observed during ordinary gameplay.

Reproduction executed by rendering a state initialized as `{}`; it failed with `TypeError: Cannot read properties of undefined (reading 'currentId')`.

## 2. Reassessment of the first audit’s findings

- **Floor HP growth:** the code now moves the increase into `baseMaxHp`, so render-time armor migration preserves it. The current regression test invokes migration through a replacement render function; it does not exercise the actual browser render, save write, reload, and continue sequence. The root cause and correction are supported, but persistence coverage is narrower than the test name and patch-note wording imply.
- **Shop potion stock:** `openShop()` no longer recreates an array merely because fewer than two offers remain. The direct reopen test supports this path. It does not drive the modal close and browse buttons, though those route back through the same `openShop()` function.
- **Local leaderboard:** filtering before the per-difficulty top-100 limit and storing local completed runs are present. The tests cover a mixed-difficulty crowd-out counterexample and an unconfigured local submission. They do not exhaust tie ordering, storage quota failure, or malformed-but-valid legacy data behavior.
- **Log HTML escaping:** the renderer escapes both log text and class values, addressing the identified injection sink. The test supplies hostile log data directly; it does not drive a hostile character name through run creation, death, rendering, and save reload end to end.
- **Global score retry:** the initial finding was valid, and the retry button works for a failure handled while the run-end view is active. The repair is incomplete across navigation and reload, as described above.

No first-pass finding was shown to have an incorrect root cause. The retry finding should be described as **partially fixed**, not fully fixed. The combat potion defect was overlooked.

## 3. Test adequacy and coverage gaps

The fresh full suite passed: **104 tests, 0 failures**. That confirms the covered cases still pass; it does not negate the new reproductions.

The most material gaps found in the existing and added tests are:

- Combat health/mana actions are not tested through `combatAction()` with the real enemy-turn and render migration path. A nearby test covers inventory-use blocking during a bonus action, which is a separate handler.
- The score retry test calls `submitCompletedRun()` directly twice. It does not inspect the retry button or simulate pending request → title/reload → failure → continue.
- Floor HP coverage calls the migration function through a stubbed render and checks the immediate state. It does not test an actual saved slot through reload and Continue.
- Generated-floor tests cover selected floors and deterministic harness randomness, not a broad seeded property sweep over topology, reciprocal edges, room uniqueness, and boss/shop reachability.
- Worker tests use an in-memory D1 mock; no deployed Worker, CORS configuration, or live API request was exercised.
- The browser-facing tests use a VM with fake DOM elements. They do not verify real browser event bubbling, layout, storage quota behavior, or refresh timing.

## 4. Regressions caused by later changes

No new regression attributable to the first audit’s production edits was confirmed in this pass. The combat potion defect comes from the interaction of the existing combat consumption path and save migration; it was not introduced by the audit fixes. The retry persistence race is an incomplete edge case in the first audit’s retry repair, rather than a demonstrated regression from the prior behavior.

The only changes made during this second pass are this report and the V1.2 patch-note audit follow-up. Production logic remains unchanged.

## 5. Remaining high-risk blind spots and next tests

Highest-value follow-up tests:

1. Exercise health and mana potions from both combat action buttons with stack sizes one and greater than one; verify quantity after enemy action, save, and reload.
2. Keep a global submission pending while returning to title, reloading, and continuing the run; verify failed requests remain retryable and successful responses do not leave stale pending text.
3. Round-trip floor health growth with equipped health-bonus armor and CON upgrades through actual render/save/reload paths.
4. Add schema validation or recovery tests for empty, partial, stale, and wrong-typed save slots, including a visible recovery path.
5. Run seeded procedural-generation properties over many floors and seeds, checking connectivity, reciprocal connections, unique coordinates/IDs, exactly one boss/shop, and route reachability.
6. Exercise combat effect/counter/summon combinations with multiple enemies, simultaneous lethal outcomes, and repeated input around victory transitions.
7. Test local/global leaderboard ordering at ties and cutoff boundaries, storage failures, and stale async responses after the run or modal changes.
8. Perform browser-level checks for real DOM interactions and storage behavior; configure and exercise the deployed Worker separately before treating global submission as verified.

## 6. Confidence assessment

The combined evidence justifies **moderate confidence in the tested pure rules and deterministic code paths**, and **lower confidence in end-to-end browser lifecycle behavior**. The second pass found a reproducible combat economy exploit despite a green suite, and exposed a persistence race in a fix that had been called complete. The project is not exhaustively audited, and the currently passing tests do not support a claim of complete correctness.
