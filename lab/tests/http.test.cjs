const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../server.cjs');
const { DEMO_PASSWORD } = require('../bank.cjs');

async function setup(t) {
  const server = createServer({ testing: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    const jar = new Map();
    return async (path, method = 'GET', data, headers = {}) => {
      const res = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
          ...headers,
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
      res.headers.getSetCookie().forEach((c) => {
        const [k, v] = c.split(';')[0].split('=');
        jar.set(k, v);
      });
      const text = await res.text();
      return {
        status: res.status,
        headers: res.headers,
        data: res.headers.get('content-type')?.includes('json')
          ? JSON.parse(text)
          : text,
      };
    };
  }
  const api = client();
  await api('/api/labs', 'POST', {});
  await api('/api/auth/login', 'POST', {
    email: 'ana@demo.test',
    password: DEMO_PASSWORD,
  });
  return { api, client };
}

test('HTTP: expirar mi sesión no vence la de otra práctica ni depende del reloj bancario', async (t) => {
  const { api, client } = await setup(t);
  const second = client();
  await second('/api/labs', 'POST', {});
  await second('/api/auth/login', 'POST', {
    email: 'bruno@demo.test',
    password: DEMO_PASSWORD,
  });
  assert.equal(
    (await api('/api/lab/clock', 'POST', { minutes: 1440 })).status,
    200,
  );
  assert.equal((await api('/api/overview')).status, 200);
  assert.equal((await api('/api/lab/session/expire', 'POST')).status, 200);
  assert.equal((await api('/api/overview')).status, 401);
  assert.equal(
    (await api('/api/accounts/ana-main/deposit', 'POST', { amount: 100 }))
      .status,
    401,
  );
  assert.equal((await second('/api/overview')).status, 200);
});

test('HTTP: autenticación, ownership, cookies protegidas y logout invalidado', async (t) => {
  const { api, client } = await setup(t);
  const anon = client();
  await anon('/api/labs', 'POST', {});
  assert.equal((await anon('/api/overview')).status, 401);
  const login = await anon('/api/auth/login', 'POST', {
    email: 'bruno@demo.test',
    password: DEMO_PASSWORD,
  });
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal(
    (await api('/api/accounts/bruno-main/deposit', 'POST', { amount: 10 }))
      .status,
    404,
  );
  assert.equal((await api('/api/auth/logout', 'POST')).status, 200);
  assert.equal((await api('/api/overview')).status, 401);
});

test('HTTP: origen cruzado y cuerpo inválido rechazados sin cambios', async (t) => {
  const { api } = await setup(t);
  assert.equal(
    (
      await api(
        '/api/accounts/ana-main/deposit',
        'POST',
        { amount: 100 },
        { Origin: 'https://evil.example' },
      )
    ).status,
    403,
  );
  assert.equal(
    (await api('/api/accounts/ana-main/deposit', 'POST', { amount: -100 }))
      .status,
    400,
  );
  assert.equal(
    (
      await api(
        '/api/accounts/ana-main/deposit',
        'POST',
        {},
        { 'Content-Type': 'text/plain' },
      )
    ).status,
    415,
  );
  assert.equal((await api('/api/accounts', 'POST', ['array'])).status, 400);
  assert.equal((await api('/api/overview')).data.accounts[0].balance, 250000);
});

test('HTTP: envíos concurrentes son idempotentes y no sobre-reservan saldo', async (t) => {
  const { api } = await setup(t);
  const q = (
    await api('/api/quotes', 'POST', {
      from: 'ana-save',
      toAlias: 'bruno.diaria',
      amount: 40000,
    })
  ).data;
  const send = () =>
    api(
      '/api/transfers',
      'POST',
      { quoteId: q.id, otp: '246810' },
      { 'Idempotency-Key': 'parallel-key' },
    );
  const [one, two] = await Promise.all([send(), send()]);
  assert.equal(one.status, 201);
  assert.equal(two.status, 201);
  assert.equal(one.data.id, two.data.id);
  assert.equal((await api('/api/overview')).data.transfers.length, 1);
  assert.equal(
    (
      await api('/api/quotes', 'POST', {
        from: 'ana-save',
        toAlias: 'bruno.diaria',
        amount: 30000,
      })
    ).status,
    409,
  );
});

test('HTTP: CSV descargable, reset aislado y límites de intentos de login', async (t) => {
  const { api, client } = await setup(t);
  const other = client();
  await other('/api/labs', 'POST', {});
  const csv = await api('/api/statement.csv');
  assert.match(csv.headers.get('content-disposition'), /attachment/);
  assert.match(csv.data, /ana.diaria/);
  assert.doesNotMatch(csv.data, /bruno.diaria/);
  await api('/api/lab', 'DELETE');
  assert.equal((await api('/api/lab')).status, 404);
  assert.equal((await other('/api/lab')).status, 200);
  for (let i = 0; i < 10; i++)
    assert.equal(
      (
        await other('/api/auth/login', 'POST', {
          email: 'nobody@demo.test',
          password: 'wrong',
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await other('/api/auth/login', 'POST', {
        email: 'ana@demo.test',
        password: DEMO_PASSWORD,
      })
    ).status,
    429,
  );
});
