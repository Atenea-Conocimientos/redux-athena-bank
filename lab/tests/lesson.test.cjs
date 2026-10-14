const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createServer } = require('../server.cjs');
const directory = path.join(__dirname, '../public/lessons/pending-transfer');
const lesson = require('../public/lessons/pending-transfer/lesson.json');
const code = require('../public/lessons/pending-transfer/code.json');
const readSource = (file) =>
  fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');

test('microlección: duración, subtítulos, capturas y código corresponden al guion probado', () => {
  assert.ok(lesson.duration >= 120 && lesson.duration <= 180);
  if (lesson.audioSha256) {
    assert.equal(lesson.audioSha256, createHash('sha256').update(fs.readFileSync(path.join(directory, lesson.audio))).digest('hex'));
    assert.equal(lesson.sceneAudio.length, 7);
    assert.ok(lesson.sceneAudio.every(scene => scene.alignmentCoverage >= 0.85));
  }
  assert.equal(lesson.scenes.length, 7);
  assert.equal(
    lesson.sourceSha256,
    createHash('sha256')
      .update(
        readSource(path.join(__dirname, '../lessons/pending-transfer.json')),
      )
      .digest('hex'),
  );
  assert.equal(lesson.scenes[0].start, 0);
  assert.equal(lesson.scenes.at(-1).end, lesson.duration);
  let previous = 0;
  for (const cue of lesson.subtitles) {
    assert.equal(cue.start, previous);
    assert.ok(cue.end > cue.start);
    assert.ok(cue.text.length > 0);
    previous = cue.end;
  }
  assert.equal(previous, lesson.duration);
  for (const scene of lesson.scenes) {
    assert.ok(code[scene.code]);
    assert.ok(fs.statSync(path.join(directory, scene.image)).size > 1000);
    assert.ok(
      scene.focus.every(
        (line) => line > 0 && line <= code[scene.code].split('\n').length,
      ),
    );
  }
  const source = readSource(
    path.join(__dirname, '../e2e/pending-lesson.spec.js'),
  );
  assert.deepEqual(
    readSource(path.join(directory, 'pending-lesson.spec.js')),
    source,
  );
  const evidence = require('../public/lessons/pending-transfer/evidence.json');
  assert.equal(
    evidence.sourceSha256,
    createHash('sha256').update(source).digest('hex'),
  );
  for (const match of source
    .toString()
    .matchAll(/    \/\/ @snippet (\w+)\r?\n([\s\S]*?)    \/\/ @end/g)) {
    assert.equal(code[match[1]], match[2].replace(/^    /gm, '').trimEnd());
  }
});

test('microlección: recursos locales, HEAD, rangos de audio y rutas no permitidas', async () => {
  const server = createServer({ filename: ':memory:', testing: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(`${base}/lecciones/transferencia-pendiente/`);
    assert.equal(page.status, 200);
    assert.match(
      page.headers.get('content-security-policy'),
      /script-src 'self'/,
    );
    const media = '/lessons/pending-transfer/narration.mp3';
    const size = fs.statSync(path.join(directory, 'narration.mp3')).size;
    const head = await fetch(base + media, { method: 'HEAD' });
    assert.equal(Number(head.headers.get('content-length')), size);
    assert.equal(head.headers.get('content-type'), 'audio/mpeg');
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const partial = await fetch(base + media, {
      headers: { Range: 'bytes=0-99' },
    });
    assert.equal(partial.status, 206);
    assert.equal((await partial.arrayBuffer()).byteLength, 100);
    assert.equal(partial.headers.get('content-range'), `bytes 0-99/${size}`);
    const suffix = await fetch(base + media, {
      headers: { Range: 'bytes=-40' },
    });
    assert.equal(suffix.status, 206);
    assert.equal((await suffix.arrayBuffer()).byteLength, 40);
    for (const range of [
      'bytes=5-1',
      'bytes=-0',
      'bytes=-',
      'bytes=999999999-',
    ]) {
      assert.equal(
        (await fetch(base + media, { headers: { Range: range } })).status,
        416,
      );
    }
    assert.equal(
      (await fetch(base + '/lessons/pending-transfer/private.json')).status,
      404,
    );
    assert.equal(
      (await fetch(base + '/lessons/pending-transfer/%2e%2e%2fserver.cjs'))
        .status,
      404,
    );
    assert.equal((await fetch(base + media, { method: 'POST' })).status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
