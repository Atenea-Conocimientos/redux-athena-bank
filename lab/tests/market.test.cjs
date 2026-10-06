const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const { createServer } = require('../server.cjs');

async function setup(t) {
  const server = createServer({ testing: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base, url: base.replace('http:', 'ws:') + '/ws/market' };
}

test('proveedor HTTP: público, ficticio, sin cookies ni información bancaria', async (t) => {
  const { base } = await setup(t);
  const res = await fetch(base + '/api/market/rates');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('set-cookie'), null);
  const data = await res.json();
  assert.deepEqual(
    Object.keys(data).sort(),
    ['fictional', 'base', 'sequence', 'asOf', 'expiresAt', 'rates'].sort(),
  );
  assert.equal(data.fictional, true);
  assert.equal(data.expiresAt - data.asOf, 90000);
  assert.deepEqual(data.rates, { USD: 1000, EUR: 1200 });
  assert.equal(
    (
      await fetch(base + '/api/market/rates', {
        headers: { Origin: 'https://attacker.test' },
      })
    ).status,
    403,
  );
});

test('WebSocket: cada conexión tiene su secuencia; control desconocido no altera datos', async (t) => {
  const { url, base } = await setup(t);
  const first = new WebSocket(url, { origin: base });
  const initial = await once(first, 'message');
  assert.equal(JSON.parse(initial[0]).sequence, 0);
  const next = once(first, 'message');
  first.send('next');
  assert.equal(JSON.parse((await next)[0]).sequence, 1);
  const second = new WebSocket(url, { origin: base });
  assert.equal(JSON.parse((await once(second, 'message'))[0]).sequence, 0);
  const unknown = once(first, 'message');
  first.send('transfer-all-funds');
  assert.equal(JSON.parse((await unknown)[0]).type, 'error');
  const closed = once(first, 'close');
  first.send('disconnect');
  assert.equal((await closed)[0], 1012);
  second.terminate();
});

test('WebSocket rechaza origen externo, origen ausente y ruta incorrecta', async (t) => {
  const { url, base } = await setup(t);
  for (const [target, origin] of [
    [url, 'https://evil.test'],
    [url, undefined],
    [url + '/private', base],
  ]) {
    const socket = new WebSocket(target, { origin });
    const [error] = await once(socket, 'error');
    assert.match(error.message, /403/);
  }
});

test('WebSocket limita tamaño del mensaje sin derribar el servidor', async (t) => {
  const { url, base } = await setup(t);
  const socket = new WebSocket(url, { origin: base });
  await once(socket, 'message');
  const closed = once(socket, 'close');
  socket.send('x'.repeat(1025));
  assert.equal((await closed)[0], 1009);
  assert.equal((await fetch(base + '/api/health')).status, 200);
});
