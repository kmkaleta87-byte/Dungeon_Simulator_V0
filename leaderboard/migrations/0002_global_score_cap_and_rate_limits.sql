CREATE INDEX IF NOT EXISTS scores_board_order
ON scores (difficulty, floors DESC, level DESC, created_at ASC, id ASC);

CREATE TABLE IF NOT EXISTS submission_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
);

DELETE FROM scores
WHERE difficulty = 'easy'
  AND id NOT IN (
    SELECT id FROM scores WHERE difficulty = 'easy'
    ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 100
  );

DELETE FROM scores
WHERE difficulty = 'normal'
  AND id NOT IN (
    SELECT id FROM scores WHERE difficulty = 'normal'
    ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 100
  );

DELETE FROM scores
WHERE difficulty = 'hard'
  AND id NOT IN (
    SELECT id FROM scores WHERE difficulty = 'hard'
    ORDER BY floors DESC, level DESC, created_at ASC, id ASC LIMIT 100
  );
