// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Q = require('..');
const OPTS = { network: 'testnet', requireAnchor: false, strict: false };
function lot() { const key = Q.generateKey(); return { key, env: Q.lot({ key, commodity: 'crude_oil', quantity: 500000, unit: 'barrel', origin: 'North Sea' }) }; }

test('replay as another type or lot id is refused', async () => {
  const { env } = lot();
  const t = JSON.parse(JSON.stringify(env)); t.type = 'custody';
  assert.strictEqual((await Q.verify(t, Object.assign({ type: 'custody' }, OPTS))).status, 'invalid');
  const i = JSON.parse(JSON.stringify(env)); i.statement.lotId = 'f'.repeat(32);
  assert.strictEqual((await Q.verify(i, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
});

test('every signed field is bound', async () => {
  const { env } = lot();
  for (const m of [(s) => { s.commodity = 'wheat'; }, (s) => { s.quantity += 1; }, (s) => { s.unit = 'tonne'; }, (s) => { s.origin = 'x'; }, (s) => { s.producedAt = '2000-01-01T00:00:00.000Z'; }]) {
    const f = JSON.parse(JSON.stringify(env)); m(f.statement);
    assert.strictEqual((await Q.verify(f, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
  }
});

test('wrong signer, bad base64, extra field, prototype pollution, hidden key, wrong anchor kind', async () => {
  const a = lot(); const b = lot();
  const ws = JSON.parse(JSON.stringify(a.env)); ws.signer = b.env.signer;
  assert.strictEqual((await Q.verify(ws, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
  const bb = JSON.parse(JSON.stringify(a.env)); bb.signature = bb.signature.slice(0, -4) + 'AAAA';
  assert.strictEqual((await Q.verify(bb, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
  const ex = JSON.parse(JSON.stringify(a.env)); ex.statement.extra = 1;
  assert.strictEqual((await Q.verify(ex, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
  const po = JSON.parse(JSON.stringify(a.env)); po.statement = JSON.parse('{"__proto__":{"x":1},"lotId":"' + a.env.statement.lotId + '"}');
  assert.strictEqual((await Q.verify(po, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
  assert.strictEqual({}.x, undefined);
  assert.strictEqual(JSON.stringify({ k: Q.generateKey() }), '{"k":"SecretKey [hidden]"}');
  const an = JSON.parse(JSON.stringify(a.env)); an.anchor = { kind: '1301', chain: { id: 'x', genesis: 'y' }, anchor: { time: 1, height: 1, tx: 't' }, proof: { index: 0 } };
  assert.strictEqual((await Q.verify(an, { type: 'lot', network: 'testnet', requireAnchor: true, strict: false })).status, 'invalid');
});
