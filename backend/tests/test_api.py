import pytest

from app import analysis, create_app


@pytest.fixture
def client(tmp_path):
    app = create_app({"DATABASE": str(tmp_path / "t.db"), "TESTING": True})
    return app.test_client()


def test_known_result_anchor():
    """Credibility anchor: matches the A/B test project's readout (~$750 net per
    1,000 sends at $0.02/email, 95% CI $471-$1,032)."""
    r = analysis.net_return("mens", "control", 0.02)
    assert r["net_per_1000"] == pytest.approx(749.83, abs=0.01)
    assert r["net_ci_low"] == pytest.approx(471.18, abs=0.01)
    assert r["net_ci_high"] == pytest.approx(1031.67, abs=0.01)
    w = analysis.net_return("womens", "control", 0.02)
    assert w["net_per_1000"] == pytest.approx(404.41, abs=0.01)


def test_cost_shifts_interval_not_width():
    a = analysis.net_return("mens", "control", 0.0)
    b = analysis.net_return("mens", "control", 0.5)
    assert a["net_per_1000"] - b["net_per_1000"] == pytest.approx(500)
    assert (a["net_ci_high"] - a["net_ci_low"]) == pytest.approx(b["net_ci_high"] - b["net_ci_low"])


def test_head_to_head_has_no_send_cost():
    r = analysis.net_return("womens", "mens", 0.5)
    assert r["send_cost_per_1000"] == 0
    assert r["net_per_1000"] == pytest.approx(-345.41, abs=0.01)


def test_value_per_conversion_mode():
    r = analysis.net_return("mens", "control", 0.02, value_per_conversion=100)
    assert r["basis"] == "value_per_conversion"
    assert r["incremental_per_1000"] == pytest.approx(1000 * 0.0068050065 * 100)


def test_decision_rule():
    assert analysis.decide(1, 5, 0) == "send"
    assert analysis.decide(-5, -1, 0) == "do_not_send"
    assert analysis.decide(-1, 5, 0) == "inconclusive"
    assert analysis.decide(1, 5, 2) == "inconclusive"


def test_breakeven_cost():
    r = analysis.net_return("mens", "control", 0.02)
    assert r["breakeven_cost_per_email"] == pytest.approx(0.7698, abs=1e-4)
    assert r["breakeven_cost_per_email_ci_low"] == pytest.approx(0.4912, abs=1e-4)


def test_health(client):
    assert client.get("/api/health").json == {"status": "ok"}


def test_campaigns(client):
    j = client.get("/api/campaigns").json
    assert {c["id"] for c in j["campaigns"]} == {"control", "mens", "womens"}
    assert j["n_rows"] == 64000
    assert sum(c["n"] for c in j["campaigns"]) == 64000


def test_net_return_endpoint(client):
    r = client.post("/api/net-return", json={"cost_per_email": 0.02})
    assert r.status_code == 200
    j = r.json
    assert j["recommendation"]["action"] == "send"
    assert j["recommendation"]["campaign"] == "mens"
    assert len(j["results"]) == 3


def test_high_cost_flips_recommendation(client):
    j = client.post("/api/net-return", json={"cost_per_email": 1.5}).json
    assert j["recommendation"]["action"] == "do_not_send"


def test_threshold_makes_inconclusive(client):
    j = client.post("/api/net-return", json={"cost_per_email": 0.02, "threshold": 600}).json
    assert j["recommendation"]["action"] == "inconclusive"


@pytest.mark.parametrize("body", [
    {}, {"cost_per_email": -1}, {"cost_per_email": "a"}, {"cost_per_email": True},
    {"cost_per_email": 99}, {"cost_per_email": 0.02, "value_per_conversion": -3},
    {"cost_per_email": 0.02, "threshold": "x"}, [1, 2],
])
def test_net_return_validation(client, body):
    r = client.post("/api/net-return", json=body)
    assert r.status_code == 400 and "error" in r.json


def test_non_json_body(client):
    assert client.post("/api/net-return", data="nope").status_code == 400


def test_peeking(client):
    j = client.get("/api/peeking").json
    row20 = next(r for r in j["rows"] if r["looks"] == 20)
    assert row20["naive"] == pytest.approx(0.2574)
    assert row20["obrien_fleming"] == pytest.approx(0.0476)
    assert len(j["boundaries"]["obrien_fleming"]) == j["trail_K"] == 20
    assert all(len(t) == 20 for t in j["trails"])


def test_scenarios_roundtrip(client):
    assert client.get("/api/scenarios").json["scenarios"] == []
    r = client.post("/api/scenarios", json={"name": "Base", "cost_per_email": 0.02, "threshold": 100})
    assert r.status_code == 201 and r.json["id"] == 1
    client.post("/api/scenarios", json={"name": "Pricey", "cost_per_email": 0.5, "value_per_conversion": 90})
    rows = client.get("/api/scenarios").json["scenarios"]
    assert [x["name"] for x in rows] == ["Pricey", "Base"]
    assert rows[0]["value_per_conversion"] == 90 and rows[1]["value_per_conversion"] is None


def test_scenario_sql_injection_is_inert(client):
    nasty = "x'); DROP TABLE scenarios;--"
    assert client.post("/api/scenarios", json={"name": nasty, "cost_per_email": 0.02}).status_code == 201
    assert client.get("/api/scenarios").json["scenarios"][0]["name"] == nasty


@pytest.mark.parametrize("name", ["", "   ", None, 5, "x" * 81])
def test_scenario_name_validation(client, name):
    r = client.post("/api/scenarios", json={"name": name, "cost_per_email": 0.02})
    assert r.status_code == 400


def test_404_json(client):
    r = client.get("/api/nope")
    assert r.status_code == 404 and r.json["error"]
