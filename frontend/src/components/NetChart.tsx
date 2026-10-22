import {
  Bar, BarChart, CartesianGrid, Cell, ErrorBar, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useStore } from "../store";
import { usd } from "../format";

export default function NetChart() {
  const result = useStore(s => s.result);
  if (!result) return null;
  const data = result.results.map(r => ({
    name: r.label,
    net: Math.round(r.net_per_1000),
    err: [r.net_per_1000 - r.net_ci_low, r.net_ci_high - r.net_per_1000],
    fill: r.net_ci_low > result.inputs.threshold ? "#1a7f4b" : r.net_ci_high < result.inputs.threshold ? "#b3261e" : "#8a8f98",
  }));
  return (
    <div className="card">
      <h2>Point estimate and 95% interval</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => usd(Number(v))} />
            <Tooltip formatter={(v) => usd(Number(v))} />
            <ReferenceLine y={result.inputs.threshold} stroke="#333" strokeDasharray="4 4" />
            <Bar dataKey="net" isAnimationActive={false}>
              {data.map(d => <Cell key={d.name} fill={d.fill} />)}
              <ErrorBar dataKey="err" width={6} stroke="#222" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="hint">Green: whole interval above threshold. Red: below. Grey: straddles it.</p>
    </div>
  );
}
