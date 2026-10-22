import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useStore } from "../store";
import { pct } from "../format";

export default function PeekingPanel() {
  const p = useStore(s => s.peeking);
  if (!p) return null;
  const fprData = p.rows.map(r => ({ looks: String(r.looks), Naive: r.naive, "O'Brien-Fleming": r.obrien_fleming }));
  const trailData = Array.from({ length: p.trail_K }, (_, i) => {
    const row: Record<string, number> = {
      look: i + 1, "Naive ±1.96": p.boundaries.naive, "OBF boundary": Math.min(p.boundaries.obrien_fleming[i], 6),
    };
    p.trails.slice(0, 6).forEach((t, j) => { row[`run ${j + 1}`] = t[i]; });
    return row;
  });
  return (
    <div className="card">
      <h2>Why not stop at the first significant look?</h2>
      <p className="hint">
        {p.note} {p.reps.toLocaleString()} simulated tests on the control group, {p.n_per_group.toLocaleString()} per
        group (Monte Carlo SE about {pct(p.mc_se, 2)}).
      </p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={fprData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="looks" label={{ value: "number of looks", position: "insideBottom", offset: -4 }} />
            <YAxis domain={[0, 0.3]} ticks={[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]} tickFormatter={v => pct(Number(v), 0)} />
            <Tooltip formatter={(v) => pct(Number(v))} />
            <Legend verticalAlign="top" />
            <ReferenceLine y={0.05} stroke="#555" strokeDasharray="4 4" />
            <Line dataKey="Naive" stroke="#b3261e" strokeWidth={2} isAnimationActive={false} />
            <Line dataKey="O'Brien-Fleming" stroke="#1a5fb4" strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <h3>Six no-effect runs against the stopping boundaries (z-statistic)</h3>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={trailData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="look" />
            <YAxis domain={[-4, 6]} ticks={[-4, -2, 0, 2, 4, 6]} />
            <Tooltip />
            {[1, 2, 3, 4, 5, 6].map(n => (
              <Line key={n} dataKey={`run ${n}`} stroke="#9aa0a6" dot={false} strokeWidth={1} isAnimationActive={false} />
            ))}
            <Line dataKey="Naive ±1.96" stroke="#b3261e" dot={false} strokeDasharray="5 3" isAnimationActive={false} />
            <Line dataKey="OBF boundary" stroke="#1a5fb4" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="hint">
        Grey runs have no true effect, yet several cross the red naive line mid-way. The
        O'Brien-Fleming boundary starts very high (clipped at 6 here) and relaxes toward 2.13.
      </p>
    </div>
  );
}
