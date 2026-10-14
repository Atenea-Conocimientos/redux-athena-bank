const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/confirm-transfer');
const config = process.env.CONFIRM_LESSON_CONFIG;
const reportFile = process.env.CONFIRM_LESSON_REPORT || 'test-results/results.json';
const port = process.env.CONFIRM_LESSON_PORT || '4178';
fs.mkdirSync(out, { recursive: true });
const run = spawnSync(process.execPath, [
  require.resolve('@playwright/test/cli'), 'test',
  'confirm-transfer\\.spec\\.js$', 'confirm-transfer-challenge\\.spec\\.js$',
  'confirm-transfer-evidence\\.spec\\.js$', '--project=chromium',
  ...(config ? ['--config', config] : []),
], {
  cwd: root, stdio: 'inherit', env: { ...process.env, CONFIRM_LESSON_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);

const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('confirm-transfer.spec.js');
const challenge = read('confirm-transfer-challenge.spec.js');
const diagnostic = read('confirm-transfer-evidence.spec.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(fs.readFileSync(path.resolve(root, reportFile), 'utf8'));
const specs = suites => suites.flatMap(suite => [...(suite.specs || []), ...specs(suite.suites || [])]);
const titles = [
  'confirmar una transferencia reserva fondos y mantiene el estado pendiente',
  'un código de confirmación incorrecto no crea transferencias ni reserva saldo',
  'confirmación: evidencia visual de cotización, pendiente y reserva',
  'confirmación: evidencia visual de código incorrecto sin efectos',
];
const tests = titles.map(title => {
  const spec = specs(report.suites).find(item => item.title === title);
  const result = spec?.tests.find(item => item.projectName === 'chromium')?.results.at(-1);
  if (result?.status !== 'passed') throw new Error(`Required passing evidence missing: ${title}`);
  return { title, status: result.status, durationMs: result.duration };
});
const code = {
  completo: source.trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\nCaso: ${tests[0].title}\nEstado: ${tests[0].status}\nDuración: ${tests[0].durationMs} ms\n\nReto: ${tests[1].title}\nEstado: ${tests[1].status}\nDuración: ${tests[1].durationMs} ms\n\nPráctica estable nueva por UI en cada test.\nServidor aislado: ${port} · SQLite en memoria.\nPendiente: importe $100 + comisión $1 = reserva $101.\nDiaria disponible: $2.399; ahorro: $600.\nTotal contable: $3.100; total disponible: $2.999.\nReto OTP incorrecto: ninguna transferencia ni reserva.\nNo se observó la sesión de Bruno ni se pulsó Procesar.`,
};
for (const file of [source, challenge]) {
  for (const match of file.matchAll(/^ {2}\/\/ @snippet (\w+)\n([\s\S]*?)^ {2}\/\/ @end/gm)) {
    if (Object.hasOwn(code, match[1])) throw new Error(`Duplicate teaching snippet: ${match[1]}`);
    code[match[1]] = match[2].replace(/^ {2}/gm, '').trimEnd();
  }
}
for (const name of ['confirmar', 'operacion', 'saldos', 'reto']) {
  if (!code[name]) throw new Error(`Missing teaching snippet: ${name}`);
}
const screenshots = ['quote.png', 'pending.png', 'balances.png', 'rejected.png'].map(name => {
  const bytes = fs.readFileSync(path.join(out, name));
  if (bytes.length < 1000) throw new Error(`Missing screenshot evidence: ${name}`);
  return { name, sha256: digest(bytes) };
});
for (const [name, text] of [['confirm-transfer.spec.js', source], ['confirm-transfer-challenge.spec.js', challenge]]) {
  fs.writeFileSync(path.join(out, name), text);
}
fs.writeFileSync(path.join(out, 'code.json'), JSON.stringify(code, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), browser: 'chromium',
  playwright: require('@playwright/test/package.json').version,
  sourceSha256: digest(source), challengeSha256: digest(challenge),
  diagnosticSourceSha256: digest(diagnostic),
  status: tests[0].status, durationMs: tests[0].durationMs,
  challengeStatus: tests[1].status, challengeDurationMs: tests[1].durationMs,
  scope: `Fresh browser context and independent UI-created stable practice per test; isolated server on ${port} with SQLite :memory:; fictional transfer only. Ana UI verifies pending status, reserved/available/total balances. No receiver-session verification or settlement. Wrong-OTP challenge proves visible rejection and no transfer or reservation after refreshing.`,
  tests, screenshots,
}, null, 2) + '\n');
console.log('Class 06 screenshots, executable snippets and evidence generated from four passing tests. Run npm run course:build for cumulative ZIPs.');
