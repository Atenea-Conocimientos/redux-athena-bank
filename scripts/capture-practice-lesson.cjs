const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/create-practice');
fs.mkdirSync(out, { recursive: true });
// Only these executable cases run here. The lesson player needs the generated assets.
// The existing Playwright config starts an isolated :memory: server on 4178.
const run = spawnSync(process.execPath, [
  require.resolve('@playwright/test/cli'), 'test',
  'create-practice\\.spec\\.js$', 'create-practice-challenge\\.spec\\.js$',
  'create-practice-evidence\\.spec\\.js$', '--project=chromium',
], {
  cwd: root, stdio: 'inherit', env: { ...process.env, PRACTICE_LESSON_CAPTURE_DIR: out },
});
if (run.status !== 0) process.exit(run.status || 1);

const read = name => fs.readFileSync(path.join(root, 'lab/e2e', name), 'utf8').replaceAll('\r\n', '\n');
const source = read('create-practice.spec.js');
const challenge = read('create-practice-challenge.spec.js');
const evidenceSource = read('create-practice-evidence.spec.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(fs.readFileSync(path.join(root, 'test-results/results.json'), 'utf8'));
const specs = suites => suites.flatMap(suite => [...(suite.specs || []), ...specs(suite.suites || [])]);
const titles = [
  'crear una práctica permite iniciar sesión como Ana',
  'una contraseña incorrecta mantiene cerrada la cuenta de Ana',
  'crear práctica: evidencia de bienvenida, acceso y cuenta visible',
  'crear práctica: evidencia de acceso rechazado en una práctica independiente',
];
const tests = titles.map(title => {
  const spec = specs(report.suites).find(item => item.title === title);
  const result = spec?.tests.find(item => item.projectName === 'chromium')?.results.at(-1);
  if (result?.status !== 'passed') throw new Error(`Required passing evidence missing: ${title}`);
  return { title, status: result.status, durationMs: result.duration };
});
const code = {
  completo: source.trimEnd(),
  'ejecucion-real': `Ejecución real · Chromium\n\nCaso: ${tests[0].title}\nEstado: ${tests[0].status}\nDuración: ${tests[0].durationMs} ms\n\nReto: ${tests[1].title}\nEstado: ${tests[1].status}\nDuración: ${tests[1].durationMs} ms\n\nCada caso crea su propia práctica desde la interfaz.\nServidor de pruebas: 4178 · SQLite en memoria.\nEl acceso correcto muestra la cuenta; el rechazo conserva el formulario.`,
};
for (const file of [source, challenge]) {
  for (const match of file.matchAll(/^ {2}\/\/ @snippet (\w+)\n([\s\S]*?)^ {2}\/\/ @end/gm)) {
    if (Object.hasOwn(code, match[1])) throw new Error(`Duplicate teaching snippet: ${match[1]}`);
    code[match[1]] = match[2].replace(/^ {2}/gm, '').trimEnd();
  }
}
for (const name of ['preparar', 'acceder', 'comprobar', 'rechazo']) {
  if (!code[name]) throw new Error(`Missing teaching snippet: ${name}`);
}
const screenshots = ['welcome.png', 'login.png', 'dashboard.png', 'denied.png'].map(name => {
  const bytes = fs.readFileSync(path.join(out, name));
  if (bytes.length < 1000) throw new Error(`Missing screenshot evidence: ${name}`);
  return { name, sha256: digest(bytes) };
});
for (const [name, text] of [['create-practice.spec.js', source], ['create-practice-challenge.spec.js', challenge]]) {
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
  scope: 'Fresh browser context and independent UI-created stable practice per test; isolated server on 4178 with SQLite :memory:; public fictional credentials only.',
  tests, screenshots,
}, null, 2) + '\n');
require('./build-course-materials.cjs').buildMaterials();
console.log('Class 02 screenshots, snippets, evidence and ZIPs generated from passing reference and challenge tests.');
