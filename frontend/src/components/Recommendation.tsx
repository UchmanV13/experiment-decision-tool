import { useStore } from "../store";

export default function Recommendation() {
  const rec = useStore(s => s.result?.recommendation);
  if (!rec) return <div className="banner">Loading…</div>;
  return <div className={`banner ${rec.action}`} role="status">{rec.message}</div>;
}
