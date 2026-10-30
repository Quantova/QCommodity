# QCommodity

QCommodity is a live production post quantum provenance and chain of custody tool for commodities on the Quantova network. It proves the declaration, grading, custody, transfer and delivery of oil, gas, grain and bulk commodities, and it lets any third party confirm that history without trusting the party that created it.

QCommodity proves records without disclosing them. Lot identities and holder details stay private on the systems of the party that holds them. Only a salted cryptographic commitment is written to the chain.

## What it records

Each record is a signed envelope of one of five types.

1. lot, a producer declares a commodity lot with its commodity code, quantity, unit and origin.
2. grade, a grader certifies the grade of a lot.
3. custody, a custodian states that a lot is held in a named facility.
4. transfer, the holder of a lot moves it to another party.
5. deliver, the holder delivers a lot to a destination and it leaves the chain of custody.

Every record is signed with ML-DSA-65 under FIPS 204 by the party whose role it names, and each later record links to the one before it so the whole life of a lot forms a chain.

## Install

```
npm install @quantovainc/qcommodity
```

## Use

```js
const qcommodity = require('@quantovainc/qcommodity');

const producer = qcommodity.generateKey();
const parcel = qcommodity.lot({ key: producer, commodity: 'crude_oil', quantity: 500000, unit: 'barrel', origin: 'North Sea', producerLabel: 'State Oil Company' });
const anchored = await qcommodity.anchor(parcel, { seed, index: 0, network: 'testnet' });
const result = await qcommodity.verify(anchored[0], { type: 'lot', network: 'testnet' });
```

## What a record does not establish

1. It does not show that the stated quantity or grade is true. It shows only that the signer stated it and that the statement existed unchanged at a point in time.
2. It does not identify a natural or legal person. The signer is a chain address, and linking an address to a producer, grader or custodian is a separate attestation.

## License

Apache-2.0 OR MIT
