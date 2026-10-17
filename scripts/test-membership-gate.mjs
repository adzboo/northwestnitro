import assert from 'node:assert/strict';
import {memberPriceApplies} from '../lib/club.ts';
const active={status:'active',payment:'paid',number:'NWN-1',expires:'2027-06-01'};
assert.equal(memberPriceApplies(active,'2027-06-01T12:00:00Z'),true);
for(const m of [null,{...active,status:'pending'},{...active,payment:'unpaid'},{...active,number:null},{...active,expires:'2027-05-31'}])assert.equal(memberPriceApplies(m,'2027-06-01T12:00:00Z'),false);
console.log('Membership booking eligibility checks passed.');
