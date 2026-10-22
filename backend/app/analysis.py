"""Pure functions: net return per 1,000 sends from stored experiment results.

The raw 64,000-row file is not shipped with this demo, so intervals are the ones
computed in the original analysis (bootstrap percentile for spend, Newcombe for
conversion). Cost is a known constant, so it shifts the interval without
changing its width; value-per-conversion scales the conversion interval.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "experiment.json"
SENDS = 1000


class ValidationError(ValueError):
    pass


@lru_cache(maxsize=1)
def load_data(path: str = str(DATA_PATH)) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _num(body: dict, key: str, lo: float, hi: float, required=True, default=None):
    v = body.get(key, default)
    if v is None:
        if required:
            raise ValidationError(f"'{key}' is required")
        return None
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        raise ValidationError(f"'{key}' must be a number")
    if v != v or v in (float("inf"), float("-inf")):
        raise ValidationError(f"'{key}' must be finite")
    if not lo <= v <= hi:
        raise ValidationError(f"'{key}' must be between {lo} and {hi}")
    return float(v)


def parse_inputs(body: dict | None) -> dict:
    if not isinstance(body, dict):
        raise ValidationError("JSON object body required")
    return {
        "cost_per_email": _num(body, "cost_per_email", 0, 5),
        "value_per_conversion": _num(body, "value_per_conversion", 0, 10000, required=False),
        "threshold": _num(body, "threshold", -1e6, 1e6, required=False, default=0.0) or 0.0,
    }


def decide(ci_low: float, ci_high: float, threshold: float) -> str:
    if ci_low > threshold:
        return "send"
    if ci_high < threshold:
        return "do_not_send"
    return "inconclusive"


def net_return(treated: str, reference: str, cost_per_email: float,
               value_per_conversion: float | None = None, threshold: float = 0.0,
               data: dict | None = None) -> dict:
    data = data or load_data()
    c = next((c for c in data["contrasts"]
              if c["treated"] == treated and c["reference"] == reference), None)
    if c is None:
        raise ValidationError(f"no contrast {treated} vs {reference}")

    if value_per_conversion is None:
        basis, m = "observed_spend", c["spend"]
        scale = SENDS
    else:
        basis, m = "value_per_conversion", c["conversion"]
        scale = SENDS * value_per_conversion

    incr, lo, hi = m["diff"] * scale, m["ci_low"] * scale, m["ci_high"] * scale
    # Emailing costs money only relative to no email. Men's vs women's: both arms
    # are emailed, so send cost cancels.
    cost = SENDS * cost_per_email if reference == "control" else 0.0
    net, nlo, nhi = incr - cost, lo - cost, hi - cost

    # cost per email at which the point estimate / lower bound just breaks even
    be_point = incr / SENDS if reference == "control" else None
    be_low = lo / SENDS if reference == "control" else None

    return {
        "treated": treated, "reference": reference,
        "label": data["arms"][treated]["label"] + " vs " + data["arms"][reference]["label"].lower(),
        "basis": basis, "ci_method": m["ci_method"],
        "incremental_per_1000": incr, "send_cost_per_1000": cost,
        "net_per_1000": net, "net_ci_low": nlo, "net_ci_high": nhi,
        "breakeven_cost_per_email": be_point, "breakeven_cost_per_email_ci_low": be_low,
        "decision": decide(nlo, nhi, threshold),
    }


def all_net_returns(inputs: dict, data: dict | None = None) -> dict:
    data = data or load_data()
    results = [net_return(c["treated"], c["reference"], inputs["cost_per_email"],
                          inputs["value_per_conversion"], inputs["threshold"], data)
               for c in data["contrasts"]]
    vs_control = [r for r in results if r["reference"] == "control"]
    best = max(vs_control, key=lambda r: r["net_per_1000"])
    sendable = [r for r in vs_control if r["decision"] == "send"]
    if sendable:
        pick = max(sendable, key=lambda r: r["net_per_1000"])
        rec = {"action": "send", "campaign": pick["treated"],
               "message": f"Send the {data['arms'][pick['treated']]['label'].lower()}: the whole 95% interval clears the threshold."}
    elif all(r["decision"] == "do_not_send" for r in vs_control):
        rec = {"action": "do_not_send", "campaign": None,
               "message": "Do not send: both campaigns are below the threshold with 95% confidence."}
    else:
        rec = {"action": "inconclusive", "campaign": best["treated"],
               "message": f"Inconclusive: the {data['arms'][best['treated']]['label'].lower()} looks best, but its interval straddles the threshold."}
    return {"inputs": inputs, "results": results, "recommendation": rec}


def campaigns(data: dict | None = None) -> list[dict]:
    data = data or load_data()
    out = []
    for key, a in data["arms"].items():
        out.append({"id": key, **a})
    return out


def peeking(data: dict | None = None) -> dict:
    data = data or load_data()
    p = data["peeking"]
    return {
        "outcome": p["outcome"], "reps": p["reps"], "n_per_group": p["n_per_group"],
        "mc_se": p["mc_se"],
        "rows": [{"looks": k, **p["fpr"][str(k)]} for k in p["looks"]],
        "trails": p["trails"], "trail_K": p["trail_K"],
        "boundaries": p["trail_boundaries"],
        "note": "A/A simulation: no true effect, so every rejection is a false positive.",
    }
