import { getHealth } from '../src/api/health';

const fetchMock = jest.fn();
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });

it('consumes the public relative route and tolerates additive fields', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', extra: true }) });
  const signal = new AbortController().signal;
  await expect(getHealth(signal)).resolves.toEqual({ status: 'ok' });
  expect(fetchMock).toHaveBeenCalledWith('/health', { signal, cache: 'no-store', credentials: 'omit' });
});

it.each([null, {}, { status: 'down' }, 'ok'])('rejects invalid payload %j', async body => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => body });
  await expect(getHealth(new AbortController().signal)).rejects.toThrow('Invalid health response');
});

it('rejects failed HTTP responses without reading their body', async () => {
  const json = jest.fn();
  fetchMock.mockResolvedValue({ ok: false, json });
  await expect(getHealth(new AbortController().signal)).rejects.toThrow('Health request failed');
  expect(json).not.toHaveBeenCalled();
});

it('rejects non-JSON and network failures', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError(); } });
  await expect(getHealth(new AbortController().signal)).rejects.toThrow();
  fetchMock.mockRejectedValueOnce(new TypeError('Network failure'));
  await expect(getHealth(new AbortController().signal)).rejects.toThrow();
});
