// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

'use strict';

const C = require('./lib/commodity');
const { verify } = require('./lib/verify');
const F = require('./lib/format');

module.exports = {
  generateKey: C.generateKey,
  publicKey: C.publicKey,
  keyId: C.keyId,
  describeKey: C.describeKey,
  lotRef: C.lotRef,
  lot: C.lot,
  grade: C.grade,
  custody: C.custody,
  transfer: C.transfer,
  deliver: C.deliver,
  anchor: C.anchor,
  complete: C.complete,
  verify,
  anchorDigest: (envelope) => F.anchorDigest(F.parse(envelope)).toString('hex'),
  recordRef: (envelope) => F.refOf(F.parse(envelope)),
  FORMAT: F.FORMAT,
  ALGORITHM: F.ALGORITHM,
  KIND: F.KIND,
  TYPES: F.TYPES,
  PUBLIC_KEY_BYTES: F.PUBLIC_KEY_BYTES,
  SIGNATURE_BYTES: F.SIGNATURE_BYTES,
};
