// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Q = require('..');
const key = () => Q.generateKey();
const mkLot = (k) => Q.lot({ key: k, commodity: 'crude_oil', quantity: 500000, unit: 'barrel', origin: 'North Sea', producerLabel: 'State Oil Company' });

test('a declared lot is a well formed signed record of the producer', () => {
  const p = key(); const l = mkLot(p);
  assert.strictEqual(l.format, 'qcommodity/1');
  assert.strictEqual(l.type, 'lot');
  assert.strictEqual(l.signer.id, Q.keyId(p));
  assert.strictEqual(l.statement.producerKeyId, Q.keyId(p));
  assert.match(l.statement.lotId, /^[0-9a-f]{32}$/);
});

test('grade custody transfer deliver chain to the same lot', () => {
  const p = key(); const grader = key(); const cust = key(); const buyer = key();
  const l = mkLot(p);
  const g = Q.grade({ key: grader, lot: l, grade: 'brent' });
  const held = Q.custody({ key: cust, lot: l, facility: 'Rotterdam Terminal' });
  const moved = Q.transfer({ key: cust, lot: held, to: Q.keyId(buyer) });
  const done = Q.deliver({ key: buyer, lot: moved, destination: 'Refinery 12' });
  assert.strictEqual(g.statement.lotId, l.statement.lotId);
  assert.strictEqual(g.statement.lotRef, Q.recordRef(l));
  assert.strictEqual(held.statement.facility, 'Rotterdam Terminal');
  assert.strictEqual(moved.statement.fromKeyId, Q.keyId(cust));
  assert.strictEqual(moved.statement.toKeyId, Q.keyId(buyer));
  assert.strictEqual(done.statement.destination, 'Refinery 12');
});

test('invalid inputs are refused before anything is signed', () => {
  const k = key();
  const base = { key: k, commodity: 'crude_oil', quantity: 1, unit: 'barrel', origin: 'x' };
  assert.throws(() => Q.lot(Object.assign({}, base, { commodity: 'Crude Oil' })), /commodity must be/);
  assert.throws(() => Q.lot(Object.assign({}, base, { unit: 'BARREL' })), /unit must be/);
  assert.throws(() => Q.lot(Object.assign({}, base, { quantity: 0 })), /quantity must be a whole number/);
  assert.throws(() => Q.lot(Object.assign({}, base, { quantity: 1.5 })), /quantity must be a whole number/);
  assert.throws(() => Q.lot(Object.assign({}, base, { origin: '' })), /origin cannot be empty/);
  assert.throws(() => Q.lot(Object.assign({}, base, { zzz: 1 })), /is not an option of lot/);
});

test('a well formed record verifies and a type mismatch or tamper is invalid', async () => {
  const p = key(); const l = mkLot(p);
  const OPTS = { network: 'testnet', requireAnchor: false, strict: false };
  const ok = await Q.verify(l, Object.assign({ type: 'lot' }, OPTS));
  assert.strictEqual(ok.status, 'valid');
  assert.strictEqual(ok.lotId, l.statement.lotId);
  assert.strictEqual((await Q.verify(l, Object.assign({ type: 'custody' }, OPTS))).status, 'invalid');
  const f = JSON.parse(JSON.stringify(l)); f.statement.quantity = 999;
  assert.strictEqual((await Q.verify(f, Object.assign({ type: 'lot' }, OPTS))).status, 'invalid');
});

test('the prior link binds a record and the kind and constants are pinned', async () => {
  const p = key(); const cust = key();
  const l = mkLot(p);
  const held = Q.custody({ key: cust, lot: l, facility: 'Rotterdam Terminal' });
  const good = await Q.verify(held, { type: 'custody', network: 'testnet', requireAnchor: false, strict: false, prior: l });
  assert.ok(good.checks.some((c) => c.name === 'prior' && c.ok));
  assert.strictEqual(Q.KIND, 1303);
  assert.strictEqual(Q.FORMAT, 'qcommodity/1');
  assert.deepStrictEqual([...Q.TYPES], ['lot', 'grade', 'custody', 'transfer', 'deliver']);
});
