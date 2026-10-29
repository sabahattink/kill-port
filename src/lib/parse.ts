/** PIDs that must never be killed: 0 (System Idle) and 4 (Windows System / http.sys). */
const PROTECTED_PIDS = new Set([0, 4]);

const DIGITS = /^\d+$/;

function portOf(address: string): number | null {
  const idx = address.lastIndexOf(':');
  if (idx === -1) return null;
  const port = address.slice(idx + 1);
  return DIGITS.test(port) ? Number(port) : null;
}

function unique(values: number[]): number[] {
  return [...new Set(values)];
}

/**
 * Parse `netstat -ano` output (Windows) and return the PIDs of TCP sockets
 * listening on exactly `port`.
 *
 * Matching is column-based, never substring-based: the port must be the
 * local-address port (so :80 never matches :8080 or a foreign :80), and the
 * socket must be listening, detected by a foreign port of 0 rather than the
 * localized state text.
 */
export function parseNetstatListeningPids(output: string, port: number): number[] {
  const pids: number[] = [];

  for (const line of output.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 5 || cols[0] !== 'TCP') continue;

    const [, local = '', foreign = ''] = cols;
    const pidCol = cols[cols.length - 1] ?? '';

    if (portOf(local) !== port) continue;
    if (portOf(foreign) !== 0) continue;
    if (!DIGITS.test(pidCol)) continue;

    const pid = Number(pidCol);
    if (PROTECTED_PIDS.has(pid)) continue;
    pids.push(pid);
  }

  return unique(pids);
}

/** Parse `lsof -t` output (one PID per line). */
export function parseLsofPids(output: string): number[] {
  const pids = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => DIGITS.test(line))
    .map(Number)
    .filter(pid => !PROTECTED_PIDS.has(pid));
  return unique(pids);
}

export interface ParsedPorts {
  ports: number[];
  invalid: string[];
}

/** Validate CLI port arguments: plain decimal integers in 1–65535. */
export function parsePortArgs(args: string[]): ParsedPorts {
  const ports: number[] = [];
  const invalid: string[] = [];

  for (const arg of args) {
    const port = DIGITS.test(arg) ? Number(arg) : NaN;
    if (Number.isInteger(port) && port >= 1 && port <= 65535) {
      ports.push(port);
    } else {
      invalid.push(arg);
    }
  }

  return { ports: unique(ports), invalid };
}
