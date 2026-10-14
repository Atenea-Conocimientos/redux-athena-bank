const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/first-test');
fs.mkdirSync(out, { recursive: true });
const run = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', 'first-test', '--project=chromium'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, FIRST_LESSON_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);
const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('first-test.spec.js');
const evidenceSource = read('first-test-evidence.spec.js');
const challenge = read('first-test-challenge.spec.js');
const report = JSON.parse(fs.readFileSync(path.join(root, 'test-results/results.json'), 'utf8'));
const specs = suites => suites.flatMap(suite => [...suite.specs, ...specs(suite.suites || [])]);
const result = specs(report.suites).find(spec => spec.title === 'la bienvenida permite iniciar una práctica').tests[0].results.at(-1);
if (result.status !== 'passed') throw new Error('The reference must pass before publishing evidence.');
const code = { completo: source.trimEnd(), 'fallo-real': fs.readFileSync(path.join(out, 'failure.txt'), 'utf8').trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\nCaso: la bienvenida permite iniciar una práctica\nEstado: ${result.status}\nDuración: ${result.duration} ms\n\nEl test verifica el título y el botón.\nTodavía no comprueba qué pasa al crear una práctica.` };
for (const file of [source, evidenceSource, challenge]) {
  for (const match of file.matchAll(/^ {2,4}\/\/ @snippet (\w+)\r?\n([\s\S]*?)^ {2,4}\/\/ @end/gm)) {
    code[match[1]] = match[2].replace(/^ {2,4}/gm, '').trimEnd();
  }
}
if (!code.incorrecto || !code.reto) throw new Error('Missing teaching snippets');
for (const [name, text] of [['first-test.spec.js', source], ['first-test-challenge.spec.js', challenge]]) fs.writeFileSync(path.join(out, name), text);
fs.writeFileSync(path.join(out, 'code.json'), JSON.stringify(code, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), browser: 'chromium', playwright: require('@playwright/test/package.json').version,
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  challengeSha256: createHash('sha256').update(challenge).digest('hex'),
  diagnosticSourceSha256: createHash('sha256').update(evidenceSource).digest('hex'),
  status: result.status, durationMs: result.duration,
  scope: 'Fresh browser; read-only welcome screen; intentional assertion mismatch caught and verified by evidence harness.',
}, null, 2) + '\n');
require('./build-course-materials.cjs').buildMaterials();
