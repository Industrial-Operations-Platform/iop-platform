import { useEffect, useRef, useState } from 'react';
import { HealthStatus } from './HealthStatus';

const destinations = [
  { id: 'import', title: 'Import CSV', step: '01' },
  { id: 'overview', title: 'Executive Overview', step: '02' },
  { id: 'detail', title: 'Analytical detail', step: '03' },
] as const;

export function App() {
  const [location, setLocation] = useState(() => window.location.hash.slice(1) || 'import');
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const destination = destinations.find(entry => entry.id === location);

  useEffect(() => {
    const onNavigation = () => {
      navigated.current = true;
      setLocation(window.location.hash.slice(1) || 'import');
    };
    window.addEventListener('hashchange', onNavigation);
    return () => window.removeEventListener('hashchange', onNavigation);
  }, []);

  useEffect(() => {
    document.title = `${destination?.title ?? 'Page not found'} | IOP`;
    if (navigated.current) heading.current?.focus();
  }, [location, destination]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content" onClick={event => {
        event.preventDefault();
        heading.current?.focus();
      }}>Skip to content</a>
      <header>
        <p className="eyebrow">IOP / Operational Intelligence</p>
        <p className="product-title">From source to insight</p>
        <p className="intro">Local analytical proof of concept</p>
        <nav aria-label="Primary navigation">
          {destinations.map(entry => (
            <a key={entry.id} href={`#${entry.id}`} aria-current={location === entry.id ? 'page' : undefined}>
              <span aria-hidden="true">{entry.step}</span> {entry.title}
            </a>
          ))}
        </nav>
      </header>
      <main id="content">
        <p className="preview-label">Navigation preview · No business data connected</p>
        <h1 ref={heading} tabIndex={-1}>{destination?.title ?? 'Page not found'}</h1>
        <aside className="context" aria-label="Scope and filters">
          <p><strong>Scope:</strong> No organization, site or source connected.</p>
          <p><strong>Filters:</strong> Reporting dates, sector, area, equipment and message will be available with analytical data.</p>
        </aside>
        {!destination ? (
          <section><h2>This destination is unavailable</h2><p>Choose a page from the navigation or return to the start.</p><a className="action" href="#import">Go to Import CSV</a></section>
        ) : location === 'import' ? (
          <section>
            <p className="eyebrow">Prepare your source</p>
            <h2>No CSV imports yet</h2>
            <p>CSV upload, validation and duplicate reporting-date checks are not connected yet. No files can be submitted in this preview.</p>
            <a className="action" href="#overview">Explore Executive Overview <span aria-hidden="true">→</span></a>
          </section>
        ) : location === 'overview' ? (
          <section>
            <p className="eyebrow">Review the evidence</p>
            <h2>No analytical results yet</h2>
            <p>Reported frequency and accumulated alarm duration will appear here after verified imports. Missing imports do not represent zero faults.</p>
            <p className="note">A reporting date is a source label, not proof of a full 24-hour window. Accumulated alarm duration is not plant downtime.</p>
            <div className="actions"><a className="action" href="#detail">Explore analytical detail <span aria-hidden="true">→</span></a><a href="#import">Go to Import CSV</a></div>
          </section>
        ) : (
          <section>
            <p className="eyebrow">Follow the contributing records</p>
            <h2>No contributing records yet</h2>
            <p>Inspect sector, area, source equipment and messages when analytical data is connected. Source equipment labels do not establish physical asset identities.</p>
            <a className="action" href="#overview">Back to Executive Overview</a>
          </section>
        )}
        <div className="health-panel"><HealthStatus /></div>
      </main>
      <footer>IOP · Local POC · Import → Analysis → Presentation</footer>
    </div>
  );
}
