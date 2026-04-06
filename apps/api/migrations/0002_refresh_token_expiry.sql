ALTER TABLE sessions ADD COLUMN refresh_expires_at INTEGER;

UPDATE sessions
SET refresh_expires_at = expires_at + (29 * 24 * 60 * 60 * 1000)
WHERE refresh_expires_at IS NULL;
