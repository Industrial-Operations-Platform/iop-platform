import { useState } from 'react';

type PreviewState = 'disconnected' | 'loading' | 'error' | 'no-imports' | 'no-matches';

export function AnalyticalStates({ view }: { view: 'overview' | 'detail' }) {
  const [state, setState] = useState<PreviewState>('disconnected');
  return (
    <section aria-label="Analytical state">
      <p className="eyebrow">{view === 'overview' ? 'Review the evidence' : 'Follow the contributing records'}</p>
      <details className="state-preview">
        <summary>Preview UI states</summary>
        <p id="preview-help">Simulation only. These controls do not load data or change real filters. Select another state to end the loading preview.</p>
        <label htmlFor="preview-state">Simulated analytical state</label>
        <select id="preview-state" aria-describedby="preview-help" value={state} onChange={event => setState(event.target.value as PreviewState)}>
          <option value="disconnected">Not connected</option>
          <option value="loading">Loading</option>
          <option value="error">Request failed</option>
          <option value="no-imports">No imported coverage</option>
          <option value="no-matches">No matching records</option>
        </select>
      </details>
      {state !== 'disconnected' && <p className="preview-label">Simulated state · No business request was sent</p>}
      <div role="status" aria-live="polite" aria-atomic="true">
        {state === 'disconnected' && <>
          <h2>{view === 'overview' ? 'No analytical results yet' : 'No contributing records yet'}</h2>
          <p>Analytical data is not connected. Import availability and results cannot be determined yet.</p>
        </>}
        {state === 'loading' && <>
          <h2>Loading analytical data…</h2>
          <p>Results are pending. No totals are available to present.</p>
        </>}
        {state === 'error' && <>
          <h2>Analytical data is unavailable</h2>
          <p>The request could not be completed. Try again; an error does not mean there are no records.</p>
        </>}
        {state === 'no-imports' && <>
          <h2>No imported coverage</h2>
          <p>No verified imports cover the selected reporting dates. Missing imports do not represent zero faults.</p>
        </>}
        {state === 'no-matches' && <>
          <h2>No matching records</h2>
          <p>Imported data is available in this example, but no records match the selected filters. Review the filters; this does not establish a fault-free period.</p>
        </>}
      </div>
      {state === 'error' && <button onClick={() => setState('loading')}>Simulate retry</button>}
      {state === 'no-matches' && <button onClick={() => setState('disconnected')}>Reset state preview</button>}
      <p className="note">A reporting date is a source label, not proof of a full 24-hour window. Accumulated alarm duration is not plant downtime.</p>
      {view === 'detail' && <p className="note">Source equipment labels do not establish physical asset identities.</p>}
      <div className="actions">
        <a className="action" href={view === 'overview' ? '#detail' : '#overview'}>{view === 'overview' ? 'Explore analytical detail' : 'Back to Executive Overview'}</a>
        <a href="#import">Go to Import CSV</a>
      </div>
    </section>
  );
}
