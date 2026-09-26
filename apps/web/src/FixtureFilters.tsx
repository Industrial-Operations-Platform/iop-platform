import { useRef, useState } from 'react';
import { canonical, dimensions, initialSelection, labels, optionLabel, options, preview, validate, type Selection } from './fixture-filters';

export function FixtureFilters({ view, visible }: { view: 'overview' | 'detail'; visible: boolean }) {
  const [draft, setDraft] = useState(initialSelection);
  const [applied, setApplied] = useState(initialSelection);
  const [history, setHistory] = useState<Selection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const result = preview(applied);
  const apply = (selection: Selection, preserveHistory = false) => {
    setApplied(canonical(selection));
    setDraft(canonical(selection));
    setError(null);
    if (!preserveHistory) setHistory([]);
  };
  return (
    <section hidden={!visible} aria-label="Fictional filter preview">
      <details>
        <summary>Try shared filters with fictional data</summary>
        <p className="preview-label">Fixture preview only · No business data or analytical API connected</p>
        <p>Fictional scope: Demo organization / Demo site / Demo source. Site zone: Europe/Zurich. Fixed fixture revision: preview-1.</p>
        <form onSubmit={event => {
          event.preventDefault();
          const problem = validate(draft);
          setError(problem);
          if (!problem) apply(draft);
        }}>
          <fieldset>
            <legend>Draft reporting dates (inclusive)</legend>
            <div className="filter-dates">
              <label>From<input type="date" value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })} /></label>
              <label>Through<input type="date" value={draft.through} onChange={event => setDraft({ ...draft, through: event.target.value })} /></label>
            </div>
          </fieldset>
          <p>Select any number within each group. No selections means unrestricted; no excluded messages means no exclusions. Changes take effect together with Apply.</p>
          <div className="filter-groups">
            {dimensions.map(dimension => <fieldset key={dimension}>
              <legend>{labels[dimension]}</legend>
              {options[dimension].map(([id, label]) => <label className="filter-option" key={id}>
                <input type="checkbox" checked={draft[dimension].includes(id)} onChange={event => setDraft({ ...draft, [dimension]: event.target.checked ? [...draft[dimension], id] : draft[dimension].filter(value => value !== id) })} />
                {label}
              </label>)}
            </fieldset>)}
          </div>
          {error && <p role="alert">{error} Applied results remain unchanged.</p>}
          <div className="actions">
            <button type="submit">Apply filters</button>
            <button type="button" onClick={() => apply(initialSelection())}>Reset filters</button>
          </div>
        </form>
        <div role="status" aria-live="polite" aria-atomic="true" className="filter-results">
          <h2 ref={resultHeading} tabIndex={-1}>Applied fixture selection</h2>
          <p>Reporting dates: {applied.from} through {applied.through} (exclusive end: {result.toExclusive}).</p>
          <ul>{dimensions.map(dimension => <li key={dimension}>{labels[dimension]}: {applied[dimension].length ? applied[dimension].map(id => optionLabel(dimension, id)).join('; ') : dimension === 'excludedMessages' ? 'None' : 'All'}</li>)}</ul>
          <p>Admitted fixture dates: {result.admitted.join(', ') || 'None'}. Missing imports: {result.missing.join(', ') || 'None'}.</p>
          {!result.admitted.length ? <p>No imports in this fixture range. Missing imports are not zero-fault periods.</p> : <>
            {!result.matching.length && <p>No matching records. Imported coverage is unchanged by filters.</p>}
            <p>Fixture totals: {result.frequency} reported occurrences · {result.seconds} accumulated alarm seconds · {result.matching.length} contributing records.</p>
          </>}
        </div>
        <p className="note">Each record is a source-line aggregate. Reporting windows are unknown; accumulated alarm duration is not plant downtime. Repeated source lines count separately. Equipment labels do not identify physical assets.</p>
        {!!history.length && <button onClick={() => {
          apply(history[history.length - 1], true);
          setHistory(history.slice(0, -1));
          resultHeading.current?.focus();
        }}>Back to previous selection</button>}
        {view === 'overview' ? <div className="actions">{[...new Set(result.matching.map(row => row.areas))].map(area => <button key={area} onClick={() => {
          setHistory([...history, applied]);
          apply({ ...applied, areas: [area] }, true);
          window.location.hash = 'detail';
        }}>Inspect {optionLabel('areas', area)}</button>)}</div> : <ul aria-label="Fixture contributing records">{result.matching.map(row => <li key={row.id}>
          {row.id} · {row.date} · {optionLabel('equipment', row.equipment)} · {optionLabel('messages', row.messages)} · {row.frequency} reported occurrences · {row.seconds} seconds
        </li>)}</ul>}
      </details>
    </section>
  );
}
