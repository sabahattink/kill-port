import { execFileSync } from 'child_process';
import { parseLsofPids, parseNetstatListeningPids } from './parse';

export interface KillResult {
  port: number;
  killed: boolean;
  pid?: number;
}

const EXEC_OPTIONS = {
  encoding: 'utf-8' as const,
  stdio: ['ignore', 'pipe', 'ignore'] as ['ignore', 'pipe', 'ignore'],
  windowsHide: true,
  maxBuffer: 16 * 1024 * 1024,
};

function run(file: string, args: string[]): string {
  return execFileSync(file, args, EXEC_OPTIONS);
}

function assertValidPort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError(`Invalid port: ${port}. Expected an integer between 1 and 65535.`);
  }
}

/**
 * PIDs of processes *listening* on `port`. Only sockets whose local port is
 * exactly `port` are matched; clients connected to a remote `port` are not.
 */
function findListeningPids(port: number): number[] {
  try {
    if (process.platform === 'win32') {
      return parseNetstatListeningPids(run('netstat', ['-ano']), port);
    }
    // lsof exits 1 when nothing matches, which lands in the catch below.
    return parseLsofPids(run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']));
  } catch {
    return [];
  }
}

function killPid(pid: number): boolean {
  try {
    if (process.platform === 'win32') {
      run('taskkill', ['/PID', String(pid), '/F']);
    } else {
      process.kill(pid, 'SIGKILL');
    }
    return true;
  } catch {
    return false;
  }
}

function processName(pid: number): string | undefined {
  try {
    if (process.platform === 'win32') {
      const line = run('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']).trim();
      // "node.exe","1234",... — anything else is an INFO message, not a match.
      const match = line.match(/^"([^"]+)","(\d+)"/);
      return match && Number(match[2]) === pid ? match[1] : undefined;
    }
    return run('ps', ['-p', String(pid), '-o', 'comm=']).trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Kill every process listening on `port`. */
export function killPort(port: number): KillResult {
  assertValidPort(port);
  const pids = findListeningPids(port);
  const killedPids = pids.filter(killPid);
  const [first] = killedPids;
  return first === undefined ? { port, killed: false } : { port, killed: true, pid: first };
}

export function getProcessOnPort(port: number): { pid: number; name?: string } | null {
  assertValidPort(port);
  const [pid] = findListeningPids(port);
  if (pid === undefined) return null;
  const name = processName(pid);
  return name === undefined ? { pid } : { pid, name };
}
