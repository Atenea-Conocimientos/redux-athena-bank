const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { crc32 } = require('node:zlib');
const { createServer } = require('../server.cjs');
const { zip } = require('../../scripts/build-course-materials.cjs');
const root = path.join(__dirname, '../..');
const directory = path.join(root, 'lab/public/lessons/first-test');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('clase 01: guion, medios, subtítulos y evidencia corresponden al código probado', () => {
  const lesson = JSON.parse(fs.readFileSync(path.join(directory, 'lesson.json')));
  const code = JSON.parse(fs.readFileSync(path.join(directory, 'code.json')));
  const evidence = JSON.parse(fs.readFileSync(path.join(directory, 'evidence.json')));
  const source = JSON.parse(read('lab/lessons/first-test.json'));
  assert.ok(lesson.duration >= 120 && lesson.duration <= 180);
  assert.equal(lesson.sourceSha256, digest(read('lab/lessons/first-test.json')));
  assert.equal(lesson.audioSha256, digest(fs.readFileSync(path.join(directory, lesson.audio))));
  assert.equal(lesson.scenes.length, 5);
  assert.equal(lesson.subtitles.length, 15);
  assert.equal(lesson.sceneAudio.length, 5);
  assert.ok(lesson.sceneAudio.every(scene => scene.alignmentCoverage >= 0.85));
  assert.deepEqual(lesson.subtitles.map(cue => cue.text), source.scenes.flatMap(scene => scene.cues));
  let end = 0;
  for (const cue of lesson.subtitles) {
    assert.equal(cue.start, end);
    assert.ok(cue.end > cue.start);
    end = cue.end;
  }
  assert.equal(end, lesson.duration);
  for (const scene of lesson.scenes) {
    assert.ok(fs.statSync(path.join(directory, scene.image)).size > 1000);
    assert.ok(scene.focus.every(line => line > 0 && line <= code[scene.code].split('\n').length));
    if (scene.output) assert.ok(code[scene.output]);
  }
  const reference = read('lab/e2e/first-test.spec.js');
  assert.equal(read('lab/public/lessons/first-test/first-test.spec.js'), reference);
  assert.equal(code.completo, reference.trimEnd());
  assert.equal(evidence.sourceSha256, digest(reference));
  assert.equal(evidence.challengeSha256, digest(read('lab/e2e/first-test-challenge.spec.js')));
  assert.equal(evidence.diagnosticSourceSha256, digest(read('lab/e2e/first-test-evidence.spec.js')));
  assert.equal(evidence.status, 'passed');
  assert.match(code['fallo-real'], /Expected: "Bienvenido al banco"/);
  assert.match(code['fallo-real'], /Received: "Aprendé a probar lo que importa\."/);
  assert.equal(code['fallo-real'], read('lab/public/lessons/first-test/failure.txt').trimEnd());
});

test('clase 01: ZIPs exactos, reproducibles y sin datos de sesión', () => {
  for (const checkpoint of ['inicio', 'solucion']) {
    const data = fs.readFileSync(path.join(directory, `clase-01-${checkpoint}.zip`));
    const expected = new Map(['package.json', 'package-lock.json', 'playwright.config.js', '.gitignore', 'tests/smoke.spec.js']
      .map(name => [name, `course/automation/${name}`]));
    expected.set('README.md', 'course/first-test/README.md');
    expected.set('tests/first-test.spec.js', checkpoint === 'inicio' ? 'course/first-test/first-test.spec.js' : 'lab/e2e/first-test.spec.js');
    if (checkpoint === 'solucion') expected.set('tests/first-test-challenge.spec.js', 'lab/e2e/first-test-challenge.spec.js');
    let cursor = 0;
    const entries = [];
    while (data.readUInt32LE(cursor) === 0x04034b50) {
      const size = data.readUInt32LE(cursor + 18);
      const length = data.readUInt16LE(cursor + 26);
      const name = data.subarray(cursor + 30, cursor + 30 + length).toString();
      const content = data.subarray(cursor + 30 + length, cursor + 30 + length + size);
      assert.ok(expected.has(name), `Unexpected ZIP entry: ${name}`);
      assert.equal(content.toString(), read(expected.get(name)));
      assert.equal(crc32(content), data.readUInt32LE(cursor + 14));
      entries.push([name, content]);
      cursor += 30 + length + size;
    }
    assert.deepEqual(entries.map(([name]) => name), [...expected.keys()]);
    assert.deepEqual(data, zip(entries));
  }
});

test('clase 01: página, descargas, audio parcial y rutas rechazadas', async () => {
  const server = createServer({ filename: ':memory:', testing: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/lecciones/primera-prueba', '/lecciones/primera-prueba/']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /data-lesson="first-test"/);
    }
    for (const file of fs.readdirSync(directory)) {
      const response = await fetch(`${base}/lessons/first-test/${file}`);
      assert.equal(response.status, 200, file);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(directory, file)));
    }
    const media = `${base}/lessons/first-test/narration.mp3`;
    assert.equal((await fetch(media, { method: 'HEAD' })).headers.get('content-type'), 'audio/mpeg');
    const partial = await fetch(media, { headers: { Range: 'bytes=10-109' } });
    assert.equal(partial.status, 206);
    assert.equal((await partial.arrayBuffer()).byteLength, 100);
    for (const route of ['first-test/.env', 'first-test/%2e%2e%2fserver.cjs', 'constructor/narration.mp3', 'unknown/lesson.json']) {
      assert.equal((await fetch(base + '/lessons/' + route)).status, 404);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
