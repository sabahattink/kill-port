<div align="center">

# kill-port

**Kill any process running on a specified port. Cross-platform. Zero dependencies.**

[![npm](https://img.shields.io/npm/v/@scuton/kill-port?style=flat-square)](https://www.npmjs.com/package/@scuton/kill-port)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](package.json)

</div>

---

## Install

```bash
npm install @scuton/kill-port
```

## CLI Usage

```bash
npx @scuton/kill-port 3000
npx @scuton/kill-port 3000 8080 5432
```

## Programmatic API

```typescript
import { killPort, getProcessOnPort } from '@scuton/kill-port';

const result = killPort(3000);
// { port: 3000, killed: true, pid: 12345 }

const info = getProcessOnPort(3000);
// { pid: 12345, name: 'node' }
```

## API

| Function | Signature | Description |
|----------|-----------|-------------|
| `killPort` | `(port: number) => KillResult` | Kill the process on the given port |
| `getProcessOnPort` | `(port: number) => { pid, name? } \| null` | Get process info or `null` if free |

## Cross-platform

- **Windows** — `netstat -ano` + `taskkill`
- **macOS/Linux** — `lsof` + `kill -9`

## License

MIT — [Scuton Technology](https://scuton.com)
