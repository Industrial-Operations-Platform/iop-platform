import { useEffect, useRef, useState } from 'react';
import { AnalyticalStates } from './AnalyticalStates';
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
        ) : (
          <AnalyticalStates key={location} view={location === 'overview' ? 'overview' : 'detail'} />
        )}
        <div className="health-panel"><HealthStatus /></div>
      </main>
      <footer>IOP · Local POC · Import → Analysis → Presentation</footer>
    </div>
  );
}
