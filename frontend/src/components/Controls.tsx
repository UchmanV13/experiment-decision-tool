import { useStore } from "../store";

export default function Controls() {
  const { inputs, setInputs } = useStore();
  const useValue = inputs.value_per_conversion !== null;
  return (
    <div className="card">
      <h2>Assumptions</h2>

      <label htmlFor="cost">Cost per email: <b>${inputs.cost_per_email.toFixed(3)}</b></label>
      <input id="cost" type="range" min={0} max={1.5} step={0.005} value={inputs.cost_per_email}
        onChange={e => setInputs({ cost_per_email: Number(e.target.value) })} />

      <label className="check">
        <input type="checkbox" checked={useValue}
          onChange={e => setInputs({ value_per_conversion: e.target.checked ? 100 : null })} />
        Use my own margin per conversion
      </label>
      {useValue ? (
        <>
          <label htmlFor="val">Margin per conversion: <b>${inputs.value_per_conversion}</b></label>
          <input id="val" type="range" min={0} max={300} step={1} value={inputs.value_per_conversion ?? 0}
            onChange={e => setInputs({ value_per_conversion: Number(e.target.value) })} />
          <p className="hint">Incremental conversions × your margin. Observed buyers spent about $114.</p>
        </>
      ) : (
        <p className="hint">Using observed incremental spend (revenue) from the experiment.</p>
      )}

      <label htmlFor="thr">Decision threshold (net $ per 1,000): <b>${inputs.threshold}</b></label>
      <input id="thr" type="range" min={0} max={1000} step={25} value={inputs.threshold}
        onChange={e => setInputs({ threshold: Number(e.target.value) })} />
      <p className="hint">“Send” requires the whole 95% interval to sit above this.</p>
    </div>
  );
}
