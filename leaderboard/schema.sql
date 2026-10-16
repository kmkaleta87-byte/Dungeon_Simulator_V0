CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL CHECK (length(player_name) BETWEEN 1 AND 22),
  class_name TEXT NOT NULL CHECK (class_name IN ('Warrior', 'Archer', 'Mage', 'Unchosen')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  floors INTEGER NOT NULL CHECK (floors BETWEEN 1 AND 100000),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 100000),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS scores_board_order
ON scores (difficulty, floors DESC, level DESC, created_at ASC, id ASC);

CREATE TABLE IF NOT EXISTS submission_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
);
