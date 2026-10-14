const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { crc32 } = require('node:zlib');
const { createServer } = require('../server.cjs');
const { zip } = require('../../scripts/build-course-materials.cjs');

const root = path.join(__dirname, '../..');
const directory = path.join(root, 'lab/public/lessons/create-practice');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n');
const asset = file => fs.readFileSync(path.join(directory, file));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const timestamp = seconds => {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

test('clase 02: voz local, guion, capítulos y subtítulos comparten tiempos y fuentes', () => {
  const lesson = JSON.parse(asset('lesson.json'));
  const code = JSON.parse(asset('code.json'));
  const source = JSON.parse(read('lab/lessons/create-practice.json'));
  assert.equal(lesson.title, source.title);
  assert.equal(lesson.codeFile, 'create-practice.spec.js');
  assert.equal(lesson.audio, 'narration.mp3');
  assert.equal(lesson.language, 'es');
  assert.match(lesson.voiceDisclosure, /Voz de Juan.*clonada con IA.*autorizada/);
  assert.match(lesson.voiceProduction, /localmente/);
  assert.ok(lesson.duration >= 120 && lesson.duration <= 180);
  assert.equal(lesson.sourceSha256, digest(read('lab/lessons/create-practice.json')));
  assert.equal(lesson.audioSha256, digest(asset(lesson.audio)));
  assert.deepEqual(lesson.scenes.map(scene => scene.id), ['objetivo', 'preparar', 'acceder', 'comprobar', 'reto']);
  assert.equal(lesson.subtitles.length, 15);
  assert.deepEqual(lesson.subtitles.map(cue => cue.text), source.scenes.flatMap(scene => scene.cues));
  assert.equal(lesson.sceneAudio.length, 5);

  let previous = 0;
  for (const cue of lesson.subtitles) {
    assert.equal(cue.start, previous);
    assert.ok(Number.isFinite(cue.end) && cue.end > cue.start);
    assert.ok(['screen', 'code'].includes(cue.view));
    previous = cue.end;
  }
  assert.equal(previous, lesson.duration);
  previous = 0;
  for (const [index, scene] of lesson.scenes.entries()) {
    assert.equal(scene.start, previous);
    assert.ok(scene.end > scene.start);
    const { cues, ...original } = source.scenes[index];
    const { start, end, ...published } = scene;
    assert.deepEqual(published, original);
    const sceneCues = lesson.subtitles.filter(cue => cue.start >= start && cue.start < end);
    assert.deepEqual(sceneCues.map(cue => cue.text), cues);
    assert.equal(sceneCues[0].start, start);
    assert.equal(sceneCues.at(-1).end, end);
    assert.ok(code[scene.code]);
    assert.ok(scene.focus.length > 0);
    assert.ok(scene.focus.every(line => Number.isInteger(line) && line > 0 && line <= code[scene.code].split('\n').length));
    if (scene.output) assert.ok(code[scene.output]);
    const audio = lesson.sceneAudio[index];
    assert.equal(audio.scene, scene.id);
    assert.match(audio.audioSha256, /^[a-f0-9]{64}$/);
    assert.ok(audio.alignmentCoverage >= 0.85 && audio.alignmentCoverage <= 1);
    assert.equal(audio.cueStarts.length, cues.length);
    for (const [cueIndex, cue] of sceneCues.entries()) {
      assert.ok(Math.abs(cue.start - start - audio.cueStarts[cueIndex]) < 0.002);
    }
    previous = end;
  }
  assert.equal(previous, lesson.duration);
  for (const filename of ['welcome.png', 'login.png', 'dashboard.png', 'denied.png']) {
    const image = asset(filename);
    assert.ok(image.length > 1000, filename);
    assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  const vtt = ['WEBVTT', ''];
  for (const cue of lesson.subtitles) vtt.push(`${timestamp(cue.start)} --> ${timestamp(cue.end)}`, cue.text, '');
  assert.equal(asset('subtitles.vtt').toString().replaceAll('\r\n', '\n'), vtt.join('\n'));
});

test('clase 02: descargas, fragmentos y evidencia provienen de las pruebas ejecutadas', () => {
  const code = JSON.parse(asset('code.json'));
  const evidence = JSON.parse(asset('evidence.json'));
  const reference = read('lab/e2e/create-practice.spec.js');
  const challenge = read('lab/e2e/create-practice-challenge.spec.js');
  const diagnostic = read('lab/e2e/create-practice-evidence.spec.js');
  assert.equal(asset('create-practice.spec.js').toString(), reference);
  assert.equal(asset('create-practice-challenge.spec.js').toString(), challenge);
  assert.equal(code.completo, reference.trimEnd());
  assert.equal(evidence.sourceSha256, digest(reference));
  assert.equal(evidence.challengeSha256, digest(challenge));
  assert.equal(evidence.diagnosticSourceSha256, digest(diagnostic));
  assert.equal(evidence.status, 'passed');
  assert.equal(evidence.challengeStatus, 'passed');
  assert.equal(evidence.browser, 'chromium');
  assert.equal(evidence.playwright, require('@playwright/test/package.json').version);
  assert.ok(Number.isFinite(Date.parse(evidence.capturedAt)));
  assert.ok(evidence.durationMs >= 0 && evidence.challengeDurationMs >= 0);
  assert.equal(evidence.tests.length, 4);
  assert.ok(evidence.tests.every(result => result.status === 'passed' && result.durationMs >= 0));
  assert.deepEqual(evidence.screenshots.map(image => image.name).sort(), ['welcome.png', 'login.png', 'dashboard.png', 'denied.png'].sort());
  for (const image of evidence.screenshots) assert.equal(image.sha256, digest(asset(image.name)), image.name);
  const snippets = new Map();
  for (const source of [reference, challenge, diagnostic]) {
    for (const match of source.matchAll(/^ {2}\/\/ @snippet (\w+)\n([\s\S]*?)^ {2}\/\/ @end/gm)) {
      snippets.set(match[1], match[2].replace(/^ {2}/gm, '').trimEnd());
    }
  }
  assert.deepEqual([...snippets.keys()].sort(), ['preparar', 'acceder', 'comprobar', 'rechazo'].sort());
  for (const [name, snippet] of snippets) assert.equal(code[name], snippet, name);
  assert.match(code['ejecucion-real'], /Ejecución real.*Chromium/);
  assert.match(code['ejecucion-real'], /passed/);
  assert.ok(code['ejecucion-real'].includes(`${evidence.durationMs} ms`));
  assert.match(code.rechazo, /Email o contraseña incorrectos\./);
});

test('clase 02: ZIPs acumulativos exactos y reproducibles conservan la clase 01 resuelta', () => {
  for (const checkpoint of ['inicio', 'solucion']) {
    const data = asset(`clase-02-${checkpoint}.zip`);
    const expected = new Map(['package.json', 'package-lock.json', 'playwright.config.js', '.gitignore', 'tests/smoke.spec.js']
      .map(name => [name, `course/automation/${name}`]));
    expected.set('README.md', 'course/create-practice/README.md');
    expected.set('tests/first-test.spec.js', 'lab/e2e/first-test.spec.js');
    expected.set('tests/first-test-challenge.spec.js', 'lab/e2e/first-test-challenge.spec.js');
    expected.set('tests/create-practice.spec.js', checkpoint === 'inicio' ? 'course/create-practice/create-practice.spec.js' : 'lab/e2e/create-practice.spec.js');
    if (checkpoint === 'solucion') expected.set('tests/create-practice-challenge.spec.js', 'lab/e2e/create-practice-challenge.spec.js');
    let cursor = 0;
    const entries = [];
    while (data.readUInt32LE(cursor) === 0x04034b50) {
      const size = data.readUInt32LE(cursor + 18);
      const length = data.readUInt16LE(cursor + 26);
      const name = data.subarray(cursor + 30, cursor + 30 + length).toString();
      const content = data.subarray(cursor + 30 + length, cursor + 30 + length + size);
      assert.ok(expected.has(name), `Unexpected ZIP entry: ${name}`);
      assert.equal(content.toString(), read(expected.get(name)), name);
      assert.equal(crc32(content), data.readUInt32LE(cursor + 14), name);
      entries.push([name, content]);
      cursor += 30 + length + size;
    }
    assert.deepEqual(entries.map(([name]) => name), [...expected.keys()]);
    assert.deepEqual(data, zip(entries));
    const exercise = entries.find(([name]) => name === 'tests/create-practice.spec.js')[1].toString();
    if (checkpoint === 'inicio') assert.match(exercise, /test\.skip\(/);
    else assert.doesNotMatch(exercise, /test\.skip\(/);
  }
});

test('clase 02: página y recursos permitidos, descargas, audio parcial y rechazo de traversal', async () => {
  const server = createServer({ filename: ':memory:', testing: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/lecciones/crear-practica', '/lecciones/crear-practica/']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /data-lesson="create-practice"/);
      assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
    }
    const files = ['welcome.png', 'login.png', 'dashboard.png', 'denied.png', 'narration.mp3',
      'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt', 'create-practice.spec.js',
      'create-practice-challenge.spec.js', 'clase-02-inicio.zip', 'clase-02-solucion.zip'];
    assert.deepEqual(fs.readdirSync(directory).sort(), [...files].sort());
    for (const file of files) {
      const response = await fetch(`${base}/lessons/create-practice/${file}`);
      assert.equal(response.status, 200, file);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), asset(file), file);
      if (file.endsWith('.zip') || file.endsWith('.spec.js')) {
        assert.equal(response.headers.get('content-disposition'), `attachment; filename="${file}"`);
      }
    }
    const bytes = asset('narration.mp3');
    const media = `${base}/lessons/create-practice/narration.mp3`;
    const head = await fetch(media, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-type'), 'audio/mpeg');
    assert.equal(head.headers.get('accept-ranges'), 'bytes');
    assert.equal(Number(head.headers.get('content-length')), bytes.length);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const partial = await fetch(media, { headers: { Range: 'bytes=10-109' } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('content-range'), `bytes 10-109/${bytes.length}`);
    assert.deepEqual(Buffer.from(await partial.arrayBuffer()), bytes.subarray(10, 110));
    const suffix = await fetch(media, { headers: { Range: 'bytes=-40' } });
    assert.equal(suffix.status, 206);
    assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), bytes.subarray(-40));
    for (const range of ['bytes=5-1', 'bytes=-0', 'bytes=-', 'bytes=999999999-']) {
      assert.equal((await fetch(media, { headers: { Range: range } })).status, 416, range);
    }
    for (const route of ['create-practice/.env', 'create-practice/private.json',
      'create-practice/%2e%2e%2fserver.cjs', 'create-practice/%2e%2e%5cserver.cjs',
      'create-practice/nested/lesson.json', 'constructor/narration.mp3', 'unknown/lesson.json']) {
      assert.equal((await fetch(base + '/lessons/' + route)).status, 404, route);
    }
    assert.equal((await fetch(media, { method: 'POST' })).status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
