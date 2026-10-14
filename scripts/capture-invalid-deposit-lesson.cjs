const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/invalid-deposit');
fs.mkdirSync(out, { recursive: true });
const config = process.env.INVALID_DEPOSIT_CAPTURE_CONFIG;
const args = [require.resolve('@playwright/test/cli'), 'test',
  'invalid-deposit\\.spec\\.js$', 'invalid-deposit-challenge\\.spec\\.js$',
  'invalid-deposit-evidence\\.spec\\.js$', '--project=chromium'];
if (config) args.push(`--config=${config}`);
const run = spawnSync(process.execPath, args, {
  cwd: root, stdio: 'inherit', env: { ...process.env, INVALID_DEPOSIT_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);

const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('invalid-deposit.spec.js');
const challenge = read('invalid-deposit-challenge.spec.js');
const diagnostic = read('invalid-deposit-evidence.spec.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const reportPath = process.env.INVALID_DEPOSIT_CAPTURE_REPORT || 'test-results/results.json';
const port = process.env.INVALID_DEPOSIT_CAPTURE_PORT || '4178';
if (!/^\d+$/.test(port)) throw new Error('Invalid capture port');
const report = JSON.parse(fs.readFileSync(path.resolve(root, reportPath), 'utf8'));
const specs = suites => suites.flatMap(suite => [...(suite.specs || []), ...specs(suite.suites || [])]);
const titles = [
  'depósito vacío: conserva ambos saldos',
  'depósito cero: conserva ambos saldos',
  'depósito negativo: conserva ambos saldos',
  'depósito mínimo: acepta un centavo sin modificar ahorro',
  'depósitos inválidos: evidencia de validación nativa sin solicitudes',
  'depósitos inválidos: evidencia del límite válido de un centavo',
];
const tests = titles.map(title => {
  const spec = specs(report.suites).find(item => item.title === title);
  const result = spec?.tests.find(item => item.projectName === 'chromium')?.results.at(-1);
  if (result?.status !== 'passed') throw new Error(`Required passing evidence missing: ${title}`);
  return { title, status: result.status, durationMs: result.duration };
});
const code = {
  completo: source.trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\n${tests.map(test => `${test.title}: ${test.status} (${test.durationMs} ms)`).join('\n')}\n\nCada caso principal crea su propia práctica desde la interfaz.\nServidor aislado: ${port} · SQLite en memoria.\nVacío, cero y negativo: validación nativa antes del envío.\nDiaria conserva $ 2.500,00; ahorro conserva $ 600,00.\nReto independiente: diaria $ 2.500,01 y ahorro $ 600,00.`,
};
for (const file of [source, challenge]) {
  for (const match of file.matchAll(/^[ \t]*\/\/ @snippet (\w+)\n([\s\S]*?)^[ \t]*\/\/ @end/gm)) {
    if (Object.hasOwn(code, match[1])) throw new Error(`Duplicate snippet: ${match[1]}`);
    const lines = match[2].trimEnd().split('\n');
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)[0].length));
    code[match[1]] = lines.map(line => line.slice(indent)).join('\n');
  }
}
for (const name of ['datos', 'validacion', 'comprobar', 'reto']) {
  if (!code[name]) throw new Error(`Missing snippet: ${name}`);
}
const screenshots = ['before.png', 'empty.png', 'error.png', 'challenge.png'].map(name => {
  const bytes = fs.readFileSync(path.join(out, name));
  if (bytes.length < 1000) throw new Error(`Missing screenshot: ${name}`);
  return { name, sha256: digest(bytes) };
});
for (const [name, content] of [['invalid-deposit.spec.js', source], ['invalid-deposit-challenge.spec.js', challenge]]) {
  fs.writeFileSync(path.join(out, name), content);
}
fs.writeFileSync(path.join(out, 'code.json'), JSON.stringify(code, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), browser: 'chromium',
  playwright: require('@playwright/test/package.json').version,
  sourceSha256: digest(source), challengeSha256: digest(challenge),
  diagnosticSourceSha256: digest(diagnostic),
  status: tests[0].status, durationMs: tests[0].durationMs,
  challengeStatus: tests[3].status, challengeDurationMs: tests[3].durationMs,
  scope: `Fresh browser context and UI-created stable practice per principal test; isolated server on ${port} with SQLite :memory:. Diagnostic verifies native valueMissing/rangeUnderflow and no POST to deposit endpoint. No real money or personal credentials.`,
  tests, screenshots,
}, null, 2) + '\n');
console.log('Class 04 screenshots, executed snippets and source hashes generated. Run npm run course:build to regenerate cumulative ZIPs.');
