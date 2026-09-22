import { readHost, readPort } from '../src/application';

describe('listen address configuration', () => {
  it('defaults to loopback and permits explicit container binding', () => {
    expect(readHost(undefined)).toBe('127.0.0.1');
    expect(readHost('127.0.0.1')).toBe('127.0.0.1');
    expect(readHost('0.0.0.0')).toBe('0.0.0.0');
  });
  it.each(['', 'localhost', '::', '192.168.1.1', 'private-secret'])('rejects unsupported HOST %j', host => {
    expect(() => readHost(host)).toThrow('Invalid HOST');
  });
});

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
