import { useStore } from "../store";

export default function Recommendation() {
  const rec = useStore(s => s.result?.recommendation);
  if (!rec) return <div className="skeleton" aria-hidden="true" />;
  return <div className={`banner ${rec.action}`} role="status">{rec.message}</div>;
}
