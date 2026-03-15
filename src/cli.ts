import { killPort } from './lib/killer';
import { green, red, yellow, bold, cyan } from './lib/colors';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
${bold('kill-port')} — Kill processes running on specified ports

${cyan('Usage:')}
  kill-port <port> [port2] [port3] ...

${cyan('Examples:')}
  kill-port 3000
  kill-port 3000 8080 5432

${cyan('Options:')}
  -h, --help     Show this help message
  -v, --version  Show version
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('1.0.0');
  process.exit(0);
}

const ports = args.map(Number).filter(p => !isNaN(p) && p > 0 && p < 65536);

if (ports.length === 0) {
  console.error(red('Error: No valid port numbers provided.'));
  console.error('Ports must be between 1 and 65535.');
  process.exit(1);
}

for (const port of ports) {
  const result = killPort(port);
  if (result.killed) {
    console.log(green(`✔ Port ${port}: killed process (PID ${result.pid})`));
  } else {
    console.log(yellow(`⚠ Port ${port}: no process found`));
  }
}
