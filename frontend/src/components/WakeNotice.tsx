import { useStore } from "../store";

// Shown until the first API response arrives. The hosted API runs on a free tier that sleeps
// when idle, so the first request can take up to a minute.
export default function WakeNotice() {
  const ready = useStore(s => s.result !== null);
  const error = useStore(s => s.error);
  const init = useStore(s => s.init);
  if (ready) return null;

  if (error) {
    return (
      <div className="error" role="alert">
        We couldn't reach the analysis service: {error}.
        <button onClick={() => void init()}>Try again</button>
      </div>
    );
  }
  return (
    <div className="notice" role="status">
      <div className="spinner" aria-hidden="true" />
      <div>
        <h2>Starting the analysis service</h2>
        <p>
          This demo runs on a free hosting tier, so the first load after a period of inactivity can
          take up to a minute while the server starts. Thank you for your patience. Once it is
          running, results update instantly.
        </p>
      </div>
    </div>
  );
}
