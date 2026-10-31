import assert from 'node:assert/strict';
import {memberPriceApplies,raceEntryPrice} from '../lib/club.ts';
const active={status:'active',payment:'paid',number:'NWN-1',expires:'2027-06-01'};
assert.equal(memberPriceApplies(active,'2027-06-01T12:00:00Z'),true);
for(const m of [null,{...active,status:'pending'},{...active,payment:'unpaid'},{...active,number:null},{...active,expires:'2027-05-31'}])assert.equal(memberPriceApplies(m,'2027-06-01T12:00:00Z'),false);
const event={starts:'2027-06-01T12:00:00Z',member_price:1000,guest_price:1500};
assert.equal(raceEntryPrice(active,event),1000);
for(const m of [null,{...active,status:'pending'},{...active,status:'inactive'},{...active,payment:'unpaid'},{...active,number:null},{...active,expires:'2027-05-31'}])assert.equal(raceEntryPrice(m,event),1500);
console.log('Member discounts and non-member booking prices passed.');
