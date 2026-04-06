CREATE TABLE IF NOT EXISTS sessions (
  access_token TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  profile_nickname TEXT,
  profile_avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT PRIMARY KEY,
  membership_plan_id TEXT,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
