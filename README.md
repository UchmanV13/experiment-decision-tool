# Experiment Decision Tool

Interactive decision tool built on a 64,000-customer randomized email test (Hillstrom, 2008).
Change cost per email, margin per conversion and a decision threshold; the app shows **net return
per 1,000 sends with a 95% interval**, a send / don't-send recommendation, and why checking an
A/B test early inflates false positives.

**Stack:** Python, Flask 3, SQLite · React 18, TypeScript, Vite, Zustand, Axios, Recharts · pytest.

> A demo on one experiment, not a production service.

## Architecture

```
React (Zustand store) --Axios--> Flask 3 JSON API --> analysis.py (pure functions) --> data/experiment.json
                                         |
                                         +--> SQLite (scenarios table, parameterized SQL)
```

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | liveness |
| `GET /api/campaigns` | arms with n, conversion rate, mean spend |
| `POST /api/net-return` | `{cost_per_email, value_per_conversion?, threshold?}` → net per 1,000 + 95% CI per comparison, recommendation |
| `GET /api/peeking` | false-positive rate by number of looks (naive vs Bonferroni / Pocock / O'Brien-Fleming), sample z-trails |
| `POST /api/scenarios`, `GET /api/scenarios` | save / list scenarios |

Errors are JSON `{"error": "..."}` with status 400 (validation), 404 or 405.

## How the numbers work

- Incremental revenue per 1,000 sends = 1,000 × (difference in mean spend per customer). Net = that minus
  1,000 × cost per email. The interval is the original bootstrap CI shifted by the (known) cost.
- If you enter a **margin per conversion**, incremental conversions × margin is used instead, with the
  Newcombe interval on the conversion difference scaled by your margin.
- Decision rule: **Send** if the whole 95% interval is above the threshold, **Don't send** if it is wholly
  below, otherwise **Inconclusive**.
- Break-even cost per email = the cost at which the point estimate (or interval lower bound) hits zero.
- Men's vs women's compares two emailed groups, so send cost cancels and is not subtracted.
- **Anchor test:** at $0.02 per email the men's email nets **$750 per 1,000 sends (95% CI $471 to $1,032)**,
  matching the A/B test project. `tests/test_api.py::test_known_result_anchor` enforces it.

## Run locally

```bash
# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest                       # 29 tests
flask --app wsgi run -p 5000

# frontend (second terminal)
cd frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```

Environment: `DATABASE_PATH` (SQLite file), `CORS_ORIGINS` (comma-separated; default `http://localhost:5173`),
`VITE_API_URL` (frontend, API base URL).

## Deploy

- **API:** Render using `render.yaml` (set `CORS_ORIGINS` to the Vercel URL). Free-tier disk is ephemeral,
  so saved scenarios reset on redeploy.
- **Frontend:** Vercel, root directory `frontend`, env var `VITE_API_URL` = the Render URL.

## Limits

- Intervals are precomputed from the original analysis; the raw 64,000 rows are not shipped, so the app
  rescales rather than re-bootstraps. Cost is a constant, so this is exact for cost; for margin it is a
  linear rescale of the conversion interval.
- Two-week spend or conversions, not profit or lifetime value. Customers were past purchasers from a 2008 test.
- Peeking numbers come from a 5,000-replication A/A simulation (Monte Carlo SE about 0.3 points).
