const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Bank, DEMO_PASSWORD, cents } = require('../bank.cjs');

function fixture(t, profile = 'stable') {
  const bank = new Bank();
  t.after(() => bank.close());
  return { bank, id: bank.create(profile) };
}
function pending(bank, id, amount = 10000, extra = {}) {
  const q = bank.quote(id, 'ana', {
    from: 'ana-main',
    toAlias: 'bruno.diaria',
    amount,
    ...extra,
  });
  return bank.transfer(id, 'ana', { quoteId: q.id, key: q.id, otp: '246810' });
}
const code = (expected) => (error) => error.code === expected;

test('credenciales ficticias, registro normalizado y sin hashes en la respuesta pública', (t) => {
  const { bank, id } = fixture(t);
  assert.equal(bank.login(id, ' ANA@DEMO.TEST ', DEMO_PASSWORD).id, 'ana');
  assert.throws(
    () => bank.login(id, 'ana@demo.test', 'incorrecta'),
    code('CREDENTIALS'),
  );
  const user = bank.register(id, {
    name: 'Tester',
    email: ' TEST@DEMO.TEST ',
    password: DEMO_PASSWORD,
  });
  assert.equal(user.email, 'test@demo.test');
  assert.equal(user.password, undefined);
  assert.throws(
    () =>
      bank.register(id, {
        name: 'Otro',
        email: 'test@demo.test',
        password: DEMO_PASSWORD,
      }),
    /ya existe/,
  );
  assert.equal(bank.snapshot(id, 'ana').user.password, undefined);
});

test('dinero: centavos enteros, positivos y acotados', () => {
  for (const value of [-1, 0, 1.1, NaN, Infinity, '100', null, 100000001])
    assert.throws(() => cents(value));
  assert.equal(cents(1), 1);
  assert.equal(cents(100000000), 100000000);
});

test('cuentas: ownership, congelación, alias únicos, máximo cuatro y cierre con saldo cero', (t) => {
  const { bank, id } = fixture(t);
  assert.throws(
    () => bank.deposit(id, 'ana', 'bruno-main', 100),
    /no encontrada/,
  );
  bank.freeze(id, 'ana', 'ana-main', true);
  assert.throws(() => bank.deposit(id, 'ana', 'ana-main', 100), /congelada/);
  assert.throws(() => bank.freeze(id, 'ana', 'ana-main', 'false'), /booleano/);
  assert.throws(
    () => bank.closeAccount(id, 'ana', 'ana-save'),
    /saldo debe ser cero/,
  );
  const a = bank.account(id, 'ana', {
    name: 'Nueva',
    alias: 'nueva.ana',
    type: 'savings',
  });
  assert.throws(
    () =>
      bank.account(id, 'ana', {
        name: 'Otra',
        alias: 'NUEVA.ANA',
        type: 'checking',
      }),
    /ya existe/,
  );
  bank.account(id, 'ana', {
    name: 'Cuarta',
    alias: 'cuarta.ana',
    type: 'checking',
  });
  assert.throws(
    () =>
      bank.account(id, 'ana', {
        name: 'Quinta',
        alias: 'quinta.ana',
        type: 'checking',
      }),
    /Máximo 4/,
  );
  bank.closeAccount(id, 'ana', a.id);
  assert.equal(bank.snapshot(id, 'ana').accounts.length, 3);
  assert.ok(
    bank.snapshot(id, 'ana').movements.some((m) => m.type === 'closure'),
  );
});

test('cotización: comisión mínima, redondeo, cuenta propia y casos inválidos', (t) => {
  const { bank, id } = fixture(t);
  const quote = (amount, toAlias = 'bruno.diaria') =>
    bank.quote(id, 'ana', { from: 'ana-main', toAlias, amount });
  assert.equal(quote(1).fee, 100);
  assert.equal(quote(10001).fee, 101);
  assert.equal(quote(50000, 'ana.ahorro').fee, 0);
  assert.throws(() => quote(100, 'ana.diaria'), /misma cuenta/);
  assert.throws(() => quote(100, 'no.existe'), /no existe/);
  bank.freeze(id, 'bruno', 'bruno-main', true);
  assert.throws(() => quote(100), /congelada/);
});

test('pendiente reserva sin acreditar; completada conserva dinero incluyendo comisión', (t) => {
  const { bank, id } = fixture(t);
  const tx = pending(bank, id);
  let a = bank.snapshot(id, 'ana').accounts.find((a) => a.id === 'ana-main');
  assert.deepEqual(
    [a.balance, a.reserved, a.available],
    [250000, 10100, 239900],
  );
  assert.equal(bank.snapshot(id, 'bruno').accounts[0].balance, 120000);
  assert.equal(bank.settle(id, 'ana', tx.id).status, 'completed');
  const s = bank.read(id);
  assert.equal(
    s.accounts.reduce((sum, a) => sum + a.balance, 0) + s.treasury,
    430000,
  );
  assert.equal(s.movements.filter((m) => m.reference === tx.id).length, 2);
  assert.throws(() => bank.settle(id, 'ana', tx.id), /pendiente/);
  assert.throws(() => bank.cancel(id, 'ana', tx.id), /pendiente/);
});

test('fallo después de debitar revierte saldo, estado, historial y comisión', (t) => {
  const { bank, id } = fixture(t);
  const tx = pending(bank, id);
  const before = bank.read(id);
  assert.throws(
    () => bank.settle(id, 'ana', tx.id, true),
    code('SIMULATED_FAILURE'),
  );
  assert.deepEqual(bank.read(id), before);
  assert.equal(bank.settle(id, 'ana', tx.id).status, 'completed');
});

test('idempotencia: mismo pedido devuelve la misma operación; clave con otro pedido falla', (t) => {
  const { bank, id } = fixture(t);
  const tx = pending(bank, id);
  const retry = { key: tx.key, quoteId: tx.quoteId, otp: '246810' };
  assert.equal(bank.transfer(id, 'ana', retry).id, tx.id);
  const q = bank.quote(id, 'ana', {
    from: 'ana-main',
    toAlias: 'bruno.diaria',
    amount: 100,
  });
  assert.throws(
    () => bank.transfer(id, 'ana', { ...retry, quoteId: q.id }),
    code('IDEMPOTENCY_CONFLICT'),
  );
  assert.throws(
    () => bank.transfer(id, 'ana', { ...retry, key: 'another-key' }),
    /ya confirmada/,
  );
  bank.advance(id, 2);
  assert.equal(
    bank.transfer(id, 'ana', retry).id,
    tx.id,
    'reintento posterior al vencimiento sigue siendo idempotente',
  );
  assert.equal(bank.snapshot(id, 'ana').transfers.length, 1);
});

test('OTP, vencimiento y revalidación al confirmar', (t) => {
  const { bank, id } = fixture(t);
  const q = bank.quote(id, 'ana', {
    from: 'ana-main',
    toAlias: 'bruno.diaria',
    amount: 100,
  });
  assert.throws(
    () =>
      bank.transfer(id, 'ana', {
        quoteId: q.id,
        key: 'test-key-1',
        otp: '000000',
      }),
    /incorrecto/,
  );
  bank.freeze(id, 'ana', 'ana-main', true);
  assert.throws(
    () =>
      bank.transfer(id, 'ana', {
        quoteId: q.id,
        key: 'test-key-1',
        otp: '246810',
      }),
    /congelada/,
  );
  bank.freeze(id, 'ana', 'ana-main', false);
  bank.advance(id, 2);
  assert.throws(
    () =>
      bank.transfer(id, 'ana', {
        quoteId: q.id,
        key: 'test-key-1',
        otp: '246810',
      }),
    code('EXPIRED'),
  );
  assert.equal(bank.snapshot(id, 'ana').transfers.length, 0);
});

test('límite diario incluye pendientes, cancelación libera límite, cambio de día lo renueva', (t) => {
  const { bank, id } = fixture(t);
  const tx = pending(bank, id, 100000);
  assert.throws(() => pending(bank, id, 1), code('LIMIT'));
  bank.cancel(id, 'ana', tx.id);
  assert.equal(bank.snapshot(id, 'ana').dailyUsed, 0);
  const next = pending(bank, id, 100000);
  bank.settle(id, 'ana', next.id);
  bank.advance(id, 1440);
  assert.equal(bank.snapshot(id, 'ana').dailyUsed, 0);
});

test('reserva impide sobregiro, rechazo posterior libera reserva y no mueve fondos', (t) => {
  const { bank, id } = fixture(t);
  const tx = pending(bank, id, 40000, { from: 'ana-save' });
  assert.throws(
    () => pending(bank, id, 30000, { from: 'ana-save' }),
    code('FUNDS'),
  );
  bank.freeze(id, 'bruno', 'bruno-main', true);
  assert.equal(bank.settle(id, 'ana', tx.id).status, 'rejected');
  const a = bank.snapshot(id, 'ana').accounts.find((a) => a.id === 'ana-save');
  assert.deepEqual([a.balance, a.reserved], [60000, 0]);
});

test('no se puede cerrar un destino vacío con una transferencia pendiente', (t) => {
  const { bank, id } = fixture(t);
  const a = bank.account(id, 'bruno', {
    name: 'Vacía',
    alias: 'bruno.vacia',
    type: 'checking',
  });
  pending(bank, id, 100, { toAlias: a.alias });
  assert.throws(() => bank.closeAccount(id, 'bruno', a.id), /pendientes/);
});

test('dos laboratorios no comparten cambios; usuarios no operan transferencias ajenas', (t) => {
  const { bank, id } = fixture(t);
  const other = bank.create();
  const tx = pending(bank, id);
  assert.equal(bank.snapshot(other, 'ana').transfers.length, 0);
  assert.throws(() => bank.settle(id, 'bruno', tx.id), /no encontrada/);
  assert.throws(() => bank.cancel(id, 'bruno', tx.id), /no encontrada/);
  assert.equal(
    bank.snapshot(id, 'bruno').transfers.length,
    1,
    'el receptor sí ve su comprobante',
  );
});

test('CSV atómico, duplicados, formato, tamaño y orden completo de beneficiarios', (t) => {
  const { bank, id } = fixture(t);
  const upload = (content) =>
    bank.importCsv(id, 'ana', { filename: 'demo.csv', content });
  assert.throws(
    () => upload('nombre,alias\nBruno,bruno.diaria\nError,no.existe'),
    /no encontrado/,
  );
  assert.equal(bank.snapshot(id, 'ana').beneficiaries.length, 0);
  assert.equal(
    upload('nombre,alias\nBruno,bruno.diaria\nAhorro,ana.ahorro').imported,
    2,
  );
  assert.throws(() => upload('nombre,alias\nBruno,bruno.diaria'), /duplicado/);
  assert.throws(() => upload('name,alias\nBruno,bruno.diaria'), /encabezado/);
  assert.throws(() => upload('x'.repeat(50001)), /50 KB/);
  const ids = bank.snapshot(id, 'ana').beneficiaries.map((b) => b.id);
  assert.throws(() => bank.reorder(id, 'ana', [ids[0], ids[0]]), /inválido/);
  bank.reorder(id, 'ana', ids.toReversed());
  assert.deepEqual(
    bank.snapshot(id, 'ana').beneficiaries.map((b) => b.id),
    ids.toReversed(),
  );
  assert.equal(bank.snapshot(id, 'ana').documents.length, 1);
});

test('los perfiles de reto reproducen defectos concretos sin alterar el perfil estable', (t) => {
  const { bank, id } = fixture(t, 'duplicate-submit');
  const tx = pending(bank, id, 100);
  assert.notEqual(
    bank.transfer(id, 'ana', {
      quoteId: tx.quoteId,
      key: tx.key,
      otp: '246810',
    }).id,
    tx.id,
  );
  const other = bank.create('missing-reservation');
  pending(bank, other, 100);
  const a = bank
    .snapshot(other, 'ana')
    .accounts.find((a) => a.id === 'ana-main');
  assert.equal(a.available, a.balance);
  assert.equal(a.reserved, 200);
});
