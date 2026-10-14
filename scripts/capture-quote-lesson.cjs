const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/transfer-quote');
const port = Number(process.env.QUOTE_LESSON_PORT || 4185);
fs.mkdirSync(out, { recursive: true });
const run = spawnSync(process.execPath, [
  require.resolve('@playwright/test/cli'), 'test',
  'transfer-quote\\.spec\\.js$', 'transfer-quote-challenge\\.spec\\.js$',
  'transfer-quote-evidence\\.spec\\.js$', '--project=chromium',
  '--config=scripts/playwright.quote-capture.config.cjs',
], {
  cwd: root, stdio: 'inherit', env: { ...process.env, QUOTE_LESSON_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);

const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('transfer-quote.spec.js');
const challenge = read('transfer-quote-challenge.spec.js');
const evidenceSource = read('transfer-quote-evidence.spec.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(fs.readFileSync(path.join(root, 'test-results/class05/results.json'), 'utf8'));
const specs = suites => suites.flatMap(suite => [...(suite.specs || []), ...specs(suite.suites || [])]);
const titles = [
  'cotizar hacia Bruno muestra los costos sin reservar ni transferir',
  'cotizar entre cuentas propias no cobra comisión ni modifica saldos',
  'cotización: evidencia externa sin transferencia',
  'cotización: evidencia propia sin transferencia',
];
const tests = titles.map(title => {
  const spec = specs(report.suites).find(item => item.title === title);
  const result = spec?.tests.find(item => item.projectName === 'chromium')?.results.at(-1);
  if (result?.status !== 'passed') throw new Error(`Required passing evidence missing: ${title}`);
  return { title, status: result.status, durationMs: result.duration };
});
const code = {
  completo: source.trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\nCaso: ${tests[0].title}\nEstado: ${tests[0].status}\n\nReto: ${tests[1].title}\nEstado: ${tests[1].status}\n\nCada caso crea una práctica independiente desde la interfaz.\nServidor aislado: ${port} · SQLite en memoria.\nCotización externa: $100 + $1 = $101 a reservar.\nReto propio: $100 + $0 = $100 a reservar.\nTras cerrar y recargar: diaria $2.500, ahorro $600.\nNo se confirma ni se crea una transferencia.`,
};
for (const file of [source, challenge]) {
  for (const match of file.matchAll(/^ {2}\/\/ @snippet (\w+)\n([\s\S]*?)^ {2}\/\/ @end/gm)) {
    if (Object.hasOwn(code, match[1])) throw new Error(`Duplicate teaching snippet: ${match[1]}`);
    code[match[1]] = match[2].replace(/^ {2}/gm, '').trimEnd();
  }
}
for (const name of ['preparar', 'formulario', 'desglose', 'cancelar', 'reto']) {
  if (!code[name]) throw new Error(`Missing teaching snippet: ${name}`);
}
const screenshots = ['before.png', 'form.png', 'quote.png', 'after.png', 'challenge.png'].map(name => {
  const bytes = fs.readFileSync(path.join(out, name));
  if (bytes.length < 1000) throw new Error(`Missing screenshot evidence: ${name}`);
  return { name, sha256: digest(bytes) };
});
for (const [name, text] of [['transfer-quote.spec.js', source], ['transfer-quote-challenge.spec.js', challenge]]) {
  fs.writeFileSync(path.join(out, name), text);
}
fs.writeFileSync(path.join(out, 'code.json'), JSON.stringify(code, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), browser: 'chromium',
  playwright: require('@playwright/test/package.json').version,
  sourceSha256: digest(source), challengeSha256: digest(challenge),
  diagnosticSourceSha256: digest(evidenceSource),
  status: tests[0].status, durationMs: tests[0].durationMs,
  challengeStatus: tests[1].status, challengeDurationMs: tests[1].durationMs,
  scope: `Independent UI-created stable practice per case; isolated local server on ${port} with SQLite :memory:. Fictional data only. External/own quote costs and unchanged balances/no transfers verified after closing and reloading. No confirmation is submitted.`,
  tests, screenshots,
}, null, 2) + '\n');
console.log('Class 05 screenshots, snippets and evidence generated. Run course:build separately for cumulative ZIPs.');
