import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../src/App';

const fetchMock = jest.fn();
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });
afterEach(() => jest.useRealTimers());

it('shows loading then actual health success', async () => {
  let resolve!: (value: unknown) => void;
  fetchMock.mockReturnValue(new Promise(r => { resolve = r; }));
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Checking API');
  expect(screen.getByRole('button')).toBeDisabled();
  await act(async () => resolve({ ok: true, json: async () => ({ status: 'ok' }) }));
  expect(screen.getByRole('status')).toHaveTextContent('API is reachable');
  expect(screen.getByRole('button')).toBeEnabled();
});

it('shows safe failure and allows recovery', async () => {
  fetchMock.mockRejectedValueOnce(new Error('private server diagnostic'));
  render(<App />);
  expect(await screen.findByText(/API is unavailable/)).toBeInTheDocument();
  expect(screen.queryByText(/private server diagnostic/)).not.toBeInTheDocument();
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok' }) });
  fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
  expect(await screen.findByText('API is reachable.')).toBeInTheDocument();
});

it('bounds a stalled request and aborts it after five seconds', async () => {
  jest.useFakeTimers();
  fetchMock.mockReturnValue(new Promise(() => {}));
  render(<App />);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toHaveTextContent('API is unavailable');
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});

it('aborts an in-flight request on unmount', () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  const { unmount } = render(<App />);
  const signal = fetchMock.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
});
