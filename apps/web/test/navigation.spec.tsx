import { act, render, screen, within } from '@testing-library/react';
import { App } from '../src/App';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
});

it('keeps the health connection mounted and shows unavailable scope across destinations', async () => {
  render(<App />);
  await screen.findByText('API is reachable.');
  for (const [hash, title] of [['overview', 'Executive Overview'], ['detail', 'Analytical detail'], ['import', 'Import CSV']]) {
    act(() => {
      window.history.replaceState(null, '', `/#${hash}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { level: 1, name: title })).toHaveFocus();
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(/No organization, site or source connected/)).toBeInTheDocument();
  }
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('does not interpret an unknown fragment as a business destination', async () => {
  window.history.replaceState(null, '', '/#admin');
  render(<App />);
  await screen.findByText('API is reachable.');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  expect(screen.getByRole('link', { name: 'Go to Import CSV' })).toHaveAttribute('href', '#import');
});
