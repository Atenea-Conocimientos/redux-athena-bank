const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'lab/public/lessons/pending-transfer');
const spec = path.join(root, 'lab/e2e/pending-lesson.spec.js');
fs.mkdirSync(out, { recursive: true });
// Uses the test-only server on 4178 with SQLite :memory:, never port 4177.
const result = spawnSync(
  process.execPath,
  [
    require.resolve('@playwright/test/cli'),
    'test',
    'pending-lesson.spec.js',
    '--project=chromium',
    '--reporter=line',
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, LESSON_CAPTURE_DIR: out },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
const source = fs.readFileSync(spec, 'utf8').replaceAll('\r\n', '\n');
const snippets = {};
for (const match of source.matchAll(
  /    \/\/ @snippet (\w+)\r?\n([\s\S]*?)    \/\/ @end/g,
)) {
  snippets[match[1]] = match[2].replace(/^    /gm, '').trimEnd();
}
fs.writeFileSync(
  path.join(out, 'code.json'),
  JSON.stringify(snippets, null, 2) + '\n',
);
fs.writeFileSync(path.join(out, 'pending-lesson.spec.js'), source);
fs.writeFileSync(
  path.join(out, 'evidence.json'),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      browser: 'chromium',
      playwright: require('@playwright/test/package.json').version,
      environment: 'isolated in-memory practice; fictional accounts only',
      verified: [
        'initial balances',
        'quote: 101 ARS',
        'pending UI and API',
        'Ana: balance 250000 / reserved 10100 / available 239900 cents',
        'Bruno: unchanged 120000 cents',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Lesson screenshots and code generated from the passing reference test.',
);
