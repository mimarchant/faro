-- Esquema de la base de datos D1 para el histórico de análisis.
-- Cada fila es un análisis de una URL en una estrategia (mobile/desktop).

CREATE TABLE IF NOT EXISTS analyses (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  url            TEXT NOT NULL,
  strategy       TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  perf           INTEGER,
  a11y           INTEGER,
  best_practices INTEGER,
  seo            INTEGER,
  lcp            REAL,  -- ms
  fcp            REAL,  -- ms
  cls            REAL,  -- sin unidad
  tbt            REAL,  -- ms
  si             REAL,  -- ms
  tti            REAL   -- ms
);

CREATE INDEX IF NOT EXISTS idx_analyses_url_strategy_created
  ON analyses (url, strategy, created_at);
