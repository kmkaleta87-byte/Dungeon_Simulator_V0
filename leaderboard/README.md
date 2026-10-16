# Global leaderboard setup

The website is static GitHub Pages content, so it cannot safely write to SQL by itself. This folder contains the existing Cloudflare Worker API and D1 SQLite-compatible schema. The Worker is the only component that accesses D1; the public browser contains only the Worker URL, never a database credential.

The game’s difficulty keys are `easy`, `normal`, and `hard` (the UI labels `normal` as Normal, not Medium). A score is the run’s number of floors cleared, and is submitted once when the run ends. Personal bests are separate browser-local records and are updated before the network request.

## Global board behavior

- D1 keeps only the top 100 rows for each difficulty, at most 300 score rows total.
- A submission qualifies if the board has fewer than 100 records, or if its floors cleared exceed the cutoff, or it ties the cutoff floors but has a higher level.
- Exact ties on both score and level do not displace the existing entry. Results sort by floors descending, level descending, then earliest submission and row ID ascending.
- Eligibility, insert, and trimming run in one D1 `batch()` transaction. The server, not the browser, decides eligibility. Non-qualifying scores return `result: "not_eligible"` and are not stored.
- Input validation rejects malformed/oversized requests, unsupported difficulties/classes, out-of-range scores, and invalid names. Submissions are rate-limited to 20 per hashed client IP per hour. The raw IP is not stored; old rate-limit buckets are periodically cleaned.
- Client-side local bests are device/browser-specific. They are not authenticated, do not sync across devices, and may be lost if browser data is cleared.

## First-time Cloudflare setup

1. Create a Cloudflare account and install Node.js if needed.
2. Open a terminal in this `leaderboard` folder and run `npx wrangler login`.
3. Create the D1 database: `npx wrangler d1 create dungeon-simulation-leaderboard`.
4. Copy the database ID Wrangler returns into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
5. Apply the initial schema to the remote database: `npx wrangler d1 execute dungeon-simulation-leaderboard --remote --file=schema.sql`.
6. Set `ALLOWED_ORIGINS` in `wrangler.toml` to the exact origins serving the game. Keep the published site origin (for this project, `https://kmkaleta87-byte.github.io`) and add only the local development origins you use. Do not include a path or trailing slash.
7. Deploy the Worker from this folder with `npx wrangler deploy`.
8. Set `window.LEADERBOARD_API` in the repository-root `leaderboard-config.js` to the deployed Worker URL, for example `https://dungeon-simulation-leaderboard.<your-subdomain>.workers.dev`.
9. Publish the updated GitHub Pages files. Confirm both the Pages origin and Worker URL match the values above.

## Existing D1 database migration

If the database was created and initialized with the earlier leaderboard version, its `scores` table already has the required columns. Apply this additive/cleanup migration once:

`npx wrangler d1 execute dungeon-simulation-leaderboard --remote --file=migrations/0002_global_score_cap_and_rate_limits.sql`

The migration creates the rate-limit table and score index, and trims historical rows beyond the top 100 of each difficulty. It permanently removes excess historical score rows, so inspect/export any data you need before choosing to apply it. The code changes do not execute this migration or connect to your Cloudflare account.

## Endpoints and local checks

- `GET /scores?difficulty=easy|normal|hard` returns up to 100 rows.
- `POST /scores` receives `{ name, className, difficulty, floors, level }` and returns `accepted`, `not_eligible`, or an error result.
- Run local tests with `node --test tests/*.test.js` from the repository root. These tests use an in-memory D1 mock; they do not deploy or access Cloudflare.

## Security limitation

Server validation ensures inputs are well-formed and enforces top-100 eligibility and storage limits, but it cannot prove the reported floor was legitimately reached. The game simulation runs in the browser, so a determined player can modify their client and submit a fabricated plausible run. CORS, input checks, and rate limits reduce casual abuse but are not full anti-cheat or authentication. Full run verification would require moving trusted gameplay or replay validation server-side.
