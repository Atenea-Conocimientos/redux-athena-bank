const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/account-deposit');
fs.mkdirSync(out, { recursive: true });
const run = spawnSync(process.execPath, [
  require.resolve('@playwright/test/cli'), 'test',
  'account-deposit\\.spec\\.js$', 'account-deposit-challenge\\.spec\\.js$',
  'account-deposit-evidence\\.spec\\.js$', '--project=chromium',
], {
  cwd: root, stdio: 'inherit', env: { ...process.env, DEPOSIT_LESSON_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);

const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('account-deposit.spec.js');
const challenge = read('account-deposit-challenge.spec.js');
const evidenceSource = read('account-deposit-evidence.spec.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(fs.readFileSync(path.join(root, 'test-results/results.json'), 'utf8'));
const specs = suites => suites.flatMap(suite => [...(suite.specs || []), ...specs(suite.suites || [])]);
const titles = [
  'depositar en la cuenta diaria no modifica el fondo de ahorro',
  'depositar en el fondo de ahorro no modifica la cuenta diaria',
  'depósito: evidencia de dos botones y actualización de la cuenta elegida',
  'depósito: evidencia del reto de ahorro independiente',
];
const tests = titles.map(title => {
  const spec = specs(report.suites).find(item => item.title === title);
  const result = spec?.tests.find(item => item.projectName === 'chromium')?.results.at(-1);
  if (result?.status !== 'passed') throw new Error(`Required passing evidence missing: ${title}`);
  return { title, status: result.status, durationMs: result.duration };
});
const code = {
  completo: source.trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\nCaso: ${tests[0].title}\nEstado: ${tests[0].status}\nDuración: ${tests[0].durationMs} ms\n\nReto: ${tests[1].title}\nEstado: ${tests[1].status}\nDuración: ${tests[1].durationMs} ms\n\nCada caso crea su propia práctica desde la interfaz.\nServidor de pruebas: 4178 · SQLite en memoria.\nDiaria: $ 2.500,00 + $ 100,00 = $ 2.600,00.\nReto independiente: ahorro $ 600,00 + $ 50,00 = $ 650,00.\nLa otra cuenta conserva su saldo inicial.`,
};
for (const file of [source, challenge]) {
  for (const match of file.matchAll(/^ {2}\/\/ @snippet (\w+)\n([\s\S]*?)^ {2}\/\/ @end/gm)) {
    if (Object.hasOwn(code, match[1])) throw new Error(`Duplicate teaching snippet: ${match[1]}`);
    code[match[1]] = match[2].replace(/^ {2}/gm, '').trimEnd();
  }
}
for (const name of ['localizar', 'depositar', 'comprobar', 'reto']) {
  if (!code[name]) throw new Error(`Missing teaching snippet: ${name}`);
}
const screenshots = ['before.png', 'form.png', 'after.png', 'challenge.png'].map(name => {
  const bytes = fs.readFileSync(path.join(out, name));
  if (bytes.length < 1000) throw new Error(`Missing screenshot evidence: ${name}`);
  return { name, sha256: digest(bytes) };
});
for (const [name, text] of [['account-deposit.spec.js', source], ['account-deposit-challenge.spec.js', challenge]]) {
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
  scope: 'Fresh browser context and independent UI-created stable practice per test; isolated server on 4178 with SQLite :memory:; fictional deposits and public credentials only. Evidence also verifies a globally ambiguous Depositar click is rejected by strictness.',
  tests, screenshots,
}, null, 2) + '\n');
require('./build-course-materials.cjs').buildMaterials();
console.log('Class 03 screenshots, snippets, evidence and ZIPs generated from passing reference and challenge tests.');
