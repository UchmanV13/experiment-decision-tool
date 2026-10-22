import sqlite3
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cost_per_email REAL NOT NULL,
  value_per_conversion REAL,
  threshold REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)"""


def connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute(SCHEMA)
    return conn


def add_scenario(path, name, cost, value, threshold) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect(path) as c:
        cur = c.execute(
            "INSERT INTO scenarios (name, cost_per_email, value_per_conversion, threshold, created_at) "
            "VALUES (?, ?, ?, ?, ?)", (name, cost, value, threshold, now))
        row = c.execute("SELECT * FROM scenarios WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)


def list_scenarios(path, limit=50) -> list[dict]:
    with connect(path) as c:
        rows = c.execute("SELECT * FROM scenarios ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]
