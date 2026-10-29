import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('child_process', () => ({ execFileSync: vi.fn() }));

import { execFileSync } from 'child_process';
import { killPort, getProcessOnPort } from '../src/lib/killer';

const execMock = vi.mocked(execFileSync);
const realPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value: platform });
}

const NETSTAT = [
  '  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       2222',
  '  TCP    192.168.1.10:51000     93.184.216.34:3000     ESTABLISHED     5555',
  '  TCP    127.0.0.1:30000        0.0.0.0:0              LISTENING       6666',
  '  TCP    0.0.0.0:4000           0.0.0.0:0              LISTENING       4444',
  '  TCP    [::]:4000              [::]:0                 LISTENING       4445',
].join('\r\n');

function stubWindows(): void {
  setPlatform('win32');
  execMock.mockImplementation(((file: string) => {
    if (file === 'netstat') return NETSTAT;
    if (file === 'tasklist') return '"node.exe","4444","Console","1","50,000 K"\r\n';
    return '';
  }) as typeof execFileSync);
}

function taskkillCalls(): string[][] {
  return execMock.mock.calls
    .filter(([file]) => file === 'taskkill')
    .map(([, args]) => [...((args ?? []) as readonly string[])]);
}

describe('killPort (Windows)', () => {
  beforeEach(() => {
    execMock.mockReset();
    stubWindows();
  });
  afterEach(() => setPlatform(realPlatform));

  it('never kills a PID that only matches by substring or foreign address', () => {
    // 3000 appears only as a foreign port and as a prefix of :30000
    expect(killPort(3000)).toEqual({ port: 3000, killed: false });
    expect(killPort(80)).toEqual({ port: 80, killed: false });
    expect(taskkillCalls()).toEqual([]);
  });

  it('kills every PID listening on the exact port without a shell', () => {
    expect(killPort(4000)).toEqual({ port: 4000, killed: true, pid: 4444 });
    expect(taskkillCalls()).toEqual([
      ['/PID', '4444', '/F'],
      ['/PID', '4445', '/F'],
    ]);
  });

  it('reports the process name from tasklist', () => {
    expect(getProcessOnPort(4000)).toEqual({ pid: 4444, name: 'node.exe' });
  });

  it('returns killed: false when netstat fails', () => {
    execMock.mockImplementation(() => {
      throw new Error('netstat missing');
    });
    expect(killPort(4000)).toEqual({ port: 4000, killed: false });
    expect(getProcessOnPort(4000)).toBeNull();
  });
});

describe('killPort (POSIX)', () => {
  beforeEach(() => {
    execMock.mockReset();
    setPlatform('linux');
  });
  afterEach(() => {
    setPlatform(realPlatform);
    vi.restoreAllMocks();
  });

  it('asks lsof for TCP listeners only', () => {
    execMock.mockReturnValue('');
    killPort(3000);
    expect(execMock).toHaveBeenCalledWith('lsof', ['-nP', '-iTCP:3000', '-sTCP:LISTEN', '-t'], expect.anything());
  });

  it('sends SIGKILL to each listening PID', () => {
    execMock.mockReturnValue('1234\n5678\n');
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    expect(killPort(3000)).toEqual({ port: 3000, killed: true, pid: 1234 });
    expect(kill.mock.calls).toEqual([
      [1234, 'SIGKILL'],
      [5678, 'SIGKILL'],
    ]);
  });

  it('returns killed: false when lsof finds nothing (exit 1)', () => {
    execMock.mockImplementation(() => {
      throw new Error('exit 1');
    });
    const kill = vi.spyOn(process, 'kill');
    expect(killPort(3000)).toEqual({ port: 3000, killed: false });
    expect(kill).not.toHaveBeenCalled();
  });
});

describe('input validation', () => {
  it.each([0, -1, 65536, 3000.5, NaN])('rejects invalid port %s', port => {
    expect(() => killPort(port)).toThrow(RangeError);
    expect(() => getProcessOnPort(port)).toThrow(RangeError);
  });
});
