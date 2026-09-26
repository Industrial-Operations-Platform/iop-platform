import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../src/App';

function navigate(hash: string) {
  act(() => {
    window.history.replaceState(null, '', `/#${hash}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}
beforeEach(() => {
  window.history.replaceState(null, '', '/#overview');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
});

it('applies atomically, rejects conflicts and preserves selection through all navigation', async () => {
  render(<App />);
  await screen.findByText('API is reachable.');
  fireEvent.click(screen.getByText('Try shared filters with fictional data'));
  const region = screen.getByRole('region', { name: 'Fictional filter preview' });
  const excluded = within(region).getByRole('group', { name: 'Excluded messages' });
  fireEvent.click(within(excluded).getByLabelText('Stopped · Alarm · Operations'));
  expect(within(region).getByText(/Fixture totals: 8 reported occurrences/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  expect(within(region).getByText(/Fixture totals: 4 reported occurrences · 90000/)).toBeInTheDocument();
  navigate('import');
  expect(screen.queryByRole('region', { name: 'Fictional filter preview' })).not.toBeInTheDocument();
  navigate('detail');
  expect(within(region).getByText(/Fixture totals: 4 reported occurrences · 90000/)).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Fixture contributing records' }).children).toHaveLength(1);
  fireEvent.click(within(screen.getByRole('group', { name: 'Included messages' })).getByLabelText('Stopped · Alarm · Operations'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByRole('alert')).toHaveTextContent('both included and excluded');
  expect(within(region).getByText(/Fixture totals: 4 reported occurrences · 90000/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(within(region).getByText(/Fixture totals: 8 reported occurrences/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('narrows drill-down and restores dates, exclusions and other selections on return', async () => {
  render(<App />);
  await screen.findByText('API is reachable.');
  fireEvent.click(screen.getByText('Try shared filters with fictional data'));
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-06-26' } });
  fireEvent.click(within(screen.getByRole('group', { name: 'Excluded messages' })).getByLabelText('Check · Warning · Inspection'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  fireEvent.click(screen.getByRole('button', { name: 'Inspect Area A' }));
  navigate('detail');
  expect(screen.getByText('Areas: Area A')).toBeInTheDocument();
  expect(screen.getByText(/Fixture totals: 6 reported occurrences · 200/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back to previous selection' }));
  expect(screen.getByText('Areas: All')).toBeInTheDocument();
  expect(screen.getByLabelText('From')).toHaveValue('2026-06-26');
  expect(screen.getByText('Excluded messages: Check · Warning · Inspection')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Applied fixture selection' })).toHaveFocus();
});
