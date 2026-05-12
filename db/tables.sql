DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS game CASCADE;
DROP TABLE IF EXISTS player CASCADE;

CREATE TABLE player (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  elo INT NOT NULL DEFAULT 1200,
  games_played INT NOT NULL DEFAULT 0,
  board_theme VARCHAR(20) NOT NULL DEFAULT 'neon',
  piece_theme VARCHAR(40) NOT NULL DEFAULT 'kiwen-suwi-neon-glowy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE game (
  id SERIAL PRIMARY KEY,
  white_id INT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  black_id INT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  result VARCHAR(10) NOT NULL CHECK (result IN ('white', 'black', 'draw')),
  white_elo_before INT NOT NULL,
  black_elo_before INT NOT NULL,
  white_elo_after  INT NOT NULL,
  black_elo_after  INT NOT NULL,
  end_reason VARCHAR(20) NOT NULL CHECK (end_reason IN ('checkmate','stalemate','threefold','insufficient','fifty_move','resign','timeout','disconnect')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX game_white_idx ON game(white_id, created_at DESC);
CREATE INDEX game_black_idx ON game(black_id, created_at DESC);
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id INT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX session_user_id_idx ON session(user_id);
