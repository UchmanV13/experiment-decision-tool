import { useEffect } from "react";
import { useStore } from "./store";
import Controls from "./components/Controls";
import Recommendation from "./components/Recommendation";
import ResultsTable from "./components/ResultsTable";
import NetChart from "./components/NetChart";
import PeekingPanel from "./components/PeekingPanel";
import Scenarios from "./components/Scenarios";
import WakeNotice from "./components/WakeNotice";

export default function App() {
  const init = useStore(s => s.init);
  const error = useStore(s => s.error);
  const campaigns = useStore(s => s.campaigns);
  const hasResult = useStore(s => s.result !== null);
  useEffect(() => { void init(); }, [init]);

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Marketing experimentation</p>
        <h1>Experiment Decision Tool</h1>
        <p className="sub">
          Should we send the email? Change the economics and see net return per 1,000 sends with a
          95% interval. Data: {campaigns ? `${campaigns.n_rows.toLocaleString()}-customer randomized test` : "…"}{" "}
          (Hillstrom, 2008).
        </p>
      </header>
      <WakeNotice />
      {error && hasResult && <div className="error" role="alert">{error}</div>}
      <main className="grid">
        <aside><Controls /><Scenarios /></aside>
        <section>
          <Recommendation />
          <ResultsTable />
          <NetChart />
          <PeekingPanel />
        </section>
      </main>
      <footer>
        Demo on a single experiment, not a production service. Two-week spend, not profit; the send
        cost is an assumption you set. Intervals come from the original analysis (bootstrap for
        spend, Newcombe for conversion).
      </footer>
    </div>
  );
}
