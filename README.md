# @scuton/kill-port

Kill any process running on a specified port. Cross-platform (Windows, macOS, Linux).

## Install

```bash
npm install @scuton/kill-port
```

## CLI Usage

```bash
# Kill a single port
npx @scuton/kill-port 3000

# Kill multiple ports
npx @scuton/kill-port 3000 8080 5432
```

## Programmatic API

```typescript
import { killPort, getProcessOnPort } from '@scuton/kill-port';

// Kill process on port
const result = killPort(3000);
// { port: 3000, killed: true, pid: 12345 }

// Check what's running on a port
const info = getProcessOnPort(3000);
// { pid: 12345, name: 'node' }
```

## API

### `killPort(port: number): KillResult`

Kills the process listening on the given port.

### `getProcessOnPort(port: number): { pid: number; name?: string } | null`

Returns info about the process on the given port, or `null` if the port is free.

## Cross-platform

- **Windows**: Uses `netstat -ano` + `taskkill`
- **macOS/Linux**: Uses `lsof` + `kill -9`

## License

MIT © Scuton Technology
