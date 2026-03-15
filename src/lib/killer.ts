import { execSync } from 'child_process';

export interface KillResult {
  port: number;
  killed: boolean;
  pid?: number;
}

export function killPort(port: number): KillResult {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          const pid = parseInt(match[1], 10);
          if (pid === 0) continue;
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          return { port, killed: true, pid };
        }
      }
    } else {
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' }).trim();
      if (output) {
        const pid = parseInt(output.split('\n')[0], 10);
        execSync(`kill -9 ${pid}`);
        return { port, killed: true, pid };
      }
    }
  } catch {
    // Process not found or already killed
  }
  return { port, killed: false };
}

export function getProcessOnPort(port: number): { pid: number; name?: string } | null {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          const pid = parseInt(match[1], 10);
          if (pid === 0) continue;
          try {
            const name = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf-8' })
              .trim().split(',')[0]?.replace(/"/g, '');
            return { pid, name };
          } catch {
            return { pid };
          }
        }
      }
    } else {
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' }).trim();
      if (output) {
        const pid = parseInt(output.split('\n')[0], 10);
        try {
          const name = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf-8' }).trim();
          return { pid, name };
        } catch {
          return { pid };
        }
      }
    }
  } catch {
    // No process found
  }
  return null;
}
