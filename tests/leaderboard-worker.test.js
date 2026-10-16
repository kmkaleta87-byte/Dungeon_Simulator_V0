const test = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");

let workerPromise;
async function loadWorker() {
  workerPromise ||= import(pathToFileURL(`${process.cwd()}/leaderboard/worker.js`));
  return workerPromise;
}

function makeD1(seed = []) {
  const scores = [...seed];
  const limits = new Map();
  const queries = [];
  const db = {
    scores, limits, queries,
    prepare(sql) {
      return {
        sql, values: [], bind(...values) {
          const statement = { sql, values };
          statement.run = async () => {
            queries.push([{ sql, values }]);
            if (sql.includes("DELETE FROM submission_limits")) return { meta: { changes: 0 } };
            throw new Error(`Unexpected statement run: ${sql}`);
          };
          statement.all = async () => {
            queries.push([{ sql, values }]);
            if (sql.includes("SELECT player_name")) return { results: scores.filter(score => score.difficulty === values[0]).sort(compareScores).slice(0, 100) };
            throw new Error(`Unexpected query: ${sql}`);
          };
          return statement;
        }
      };
    },
    async batch(statements) {
      queries.push(statements.map(statement => ({ sql: statement.sql, values: statement.values })));
      if (statements.length === 2 && statements[0].sql.includes("submission_limits")) {
        const [, windowStart] = statements[0].values;
        const key = statements[0].values[0];
        const previous = limits.get(key);
        const count = previous?.windowStart === windowStart ? previous.count + 1 : 1;
        limits.set(key, { windowStart, count });
        return [{ meta: { changes: 1 } }, { results: [{ request_count: count }] }];
      }
      if (statements.length === 2 && statements[0].sql.includes("INSERT INTO scores")) {
        const values = statements[0].values;
        const [, , difficulty, floors, level, createdAt] = values;
        const board = scores.filter(score => score.difficulty === difficulty).sort(compareScores);
        const cutoff = board.length < 100 ? null : board[99];
        const qualifies = !cutoff || floors > cutoff.floors || (floors === cutoff.floors && level > cutoff.level);
        if (qualifies) scores.push({ id: scores.reduce((max, score) => Math.max(max, score.id), 0) + 1, name: values[0], className: values[1], difficulty, floors, level, date: createdAt });
        for (const difficultyToTrim of new Set(statements[1].values)) {
          const sorted = scores.filter(score => score.difficulty === difficultyToTrim).sort(compareScores);
          const keep = new Set(sorted.slice(0, 100).map(score => score.id));
          for (let index = scores.length - 1; index >= 0; index--) {
            if (scores[index].difficulty === difficultyToTrim && !keep.has(scores[index].id)) scores.splice(index, 1);
          }
        }
        return [{ meta: { changes: qualifies ? 1 : 0 } }, { meta: { changes: 0 } }];
      }
      throw new Error(`Unexpected D1 batch: ${statements.map(statement => statement.sql).join(" | ")}`);
    },
    async query(sql, values) { throw new Error(`Unexpected query: ${sql} ${values}`); }
  };
  return db;
}

function compareScores(a, b) { return b.floors - a.floors || b.level - a.level || a.date - b.date || a.id - b.id; }
const origin = "https://kmkaleta87-byte.github.io";
const envFor = (DB = makeD1()) => ({ DB, ALLOWED_ORIGINS: origin });
function post(body, ip = "192.0.2.5") {
  return new Request("https://api.example/scores", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify(body)
  });
}
const score = (overrides = {}) => ({ name: "Mira", className: "Mage", difficulty: "normal", floors: 4, level: 8, ...overrides });

test("GET returns the requested top 100 with deterministic ordering and validates difficulty", async () => {
  const { default: worker } = await loadWorker();
  const DB = makeD1([
    { id: 2, name: "Later", className: "Mage", difficulty: "hard", floors: 7, level: 12, date: 2 },
    { id: 1, name: "First", className: "Mage", difficulty: "hard", floors: 7, level: 12, date: 1 }
  ]);
  const response = await worker.fetch(new Request("https://api.example/scores?difficulty=hard", { headers: { Origin: origin } }), envFor(DB));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual((await response.json()).scores.map(row => row.name), ["First", "Later"]);
  assert.match(DB.queries[0][0].sql, /LIMIT 100/);

  const invalid = await worker.fetch(new Request("https://api.example/scores?difficulty=medium", { headers: { Origin: origin } }), envFor());
  assert.equal(invalid.status, 400);
});

test("qualifying scores are stored for each valid difficulty, including boards with fewer than 100", async () => {
  const { default: worker } = await loadWorker();
  const DB = makeD1();
  for (const difficulty of ["easy", "normal", "hard"]) {
    const response = await worker.fetch(post(score({ difficulty, floors: 10 })), envFor(DB));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).result, "accepted");
  }
  assert.equal(DB.scores.length, 3);
  assert.deepEqual(new Set(DB.scores.map(row => row.difficulty)), new Set(["easy", "normal", "hard"]));
});

test("non-qualifying scores are reported but never permanently stored", async () => {
  const { default: worker } = await loadWorker();
  const seed = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, name: `Player ${index}`, className: "Warrior", difficulty: "normal", floors: 100 - Math.floor(index / 2), level: index % 2 ? 1 : 5, date: index + 1 }));
  const DB = makeD1(seed);
  const response = await worker.fetch(post(score({ floors: 1, level: 1 })), envFor(DB));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result, "not_eligible");
  assert.equal(DB.scores.length, 100);
  assert.equal(DB.scores.some(row => row.name === "Mira"), false);
});

test("a qualifying replacement preserves the 100-entry cap and rejects exact cutoff ties", async () => {
  const { default: worker } = await loadWorker();
  const seed = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, name: `Player ${index}`, className: "Warrior", difficulty: "normal", floors: 100 - Math.floor(index / 2), level: index % 2 ? 1 : 5, date: index + 1 }));
  const DB = makeD1(seed);
  const exactTie = await worker.fetch(post(score({ floors: 51, level: 1 })), envFor(DB));
  assert.equal((await exactTie.json()).result, "not_eligible");
  assert.equal(DB.scores.length, 100);
  const better = await worker.fetch(post(score({ floors: 51, level: 2 })), envFor(DB));
  assert.equal((await better.json()).result, "accepted");
  assert.equal(DB.scores.length, 100);
  assert.equal(DB.scores.some(row => row.name === "Mira"), true);
  assert.equal(DB.queries.some(batch => batch.length === 2 && batch[0].sql.includes("INSERT INTO scores")), true);
});

test("invalid inputs, unsupported content types, and bad origins are rejected", async () => {
  const { default: worker } = await loadWorker();
  for (const input of [
    score({ difficulty: "medium" }), score({ floors: 0 }), score({ floors: 1.5 }), score({ level: 0 }),
    score({ className: "admin" }), score({ name: "   " }), score({ name: "x".repeat(23) })
  ]) {
    const response = await worker.fetch(post(input), envFor());
    assert.equal(response.status, 400);
  }
  const wrongType = await worker.fetch(new Request("https://api.example/scores", { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain" }, body: "{}" }), envFor());
  assert.equal(wrongType.status, 415);
  const badOrigin = await worker.fetch(new Request("https://api.example/scores?difficulty=easy", { headers: { Origin: "https://attacker.invalid" } }), envFor());
  assert.equal(badOrigin.status, 403);
  const deleteRequest = await worker.fetch(new Request("https://api.example/scores", { method: "DELETE", headers: { Origin: origin } }), envFor());
  assert.equal(deleteRequest.status, 404);
});

test("submission rate limit blocks excess writes without adding board entries", async () => {
  const { default: worker } = await loadWorker();
  const DB = makeD1();
  let response;
  for (let index = 0; index < 21; index++) response = await worker.fetch(post(score({ floors: index + 1 }), "198.51.100.77"), envFor(DB));
  assert.equal(response.status, 429);
  assert.equal(DB.scores.length, 20);
});
