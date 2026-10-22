import { useState } from "react";
import { useStore } from "../store";

export default function Scenarios() {
  const { scenarios, saveScenario, loadScenario } = useStore();
  const [name, setName] = useState("");
  return (
    <div className="card">
      <h2>Saved scenarios</h2>
      <form onSubmit={e => { e.preventDefault(); if (name.trim()) { void saveScenario(name); setName(""); } }}>
        <input value={name} maxLength={80} placeholder="Name this scenario"
          onChange={e => setName(e.target.value)} aria-label="Scenario name" />
        <button type="submit" disabled={!name.trim()}>Save</button>
      </form>
      {scenarios.length === 0 ? <p className="hint">None yet.</p> : (
        <ul className="scen">
          {scenarios.map(s => (
            <li key={s.id}>
              <button className="link" onClick={() => loadScenario(s)}>{s.name}</button>
              <span className="hint">
                ${s.cost_per_email}/email{s.value_per_conversion !== null ? `, $${s.value_per_conversion} margin` : ""}, thr ${s.threshold}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
