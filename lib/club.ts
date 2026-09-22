export const OWNER_EMAIL='adzharding@yahoo.co.uk';
export const INITIAL_ADMIN_EMAIL='adzsenpai@gmail.com';
export const CLASSES=['Nitro Buggy','Electric Buggy','Nitro Truggy','Electric Truggy'] as const;
export type RaceSeries={id:string;name:string};
export type RaceEvent={series_id:string|null;series_name:string|null;id:string;title:string;description:string;starts:string;ends:string;cutoff:string;capacity:number;member_price:number;guest_price:number;status:string;registered:number};
export type Member={id:string;email:string;name:string;phone:string;brca:string;plan:string;guardian:string;number:string|null;status:string;role:string;payment:string;expires:string|null;created:string};
export type Entry={id:string;event_id:string;user_id:string;email:string;name:string;brca:string;race_class:string;transponder:string;amount:number;method:string;payment:string;status:string;title:string;starts:string};
export const money=(pence:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(pence/100);
export const date=(iso:string)=>new Date(iso).toLocaleDateString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'long',year:'numeric'});
export const time=(iso:string)=>new Date(iso).toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});
export function localInput(iso:string){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));const v=(k:string)=>p.find(x=>x.type===k)?.value;return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}`;}
export function ukToIso(s:string){let n=Date.parse(s+'Z');if(!Number.isFinite(n))throw new Error('Enter a valid date and time.');for(let i=0;i<2;i++){const local=Date.parse(localInput(new Date(n).toISOString())+'Z');n+=Date.parse(s+'Z')-local;}const iso=new Date(n).toISOString();if(localInput(iso)!==s)throw new Error('This time does not exist due to the clocks changing. Choose another time.');return iso;}

// Membership expiry is a UK calendar date, inclusive of its final day.
export function memberPriceApplies(member:Member|null|undefined,raceStarts:string){
 return !!(member?.status==='active'&&member.number&&member.payment==='paid'&&member.expires&&member.expires.slice(0,10)>=localInput(raceStarts).slice(0,10));
}
