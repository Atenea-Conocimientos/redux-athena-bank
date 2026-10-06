const { DatabaseSync } = require('node:sqlite');
const {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require('node:crypto');

const DEMO_PASSWORD = 'Practica2026!'; // Public, synthetic lab credentials, never reuse elsewhere.
const DAILY_LIMIT = 100000;
const PROFILES = ['stable', 'duplicate-submit', 'missing-reservation'];
class BankError extends Error {
  constructor(message, status = 400, code = 'VALIDATION') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const requireThat = (condition, message, status, code) => {
  if (!condition) throw new BankError(message, status, code);
};
function cents(value) {
  requireThat(
    typeof value === 'number' &&
      Number.isSafeInteger(value) &&
      value > 0 &&
      value <= 100000000,
    'El importe debe ser un entero positivo en centavos, hasta 100000000.',
  );
  return value;
}
function cleanText(value, max = 120) {
  requireThat(
    typeof value === 'string' &&
      value.trim().length > 0 &&
      value.trim().length <= max,
    `Texto requerido (máximo ${max} caracteres).`,
  );
  return value.trim();
}
function hash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}
function matches(password, stored) {
  if (typeof password !== 'string' || password.length > 200) return false;
  const [salt, digest] = stored.split(':');
  return timingSafeEqual(
    Buffer.from(digest, 'hex'),
    scryptSync(password, salt, 32),
  );
}
const DEMO_HASH = hash(DEMO_PASSWORD);
const now = (state) => Date.now() + state.offset;
const day = (time) => new Date(time).toISOString().slice(0, 10); // Explicit UTC business day.
const feeFor = (amount) => Math.max(100, Math.ceil(amount / 100));
const owned = (state, userId, id) => {
  const account = state.accounts.find(
    (a) => a.id === id && a.userId === userId && !a.closed,
  );
  requireThat(account, 'Cuenta no encontrada.', 404, 'NOT_FOUND');
  return account;
};
const reserve = (state, accountId) =>
  state.transfers
    .filter((t) => t.from === accountId && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount + t.fee, 0);
const available = (state, account) =>
  account.balance -
  (state.profile === 'missing-reservation' ? 0 : reserve(state, account.id));
const usedToday = (state, userId) =>
  state.transfers
    .filter(
      (t) =>
        t.userId === userId &&
        ['pending', 'completed'].includes(t.status) &&
        day(t.createdAt) === day(now(state)),
    )
    .reduce((sum, t) => sum + t.amount, 0);
function movement(state, account, amount, type, reference, description) {
  state.movements.push({
    id: randomUUID(),
    accountId: account.id,
    userId: account.userId,
    amount,
    type,
    reference,
    description,
    createdAt: now(state),
    alias: account.alias,
  });
}
function seed(profile) {
  const state = {
    profile,
    offset: 0,
    treasury: 0,
    users: [
      {
        id: 'ana',
        name: 'Ana Torres',
        email: 'ana@demo.test',
        password: DEMO_HASH,
      },
      {
        id: 'bruno',
        name: 'Bruno Díaz',
        email: 'bruno@demo.test',
        password: DEMO_HASH,
      },
    ],
    accounts: [
      {
        id: 'ana-main',
        userId: 'ana',
        name: 'Cuenta diaria',
        alias: 'ana.diaria',
        type: 'checking',
        balance: 250000,
        frozen: false,
        closed: false,
      },
      {
        id: 'ana-save',
        userId: 'ana',
        name: 'Fondo de ahorro',
        alias: 'ana.ahorro',
        type: 'savings',
        balance: 60000,
        frozen: false,
        closed: false,
      },
      {
        id: 'bruno-main',
        userId: 'bruno',
        name: 'Cuenta diaria',
        alias: 'bruno.diaria',
        type: 'checking',
        balance: 120000,
        frozen: false,
        closed: false,
      },
    ],
    transfers: [],
    quotes: [],
    movements: [],
    beneficiaries: [],
    documents: [],
    audit: [],
  };
  state.accounts.forEach((a) =>
    movement(
      state,
      a,
      a.balance,
      'opening',
      a.id,
      'Saldo inicial del laboratorio',
    ),
  );
  return state;
}
class Bank {
  constructor(filename = ':memory:') {
    this.db = new DatabaseSync(filename);
    this.db.exec(
      'PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS labs (id TEXT PRIMARY KEY, state TEXT NOT NULL);',
    );
  }
  create(profile = 'stable') {
    requireThat(PROFILES.includes(profile), 'Perfil de práctica inválido.');
    const id = randomBytes(24).toString('hex');
    this.db
      .prepare('INSERT INTO labs VALUES (?, ?)')
      .run(id, JSON.stringify(seed(profile)));
    return id;
  }
  read(id) {
    const row = this.db
      .prepare('SELECT state FROM labs WHERE id = ?')
      .get(id || '');
    requireThat(
      row,
      'Iniciá un laboratorio para practicar.',
      404,
      'LAB_REQUIRED',
    );
    return JSON.parse(row.state);
  }
  change(id, action) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const state = this.read(id);
      const result = action(state);
      this.db
        .prepare('UPDATE labs SET state = ? WHERE id = ?')
        .run(JSON.stringify(state), id);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  login(id, email, password) {
    const user = this.read(id).users.find(
      (u) => u.email === String(email).trim().toLowerCase(),
    );
    requireThat(
      user && matches(password, user.password),
      'Email o contraseña incorrectos.',
      401,
      'CREDENTIALS',
    );
    return { id: user.id, name: user.name, email: user.email };
  }
  register(id, input) {
    return this.change(id, (state) => {
      const name = cleanText(input.name, 60);
      const email = cleanText(input.email).toLowerCase();
      requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email inválido.');
      requireThat(
        typeof input.password === 'string' &&
          input.password.length >= 10 &&
          input.password.length <= 100,
        'La contraseña debe tener entre 10 y 100 caracteres.',
      );
      requireThat(
        !state.users.some((u) => u.email === email),
        'El email ya existe en este laboratorio.',
        409,
      );
      const user = {
        id: randomUUID(),
        name,
        email,
        password: hash(input.password),
      };
      state.users.push(user);
      return { id: user.id, name, email };
    });
  }
  snapshot(id, userId) {
    const state = this.read(id);
    const user = state.users.find((u) => u.id === userId);
    requireThat(user, 'Sesión inválida.', 401);
    return {
      user: { id: user.id, name: user.name, email: user.email },
      profile: state.profile,
      serverTime: now(state),
      dailyLimit: DAILY_LIMIT,
      dailyUsed: usedToday(state, userId),
      accounts: state.accounts
        .filter((a) => a.userId === userId && !a.closed)
        .map((a) => ({
          ...a,
          reserved: reserve(state, a.id),
          available: available(state, a),
        })),
      transfers: state.transfers
        .filter(
          (t) =>
            t.userId === userId ||
            state.accounts.some((a) => a.id === t.to && a.userId === userId),
        )
        .toReversed(),
      movements: state.movements
        .filter((m) => m.userId === userId)
        .toReversed(),
      beneficiaries: state.beneficiaries
        .filter((b) => b.userId === userId)
        .sort((a, b) => a.position - b.position),
      documents: state.documents.filter((d) => d.userId === userId),
    };
  }
  account(id, userId, input) {
    return this.change(id, (state) => {
      requireThat(
        state.accounts.filter((a) => a.userId === userId && !a.closed).length <
          4,
        'Máximo 4 cuentas activas.',
      );
      requireThat(
        ['checking', 'savings'].includes(input.type),
        'Tipo de cuenta inválido.',
      );
      const alias = cleanText(input.alias, 30).toLowerCase();
      requireThat(
        /^[a-z0-9.]{5,30}$/.test(alias),
        'Alias: entre 5 y 30 letras, números o puntos.',
      );
      requireThat(
        !state.accounts.some((a) => a.alias === alias),
        'El alias ya existe.',
        409,
      );
      const account = {
        id: randomUUID(),
        userId,
        name: cleanText(input.name, 40),
        alias,
        type: input.type,
        balance: 0,
        frozen: false,
        closed: false,
      };
      state.accounts.push(account);
      movement(state, account, 0, 'opening', account.id, 'Cuenta abierta');
      return account;
    });
  }
  deposit(id, userId, accountId, amount) {
    cents(amount);
    return this.change(id, (state) => {
      const account = owned(state, userId, accountId);
      requireThat(!account.frozen, 'La cuenta está congelada.');
      requireThat(
        account.balance + amount <= 100000000,
        'Saldo máximo de laboratorio excedido.',
      );
      account.balance += amount;
      movement(
        state,
        account,
        amount,
        'deposit',
        randomUUID(),
        'Depósito ficticio',
      );
      return account;
    });
  }
  freeze(id, userId, accountId, frozen) {
    requireThat(typeof frozen === 'boolean', 'frozen debe ser booleano.');
    return this.change(id, (state) => {
      const a = owned(state, userId, accountId);
      a.frozen = frozen;
      return a;
    });
  }
  closeAccount(id, userId, accountId) {
    return this.change(id, (state) => {
      const a = owned(state, userId, accountId);
      requireThat(
        a.balance === 0 &&
          !state.transfers.some(
            (t) => t.status === 'pending' && [t.from, t.to].includes(a.id),
          ),
        'Para cerrar la cuenta, el saldo debe ser cero y no debe haber transferencias pendientes.',
      );
      a.closed = true;
      movement(state, a, 0, 'closure', a.id, 'Cuenta cerrada');
      return { closed: true };
    });
  }
  validateTransfer(state, userId, input) {
    cents(input.amount);
    const from = owned(state, userId, input.from);
    const to = state.accounts.find(
      (a) => a.alias === input.toAlias && !a.closed,
    );
    requireThat(to, 'El alias de destino no existe.', 404);
    requireThat(from.id !== to.id, 'No podés transferir a la misma cuenta.');
    requireThat(
      !from.frozen && !to.frozen,
      'La cuenta de origen o destino está congelada.',
    );
    const fee = from.userId === to.userId ? 0 : feeFor(input.amount);
    requireThat(
      available(state, from) >= input.amount + fee,
      'Saldo disponible insuficiente.',
      409,
      'FUNDS',
    );
    requireThat(
      usedToday(state, userId) + input.amount <= DAILY_LIMIT,
      'Límite diario excedido.',
      409,
      'LIMIT',
    );
    requireThat(
      to.balance + input.amount <= 100000000,
      'Saldo máximo de destino excedido.',
    );
    return { from, to, fee };
  }
  quote(id, userId, input) {
    return this.change(id, (state) => {
      const { from, to, fee } = this.validateTransfer(state, userId, input);
      const quote = {
        id: randomUUID(),
        userId,
        from: from.id,
        to: to.id,
        toAlias: to.alias,
        amount: input.amount,
        fee,
        quotedAt: now(state),
        expiresAt: now(state) + 90000,
        note:
          typeof input.note === 'string' ? input.note.trim().slice(0, 120) : '',
      };
      state.quotes.push(quote);
      return quote;
    });
  }
  transfer(id, userId, input, failAfterDebit = false) {
    return this.change(id, (state) => {
      requireThat(
        typeof input.key === 'string' &&
          /^[a-zA-Z0-9-]{8,100}$/.test(input.key),
        'Idempotency-Key requerido (8–100 caracteres).',
      );
      const existing = state.transfers.find(
        (t) => t.userId === userId && t.key === input.key,
      );
      if (existing && state.profile !== 'duplicate-submit') {
        requireThat(
          existing.quoteId === input.quoteId,
          'La clave ya fue usada con otro pedido.',
          409,
          'IDEMPOTENCY_CONFLICT',
        );
        return existing;
      }
      const q = state.quotes.find(
        (q) => q.id === input.quoteId && q.userId === userId,
      );
      requireThat(q, 'Cotización no encontrada.', 404);
      requireThat(
        now(state) < q.expiresAt,
        'La confirmación venció. Volvé a cotizar.',
        409,
        'EXPIRED',
      );
      requireThat(input.otp === '246810', 'Código de práctica incorrecto.');
      requireThat(
        state.profile === 'duplicate-submit' ||
          !state.transfers.some((t) => t.quoteId === q.id),
        'Cotización ya confirmada.',
        409,
      );
      const { fee } = this.validateTransfer(state, userId, q);
      const transfer = {
        ...q,
        id: randomUUID(),
        quoteId: q.id,
        key: input.key,
        createdAt: now(state),
        status: 'pending',
        fee,
      };
      state.transfers.push(transfer);
      if (failAfterDebit)
        throw new BankError(
          'Fallo de práctica: operación revertida.',
          503,
          'SIMULATED_FAILURE',
        );
      return transfer;
    });
  }
  settle(id, userId, transferId, failAfterDebit = false) {
    return this.change(id, (state) => {
      const t = state.transfers.find(
        (t) => t.id === transferId && t.userId === userId,
      );
      requireThat(t, 'Transferencia no encontrada.', 404);
      requireThat(
        t.status === 'pending',
        'Solo se puede procesar una transferencia pendiente.',
        409,
      );
      const from = state.accounts.find((a) => a.id === t.from);
      const to = state.accounts.find((a) => a.id === t.to);
      if (
        from.closed ||
        to.closed ||
        from.frozen ||
        to.frozen ||
        from.balance < t.amount + t.fee ||
        to.balance + t.amount > 100000000
      ) {
        t.status = 'rejected';
        t.reason = 'La cuenta no permite completar la operación.';
        return t;
      }
      from.balance -= t.amount + t.fee;
      if (failAfterDebit)
        throw new BankError(
          'Fallo de práctica: operación revertida.',
          503,
          'SIMULATED_FAILURE',
        );
      to.balance += t.amount;
      state.treasury += t.fee;
      t.status = 'completed';
      t.completedAt = now(state);
      movement(
        state,
        from,
        -(t.amount + t.fee),
        'transfer',
        t.id,
        `Transferencia a ${to.alias}`,
      );
      movement(
        state,
        to,
        t.amount,
        'transfer',
        t.id,
        `Transferencia de ${from.alias}`,
      );
      return t;
    });
  }
  cancel(id, userId, transferId) {
    return this.change(id, (state) => {
      const t = state.transfers.find(
        (t) => t.id === transferId && t.userId === userId,
      );
      requireThat(t, 'Transferencia no encontrada.', 404);
      requireThat(
        t.status === 'pending',
        'Solo se puede cancelar una transferencia pendiente.',
        409,
      );
      t.status = 'cancelled';
      return t;
    });
  }
  beneficiary(id, userId, input) {
    return this.change(id, (state) => {
      const alias = cleanText(input.alias, 30).toLowerCase();
      requireThat(
        state.accounts.some((a) => a.alias === alias && !a.closed),
        'Alias no encontrado.',
        404,
      );
      requireThat(
        !state.beneficiaries.some(
          (b) => b.userId === userId && b.alias === alias,
        ),
        'Beneficiario duplicado.',
        409,
      );
      const item = {
        id: randomUUID(),
        userId,
        alias,
        name: cleanText(input.name, 50),
        position: state.beneficiaries.filter((b) => b.userId === userId).length,
      };
      state.beneficiaries.push(item);
      return item;
    });
  }
  reorder(id, userId, ids) {
    return this.change(id, (state) => {
      const items = state.beneficiaries.filter((b) => b.userId === userId);
      requireThat(
        Array.isArray(ids) &&
          ids.length === items.length &&
          new Set(ids).size === items.length &&
          items.every((b) => ids.includes(b.id)),
        'Orden inválido.',
      );
      items.forEach((b) => {
        b.position = ids.indexOf(b.id);
      });
      return items;
    });
  }
  importCsv(id, userId, input) {
    const filename = cleanText(input.filename, 80);
    requireThat(
      filename.toLowerCase().endsWith('.csv') &&
        typeof input.content === 'string' &&
        Buffer.byteLength(input.content) <= 50000,
      'Solo CSV ficticio de hasta 50 KB.',
    );
    const lines = input.content
      .replace(/^\uFEFF/, '')
      .trim()
      .split(/\r?\n/);
    requireThat(
      lines[0] === 'nombre,alias' && lines.length > 1 && lines.length <= 21,
      'CSV: encabezado nombre,alias y entre 1 y 20 filas.',
    );
    return this.change(id, (state) => {
      const result = [];
      for (const line of lines.slice(1)) {
        const parts = line.split(',');
        requireThat(
          parts.length === 2,
          'CSV simple: cada fila debe tener dos columnas.',
        );
        const name = cleanText(parts[0], 50);
        const alias = cleanText(parts[1], 30).toLowerCase();
        requireThat(
          state.accounts.some((a) => a.alias === alias && !a.closed),
          `Alias no encontrado: ${alias}.`,
        );
        requireThat(
          !state.beneficiaries.some(
            (b) => b.userId === userId && b.alias === alias,
          ),
          `Beneficiario duplicado: ${alias}.`,
          409,
        );
        const b = {
          id: randomUUID(),
          userId,
          name,
          alias,
          position: state.beneficiaries.filter((b) => b.userId === userId)
            .length,
        };
        state.beneficiaries.push(b);
        result.push(b);
      }
      state.documents.push({
        id: randomUUID(),
        userId,
        filename,
        rows: result.length,
        createdAt: now(state),
      });
      return { imported: result.length };
    });
  }
  advance(id, minutes) {
    requireThat(
      Number.isInteger(minutes) && minutes > 0 && minutes <= 1440,
      'Usá entre 1 y 1440 minutos.',
    );
    return this.change(id, (state) => {
      state.offset += minutes * 60000;
      return { serverTime: now(state) };
    });
  }
  close() {
    this.db.close();
  }
}
module.exports = {
  Bank,
  BankError,
  DEMO_PASSWORD,
  DAILY_LIMIT,
  PROFILES,
  cents,
};
