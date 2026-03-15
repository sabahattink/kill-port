<div align="center">
  <br>
  <h1>kill-port</h1>
  <p><strong>Kill any process running on a specified port</strong></p>
  <br>
  <p>
    <a href="https://www.npmjs.com/package/@scuton/kill-port"><img src="https://img.shields.io/npm/v/@scuton/kill-port?color=2563eb&label=npm" alt="npm"></a>
    <a href="https://www.npmjs.com/package/@scuton/kill-port"><img src="https://img.shields.io/npm/dm/@scuton/kill-port?color=gray&label=downloads" alt="downloads"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/types-TypeScript-3178c6" alt="typescript"></a>
  </p>
  <br>
</div>

> Stop googling `lsof -i :3000`. Just run `npx @scuton/kill-port 3000`.

## Highlights

- ✅ Kill process on any port — one command
- ✅ Multiple ports at once — `kill-port 3000 8080 5432`
- ✅ Cross-platform — Windows, macOS, Linux
- ✅ Programmatic API — use it in your scripts
- ✅ Zero dependencies
- ✅ TypeScript support

## Install

```sh
npm install @scuton/kill-port
```

## CLI

```sh
# Kill process on port 3000
npx @scuton/kill-port 3000

# Kill multiple ports
npx @scuton/kill-port 3000 8080 5432
```

## Programmatic Usage

```typescript
import { killPort, getProcessOnPort } from '@scuton/kill-port';

// Kill whatever is running on port 3000
const result = killPort(3000);
console.log(result);
// { port: 3000, killed: true, pid: 12345 }

// Check what's running on a port
const info = getProcessOnPort(8080);
console.log(info);
// { pid: 67890, name: 'node' } or null if free
```

## API

### killPort(port)

Kill the process listening on the given port.

Returns: `{ port: number, killed: boolean, pid?: number }`

#### port

Type: `number`

Port number (1–65535).

### getProcessOnPort(port)

Get info about the process on a port, or `null` if the port is free.

Returns: `{ pid: number, name?: string } | null`

## How it works

| Platform | Method |
|----------|--------|
| Windows | `netstat -ano` → `taskkill /PID` |
| macOS/Linux | `lsof -ti :PORT` → `kill -9` |

## FAQ

### Why not just use `lsof` or `netstat`?

Because you can never remember the exact flags. `kill-port 3000` is all you need.

### What if nothing is running on the port?

It returns `{ killed: false }` — no error, no crash.

## Related

- [@scuton/port-finder](https://github.com/scuton-technology/port-finder) — Find an available port
- [@scuton/retry-fn](https://github.com/scuton-technology/retry-fn) — Retry failed operations

## License

MIT © [Scuton Technology](https://scuton.com)
