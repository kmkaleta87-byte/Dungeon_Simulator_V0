const ALLOWED_DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const ALLOWED_CLASSES = new Set(["Warrior", "Archer", "Mage", "Unchosen"]);
const MAX_FLOORS = 100000;
const MAX_LEVEL = 100000;
const MAX_BODY_BYTES = 2048;
const MAX_NAME_LENGTH = 22;
const BOARD_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {};
}

function validScore(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  return {
    name,
    className: input?.className,
    difficulty: input?.difficulty,
    floors: input?.floors,
    level: input?.level,
    valid: Boolean(name) && name.length <= MAX_NAME_LENGTH && !/[\u0000-\u001f\u007f]/.test(name) &&
      ALLOWED_DIFFICULTIES.has(input?.difficulty) && ALLOWED_CLASSES.has(input?.className) &&
      Number.isSafeInteger(input?.floors) && input.floors >= 1 && input.floors <= MAX_FLOORS &&
      Number.isSafeInteger(input?.level) && input.level >= 1 && input.level <= MAX_LEVEL
  };
}

async function rateLimitStatements(request, now) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const key = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;
  return [
    { sql: "INSERT INTO submission_limits (bucket_key, window_start, request_count) VALUES (?, ?, 1) ON CONFLICT(bucket_key) DO UPDATE SET window_start = excluded.window_start, request_count = CASE WHEN submission_limits.window_start = excluded.window_start THEN submission_limits.request_count + 1 ELSE 1 END", values: [key, windowStart] },
    { sql: "SELECT request_count FROM submission_limits WHERE bucket_key = ? AND window_start = ?", values: [key, windowStart] },
    { sql: "DELETE FROM submission_limits WHERE window_start < ?", values: [windowStart - RATE_WINDOW_MS] }
  ];
}

async function readJsonLimited(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty_body");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("body_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (!cors["Access-Control-Allow-Origin"]) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } });
    }
    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed" }, 403);
    if (url.pathname === "/scores" && request.method === "GET") {
      const difficulty = url.searchParams.get("difficulty");
      if (!ALLOWED_DIFFICULTIES.has(difficulty)) return json({ error: "Invalid difficulty" }, 400, cors);
      try {
        const result = await env.DB.prepare(
          "SELECT player_name AS name, class_name AS className, difficulty, floors, level, created_at AS date FROM scores WHERE difficulty = ? ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 100"
        ).bind(difficulty).all();
        return json({ scores: result.results }, 200, cors);
      } catch {
        return json({ error: "Leaderboard unavailable" }, 503, cors);
      }
    }
    if (url.pathname === "/scores" && request.method === "POST") {
      const length = Number(request.headers.get("Content-Length") || 0);
      if (length > MAX_BODY_BYTES) return json({ error: "Request too large" }, 413, cors);
      const mediaType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (mediaType !== "application/json") return json({ error: "Content-Type must be application/json" }, 415, cors);
      let input;
      try { input = await readJsonLimited(request); }
      catch (error) { return json({ error: error.message === "body_too_large" ? "Request too large" : "Invalid JSON" }, error.message === "body_too_large" ? 413 : 400, cors); }
      const score = validScore(input);
      if (!score.valid) return json({ error: "Invalid score" }, 400, cors);
      const timestamp = Date.now();
      try {
        const rateStatements = await rateLimitStatements(request, timestamp);
        const rateResults = await env.DB.batch(rateStatements.slice(0, 2).map(statement =>
          env.DB.prepare(statement.sql).bind(...statement.values)
        ));
        const requestCount = rateResults[1]?.results?.[0]?.request_count;
        if (!Number.isInteger(requestCount) || requestCount > RATE_LIMIT) {
          return json({ error: "Submission rate limit reached. Try again later.", result: "rate_limited" }, 429, cors);
        }
        await env.DB.prepare(rateStatements[2].sql).bind(...rateStatements[2].values).run();

        // One D1 batch is one transaction. Eligibility check, insertion and trimming
        // are serialized together so simultaneous submissions cannot exceed 100.
        const result = await env.DB.batch([
          env.DB.prepare(
            "INSERT INTO scores (player_name, class_name, difficulty, floors, level, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM scores WHERE difficulty = ?) < ? OR EXISTS (SELECT 1 FROM (SELECT floors AS cutoff_floors, level AS cutoff_level FROM scores WHERE difficulty = ? ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 1 OFFSET 99) cutoff WHERE cutoff.cutoff_floors < ? OR (cutoff.cutoff_floors = ? AND cutoff.cutoff_level < ?))"
          ).bind(score.name, score.className, score.difficulty, score.floors, score.level, timestamp, score.difficulty, BOARD_LIMIT, score.difficulty, score.floors, score.floors, score.level),
          env.DB.prepare(
            "DELETE FROM scores WHERE difficulty = ? AND id NOT IN (SELECT id FROM scores WHERE difficulty = ? ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 100)"
          ).bind(score.difficulty, score.difficulty)
        ]);
        const inserted = Number(result[0]?.meta?.changes || 0) > 0;
        return json({ result: inserted ? "accepted" : "not_eligible", accepted: inserted }, inserted ? 201 : 200, cors);
      } catch {
        return json({ error: "Score could not be saved" }, 503, cors);
      }
    }
    return json({ error: "Not found" }, 404, cors);
  }
};
