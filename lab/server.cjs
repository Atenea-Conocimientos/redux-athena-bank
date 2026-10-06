const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { Bank, BankError, DEMO_PASSWORD, PROFILES } = require('./bank.cjs');

function createServer({
  filename,
  bank = new Bank(filename),
  testing = false,
} = {}) {
  const sessions = new Map();
  const failures = new Map();
  const publicDir = path.join(__dirname, 'public');
  const cookies = (req) =>
    Object.fromEntries(
      (req.headers.cookie || '').split(';').map((v) => v.trim().split('=')),
    );
  const cookie = (name, value, seconds = 3600) =>
    `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
  const send = (res, code, data, headers = {}) => {
    res.writeHead(code, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(JSON.stringify(data));
  };
  async function body(req) {
    if (!String(req.headers['content-type']).startsWith('application/json'))
      throw new BankError('Se requiere application/json.', 415);
    let text = '';
    for await (const chunk of req) {
      text += chunk;
      if (Buffer.byteLength(text) > 100000)
        throw new BankError('Solicitud demasiado grande.', 413);
    }
    try {
      const parsed = JSON.parse(text || '{}');
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
        throw new Error();
      return parsed;
    } catch {
      throw new BankError('JSON inválido.');
    }
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'",
    );
    try {
      // Never a public banking service. Local-only and protected from cross-origin browser writes.
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || ''))
        throw new BankError('Host local requerido.', 403);
      const origin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== origin)
        throw new BankError('Origen no permitido.', 403);
      const url = new URL(req.url, origin);
      const route = url.pathname;
      if (route === '/api/health')
        return send(res, 200, {
          status: 'ok',
          mode: 'local-lab',
          realMoney: false,
        });
      if (!route.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method))
          throw new BankError('Método no permitido.', 405);
        const assets = {
          '/app.js': 'app.js',
          '/style.css': 'style.css',
          '/provider.html': 'provider.html',
          '/provider.js': 'provider.js',
        };
        const file =
          assets[route] || (route.includes('.') ? null : 'index.html');
        if (!file) throw new BankError('Recurso no encontrado.', 404);
        const mime = file.endsWith('.js')
          ? 'text/javascript'
          : file.endsWith('.css')
            ? 'text/css'
            : 'text/html';
        res.writeHead(200, {
          'Content-Type': `${mime}; charset=utf-8`,
          'Cache-Control': 'no-cache',
        });
        return res.end(
          req.method === 'HEAD'
            ? undefined
            : fs.readFileSync(path.join(publicDir, file)),
        );
      }
      const c = cookies(req);
      const labId = c.athena_lab;
      if (route === '/api/labs' && req.method === 'POST') {
        const input = await body(req);
        const id = bank.create(input.profile || 'stable');
        return send(
          res,
          201,
          {
            id,
            profile: input.profile || 'stable',
            users: ['ana@demo.test', 'bruno@demo.test'],
            password: DEMO_PASSWORD,
          },
          {
            'Set-Cookie': [
              cookie('athena_lab', id, 86400),
              cookie('athena_session', '', 0),
            ],
          },
        );
      }
      bank.read(labId);
      if (route === '/api/lab' && req.method === 'GET')
        return send(res, 200, {
          profile: bank.read(labId).profile,
          profiles: PROFILES,
        });
      if (route === '/api/lab' && req.method === 'DELETE') {
        bank.db.prepare('DELETE FROM labs WHERE id = ?').run(labId);
        for (const [key, value] of sessions)
          if (value.labId === labId) sessions.delete(key);
        return send(
          res,
          200,
          { deleted: true },
          {
            'Set-Cookie': [
              cookie('athena_lab', '', 0),
              cookie('athena_session', '', 0),
            ],
          },
        );
      }
      if (
        ['/api/auth/login', '/api/auth/register'].includes(route) &&
        req.method === 'POST'
      ) {
        const input = await body(req);
        const limit = failures.get(labId);
        if (limit && limit.count >= 10 && limit.until > Date.now())
          throw new BankError('Demasiados intentos. Esperá un minuto.', 429);
        let user;
        try {
          user = route.endsWith('/login')
            ? bank.login(labId, input.email, input.password)
            : bank.register(labId, input);
        } catch (error) {
          failures.set(labId, {
            count: limit && limit.until > Date.now() ? limit.count + 1 : 1,
            until: Date.now() + 60000,
          });
          throw error;
        }
        failures.delete(labId);
        const token = randomBytes(32).toString('hex');
        sessions.set(token, {
          labId,
          userId: user.id,
          expiresAt: Date.now() + 3600000,
        });
        return send(
          res,
          200,
          { user },
          { 'Set-Cookie': cookie('athena_session', token) },
        );
      }
      const session = sessions.get(c.athena_session);
      if (
        !session ||
        session.labId !== labId ||
        session.expiresAt <= Date.now()
      )
        throw new BankError(
          'Iniciá sesión para continuar.',
          401,
          'AUTH_REQUIRED',
        );
      const userId = session.userId;
      if (route === '/api/auth/logout' && req.method === 'POST') {
        sessions.delete(c.athena_session);
        return send(
          res,
          200,
          { loggedOut: true },
          { 'Set-Cookie': cookie('athena_session', '', 0) },
        );
      }
      if (route === '/api/overview' && req.method === 'GET')
        return send(res, 200, bank.snapshot(labId, userId));
      if (route === '/api/lab/clock' && req.method === 'POST')
        return send(res, 200, bank.advance(labId, (await body(req)).minutes));
      if (route === '/api/accounts' && req.method === 'POST')
        return send(res, 201, bank.account(labId, userId, await body(req)));
      const acc = route.match(
        /^\/api\/accounts\/([^/]+)(?:\/(deposit|freeze))?$/,
      );
      if (acc) {
        if (req.method === 'DELETE' && !acc[2])
          return send(res, 200, bank.closeAccount(labId, userId, acc[1]));
        const input = await body(req);
        if (req.method === 'POST' && acc[2] === 'deposit')
          return send(
            res,
            200,
            bank.deposit(labId, userId, acc[1], input.amount),
          );
        if (req.method === 'PUT' && acc[2] === 'freeze')
          return send(
            res,
            200,
            bank.freeze(labId, userId, acc[1], input.frozen),
          );
      }
      if (route === '/api/quotes' && req.method === 'POST')
        return send(res, 201, bank.quote(labId, userId, await body(req)));
      if (route === '/api/transfers' && req.method === 'POST') {
        const input = await body(req);
        input.key = req.headers['idempotency-key'];
        return send(res, 201, bank.transfer(labId, userId, input));
      }
      const tx = route.match(
        /^\/api\/transfers\/([^/]+)(?:\/(settle|cancel))?$/,
      );
      if (tx) {
        if (req.method === 'POST' && tx[2] === 'settle') {
          const input = await body(req);
          return send(
            res,
            200,
            bank.settle(labId, userId, tx[1], input.simulateFailure === true),
          );
        }
        if (req.method === 'POST' && tx[2] === 'cancel')
          return send(res, 200, bank.cancel(labId, userId, tx[1]));
        if (req.method === 'GET' && !tx[2]) {
          const item = bank
            .snapshot(labId, userId)
            .transfers.find((t) => t.id === tx[1]);
          if (!item) throw new BankError('Transferencia no encontrada.', 404);
          return send(res, 200, item);
        }
      }
      if (route === '/api/beneficiaries' && req.method === 'POST')
        return send(res, 201, bank.beneficiary(labId, userId, await body(req)));
      if (route === '/api/beneficiaries/order' && req.method === 'PUT')
        return send(
          res,
          200,
          bank.reorder(labId, userId, (await body(req)).ids),
        );
      if (route === '/api/documents/import' && req.method === 'POST')
        return send(res, 201, bank.importCsv(labId, userId, await body(req)));
      if (route === '/api/statement.csv' && req.method === 'GET') {
        // CSV formula injection prevention, even though this is fake data.
        const cell = (value) =>
          '"' +
          String(value)
            .replace(/^[=+@\-]/, "'$&")
            .replaceAll('"', '""') +
          '"';
        const rows = bank
          .snapshot(labId, userId)
          .movements.map((m) =>
            [
              new Date(m.createdAt).toISOString(),
              m.alias,
              m.type,
              (m.amount / 100).toFixed(2),
              m.description,
            ]
              .map(cell)
              .join(','),
          );
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="athena-movimientos.csv"',
          'Cache-Control': 'no-store',
        });
        return res.end(
          ['fecha,cuenta,tipo,importe,descripcion', ...rows].join('\r\n'),
        );
      }
      throw new BankError('Ruta no encontrada.', 404, 'NOT_FOUND');
    } catch (error) {
      if (res.headersSent) return res.end();
      send(res, error instanceof BankError ? error.status : 500, {
        message:
          error instanceof BankError
            ? error.message
            : 'Error interno del laboratorio.',
        code: error.code || 'INTERNAL',
      });
      if (!(error instanceof BankError) && !testing)
        console.error(error.message); // Never log credentials/body.
    }
  });
  server.bank = bank;
  server.on('close', () => bank.close());
  return server;
}
if (require.main === module) {
  const dir = path.join(__dirname, '..', '.lab-data');
  fs.mkdirSync(dir, { recursive: true });
  const port = Number(process.env.LAB_PORT || 4177);
  const server = createServer({
    filename: process.env.LAB_DB || path.join(dir, 'bank.sqlite'),
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(
      `Athena Bank Lab · http://127.0.0.1:${port} · solo datos ficticios`,
    ),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => server.close(() => process.exit(0)));
}
module.exports = { createServer };
