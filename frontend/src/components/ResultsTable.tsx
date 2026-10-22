import { useStore } from "../store";
import { usd } from "../format";

const DECISION = { send: "Send", do_not_send: "Don't send", inconclusive: "Inconclusive" } as const;

// Head-to-head rows compare two emailed groups, so "send / don't send" is the wrong wording.
function callLabel(r: { reference: string; decision: keyof typeof DECISION }) {
  if (r.reference === "control") return DECISION[r.decision];
  return { send: "Women's better", do_not_send: "Men's better", inconclusive: "No clear winner" }[r.decision];
}

export default function ResultsTable() {
  const result = useStore(s => s.result);
  if (!result) return null;
  return (
    <div className="card">
      <h2>Net return per 1,000 sends</h2>
      <table>
        <thead>
          <tr><th>Comparison</th><th>Net</th><th>95% CI</th><th>Break-even cost / email</th><th>Call</th></tr>
        </thead>
        <tbody>
          {result.results.map(r => (
            <tr key={`${r.treated}-${r.reference}`}>
              <td>{r.label}</td>
              <td className="num">{usd(r.net_per_1000)}</td>
              <td className="num">{usd(r.net_ci_low)} to {usd(r.net_ci_high)}</td>
              <td className="num">
                {r.breakeven_cost_per_email === null ? "n/a (both emailed)" :
                  `${usd(r.breakeven_cost_per_email, 2)} (CI low ${usd(r.breakeven_cost_per_email_ci_low ?? 0, 2)})`}
              </td>
              <td><span className={`pill ${r.decision}`}>{callLabel(r)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Men's vs women's compares two emailed groups, so send cost cancels out. Break-even is the
        cost per email at which the point estimate (or interval lower bound) reaches zero.
      </p>
    </div>
  );
}
