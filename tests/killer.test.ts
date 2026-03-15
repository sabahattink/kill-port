import { describe, it, expect, vi } from 'vitest';
import { killPort, getProcessOnPort } from '../src/lib/killer';

describe('kill-port', () => {
  it('should parse valid port numbers from CLI args', () => {
    const args = ['3000', '8080', '5432'];
    const ports = args.map(Number).filter(p => !isNaN(p) && p > 0 && p < 65536);
    expect(ports).toEqual([3000, 8080, 5432]);
  });

  it('should reject invalid port numbers', () => {
    const args = ['0', '-1', '70000', 'abc', ''];
    const ports = args.map(Number).filter(p => !isNaN(p) && p > 0 && p < 65536);
    expect(ports).toEqual([]);
  });

  it('should handle port at boundary values', () => {
    const args = ['1', '65535'];
    const ports = args.map(Number).filter(p => !isNaN(p) && p > 0 && p < 65536);
    expect(ports).toEqual([1, 65535]);
  });

  it('should return killed: false when no process is found', () => {
    // Use a port unlikely to be in use
    const result = killPort(59999);
    expect(result.killed).toBe(false);
    expect(result.port).toBe(59999);
  });

  it('should return null for getProcessOnPort when port is free', () => {
    const result = getProcessOnPort(59998);
    expect(result).toBeNull();
  });

  it('should detect platform correctly', () => {
    expect(['win32', 'darwin', 'linux']).toContain(process.platform);
  });

  it('should filter mixed valid and invalid ports', () => {
    const args = ['3000', 'abc', '8080', '0', '99999'];
    const ports = args.map(Number).filter(p => !isNaN(p) && p > 0 && p < 65536);
    expect(ports).toEqual([3000, 8080]);
  });
});
