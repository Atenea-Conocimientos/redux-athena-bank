const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { crc32 } = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { names, zip } = require('../../scripts/build-course-materials.cjs');
const root = path.join(__dirname, '../..');
const { createServer } = require('../server.cjs');

test('curso: ZIPs reproducibles, mínimos y con solución idéntica al test real', () => {
  for (const checkpoint of ['inicio', 'solucion']) {
    const data = fs.readFileSync(path.join(root, `lab/public/lessons/pending-transfer/athena-automation-${checkpoint}.zip`));
    let cursor = 0;
    const entries = [];
    while (data.readUInt32LE(cursor) === 0x04034b50) {
      const size = data.readUInt32LE(cursor + 18);
      const length = data.readUInt16LE(cursor + 26);
      const name = data.subarray(cursor + 30, cursor + 30 + length).toString();
      const content = data.subarray(cursor + 30 + length, cursor + 30 + length + size);
      assert.equal(crc32(content), data.readUInt32LE(cursor + 14));
      const expected = checkpoint === 'solucion' && name === 'tests/pending-lesson.spec.js'
        ? path.join(root, 'lab/e2e/pending-lesson.spec.js') : path.join(root, 'course/automation', name);
      assert.equal(content.toString('utf8'), fs.readFileSync(expected, 'utf8').replaceAll('\r\n', '\n'));
      entries.push([name, content]);
      cursor += 30 + length + size;
    }
    assert.deepEqual(entries.map(([name]) => name), names);
    assert.deepEqual(data, zip(entries));
    assert.equal(data.readUInt32LE(cursor), 0x02014b50);
    assert.equal(data.readUInt32LE(data.length - 22), 0x06054b50);
  }
});

test('curso: URL del alumno rechaza destinos no locales y acepta puerto local', () => {
  const config = path.join(root, 'course/automation/playwright.config.js');
  for (const target of ['https://example.com', 'http://127.0.0.1.example.com', 'http://user:pass@localhost', 'http://localhost/path']) {
    const result = spawnSync(process.execPath, [config], { env: { ...process.env, LAB_BASE_URL: target } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr.toString(), /LAB_BASE_URL debe/);
  }
  assert.equal(spawnSync(process.execPath, [config], { env: { ...process.env, LAB_BASE_URL: 'http://127.0.0.1:4178' } }).status, 0);
});

test('curso: guía y ZIPs se sirven sin sesión y no se exponen archivos privados', async () => {
  const server = createServer({ filename: ':memory:', testing: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const guide = await fetch(base + '/lecciones/preparar-repositorio/');
    assert.equal(guide.status, 200);
    assert.match(await guide.text(), /Tu repo\./);
    for (const checkpoint of ['inicio', 'solucion']) {
      const name = `athena-automation-${checkpoint}.zip`;
      const response = await fetch(base + '/lessons/pending-transfer/' + name);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/zip');
      assert.match(response.headers.get('content-disposition'), /attachment/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(root, 'lab/public/lessons/pending-transfer', name)));
    }
    assert.equal((await fetch(base + '/lessons/pending-transfer/.env')).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
