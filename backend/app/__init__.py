import os
import tempfile

from flask import Flask, jsonify, request
from flask_cors import CORS

from . import analysis, db


def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.update(
        DATABASE=os.environ.get("DATABASE_PATH", os.path.join(tempfile.gettempdir(), "scenarios.db")),
        CORS_ORIGINS=os.environ.get("CORS_ORIGINS", "http://localhost:5173"),
    )
    if config:
        app.config.update(config)
    CORS(app, origins=[o.strip() for o in app.config["CORS_ORIGINS"].split(",")])
    db.connect(app.config["DATABASE"]).close()

    @app.errorhandler(analysis.ValidationError)
    def _bad(e):
        return jsonify(error=str(e)), 400

    @app.errorhandler(404)
    def _404(_):
        return jsonify(error="not found"), 404

    @app.errorhandler(405)
    def _405(_):
        return jsonify(error="method not allowed"), 405

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.get("/api/campaigns")
    def campaigns():
        d = analysis.load_data()
        return jsonify(source=d["source"], n_rows=d["n_rows"], window_days=d["window_days"],
                       campaigns=analysis.campaigns())

    @app.post("/api/net-return")
    def net_return():
        inputs = analysis.parse_inputs(request.get_json(silent=True))
        return jsonify(analysis.all_net_returns(inputs))

    @app.get("/api/peeking")
    def peeking():
        return jsonify(analysis.peeking())

    @app.post("/api/scenarios")
    def save_scenario():
        body = request.get_json(silent=True)
        inputs = analysis.parse_inputs(body)
        name = body.get("name")
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 80:
            raise analysis.ValidationError("'name' must be a non-empty string up to 80 characters")
        row = db.add_scenario(app.config["DATABASE"], name.strip(), inputs["cost_per_email"],
                              inputs["value_per_conversion"], inputs["threshold"])
        return jsonify(row), 201

    @app.get("/api/scenarios")
    def get_scenarios():
        return jsonify(scenarios=db.list_scenarios(app.config["DATABASE"]))

    return app
