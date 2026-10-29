import { describe, it, expect } from 'vitest';
import { parseNetstatListeningPids, parseLsofPids, parsePortArgs } from '../src/lib/parse';

const NETSTAT_FIXTURE = [
  '',
  'Active Connections',
  '',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4',
  '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1160',
  '  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       2222',
  '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       3333',
  '  TCP    127.0.0.1:52000        127.0.0.1:3000         ESTABLISHED     4444',
  '  TCP    127.0.0.1:3000         127.0.0.1:52000        ESTABLISHED     3333',
  '  TCP    192.168.1.10:51000     93.184.216.34:80       ESTABLISHED     5555',
  '  TCP    127.0.0.1:30000        0.0.0.0:0              LISTENING       6666',
  '  TCP    [::]:3000              [::]:0                 LISTENING       3333',
  '  TCP    [::]:5432              [::]:0                 LISTENING       7777',
  '  TCP    [fe80::1%12]:5432      [::]:0                 LISTENING       7778',
  '  TCP    0.0.0.0:9000           0.0.0.0:0              ABHÖREN         8888',
  '  TCP    0.0.0.0:7000           0.0.0.0:0              LISTENING       0',
  '  UDP    0.0.0.0:3000           *:*                                    9999',
  '  UDP    [::]:5432              *:*                                    9998',
].join('\r\n');

describe('parseNetstatListeningPids', () => {
  it('returns the PID listening on the exact local port', () => {
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 3000)).toEqual([3333]);
  });

  it('does not match a port that merely contains the requested digits', () => {
    // :80 must not match :8080, and :300 must not match :3000 / :30000
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 300)).toEqual([]);
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 808)).toEqual([]);
  });

  it('does not match the port in the foreign-address column', () => {
    // 5555 is a client connected to a remote :80; it must never be matched for port 80
    const output = [
      '  TCP    192.168.1.10:51000     93.184.216.34:80       ESTABLISHED     5555',
      '  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       2222',
    ].join('\r\n');
    expect(parseNetstatListeningPids(output, 80)).toEqual([]);
  });

  it('ignores established connections on the local port', () => {
    const output = '  TCP    127.0.0.1:4000         127.0.0.1:52000        ESTABLISHED     1234';
    expect(parseNetstatListeningPids(output, 4000)).toEqual([]);
  });

  it('matches IPv6 and scoped IPv6 listeners and de-duplicates PIDs', () => {
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 5432)).toEqual([7777, 7778]);
  });

  it('detects listeners on localized Windows (state is not English)', () => {
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 9000)).toEqual([8888]);
  });

  it('never returns PID 0 or the Windows System PID 4', () => {
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 7000)).toEqual([]);
    expect(parseNetstatListeningPids(NETSTAT_FIXTURE, 80)).toEqual([]);
  });

  it('ignores UDP sockets', () => {
    const output = '  UDP    0.0.0.0:6000           *:*                                    9999';
    expect(parseNetstatListeningPids(output, 6000)).toEqual([]);
  });

  it('returns an empty array for empty or garbage output', () => {
    expect(parseNetstatListeningPids('', 3000)).toEqual([]);
    expect(parseNetstatListeningPids('not netstat output :3000 LISTENING 42', 3000)).toEqual([]);
  });
});

describe('parseLsofPids', () => {
  it('parses one PID per line and de-duplicates', () => {
    expect(parseLsofPids('1234\n5678\n1234\n')).toEqual([1234, 5678]);
  });

  it('ignores blank lines, non-numeric lines and PID 0', () => {
    expect(parseLsofPids('\n  \nlsof: WARNING\n0\n42\n')).toEqual([42]);
  });

  it('returns an empty array for empty output', () => {
    expect(parseLsofPids('')).toEqual([]);
  });
});

describe('parsePortArgs', () => {
  it('parses valid port numbers', () => {
    expect(parsePortArgs(['3000', '8080', '5432'])).toEqual({ ports: [3000, 8080, 5432], invalid: [] });
  });

  it('accepts boundary values', () => {
    expect(parsePortArgs(['1', '65535'])).toEqual({ ports: [1, 65535], invalid: [] });
  });

  it('rejects out-of-range, non-integer and non-decimal values', () => {
    const args = ['0', '-1', '70000', 'abc', '', '3000.5', '1e3', '0x50', ' 80'];
    expect(parsePortArgs(args)).toEqual({ ports: [], invalid: args });
  });

  it('separates valid from invalid values', () => {
    expect(parsePortArgs(['3000', 'abc', '8080', '0', '99999'])).toEqual({
      ports: [3000, 8080],
      invalid: ['abc', '0', '99999'],
    });
  });

  it('de-duplicates ports', () => {
    expect(parsePortArgs(['3000', '3000'])).toEqual({ ports: [3000], invalid: [] });
  });
});
