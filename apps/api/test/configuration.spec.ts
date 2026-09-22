import { readPort } from '../src/application';

describe('local port configuration', () => {
  it('uses a default only when PORT is absent', () => {
    expect(readPort(undefined)).toBe(3000);
  });
  it.each(['1', '3001', '65535'])('accepts TCP port %s', (port) => {
    expect(readPort(port)).toBe(Number(port));
  });
  it.each(['', '0', '-1', '65536', '1.5', '3000junk', ' 3000', '1e3', 'secret'])
  ('rejects invalid configuration %j', (port) => {
    expect(() => readPort(port)).toThrow('Invalid PORT');
  });
});
