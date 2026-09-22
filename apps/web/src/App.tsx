import { useEffect, useState } from 'react';
import { getHealth } from './api/health';

export function App() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState('loading');
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (active) setState('error');
    }, 5000);
    getHealth(controller.signal)
      .then(() => { if (active && !controller.signal.aborted) setState('ready'); })
      .catch(() => { if (active) setState('error'); })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  return (
    <main>
      <p className="eyebrow">Industrial Operations Platform</p>
      <h1>Local application</h1>
      <p className="intro">A starting point for the analytical proof of concept.</p>
      <section aria-labelledby="health-title">
        <h2 id="health-title">API connection</h2>
        <p role="status" aria-live="polite">
          {state === 'loading' ? 'Checking API…' : state === 'ready' ? 'API is reachable.' : 'API is unavailable. Start the local API and try again.'}
        </p>
        <button disabled={state === 'loading'} onClick={() => { setState('loading'); setAttempt(value => value + 1); }}>
          Check again
        </button>
        <p className="note">This checks process liveness only. Storage, CSV import and analysis are not available yet.</p>
      </section>
    </main>
  );
}
