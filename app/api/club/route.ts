import {z} from 'zod';
import {database,runtime} from '@/db/store';
import {identity,log} from '@/lib/server';
import {CLASSES,OWNER_EMAIL,INITIAL_ADMIN_EMAIL,Member,Entry,RaceEvent,memberPriceApplies} from '@/lib/club';
import {checkout} from '@/lib/payments';
export const dynamic='force-dynamic';
const ok=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message:string,status=400)=>ok({error:message},status);
const text=z.string().trim().min(1).max(150);
const eventSchema=z.object({series_id:z.string().trim().min(1).max(150).nullable().default(null),id:z.string().optional(),title:text,description:z.string().trim().max(4000),starts:z.string().datetime(),ends:z.string().datetime(),cutoff:z.string().datetime(),capacity:z.number().int().min(1).max(1000),member_price:z.number().int().min(100).max(100000),guest_price:z.number().int().min(100).max(100000),status:z.enum(['draft','published','cancelled'])}).refine(v=>v.ends>v.starts&&v.cutoff<=v.starts,'End must follow start; entries must close before the race.');
export async function GET(req:Request){try{
 const db=database(),user=await identity();const admin=new URL(req.url).searchParams.get('view')==='admin';
 if(admin&&!user?.admin)return fail('Administrator access required.',403);
 const events=(await db.prepare(`SELECT e.*, s.name AS series_name, (SELECT COUNT(*) FROM entries b WHERE b.event_id=e.id AND b.status='confirmed') AS registered FROM events e LEFT JOIN series s ON s.id=e.series_id ${admin?'':"WHERE e.status!='draft'"} ORDER BY e.starts`).all()).results;
 const enabled=await db.prepare("SELECT value FROM settings WHERE key='online_payments'").first<{value:string}>();const env=runtime();
 const configured=!!(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.SITE_URL?.startsWith('https://'));
 const entries=user?(await db.prepare(`SELECT b.*,e.title,e.starts FROM entries b JOIN events e ON e.id=b.event_id ${admin?'':'WHERE b.user_id=?'} ORDER BY e.starts DESC`).bind(...(admin?[]:[user.userId])).all()).results:[];
 const members=admin?(await db.prepare('SELECT * FROM members ORDER BY created DESC').all()).results:[];
 const initialAdminRevoked=admin?(await db.prepare("SELECT value FROM settings WHERE key='initial_admin_revoked'").first<{value:string}>())?.value==='true':undefined;
 const series=(await db.prepare('SELECT id,name FROM series ORDER BY lower(name)').all()).results;
 return ok({series,events,entries,members,initialAdminRevoked,online:enabled?.value==='true'&&configured,paymentConfigured:admin?configured:undefined,user:user?{name:user.displayName,email:user.email,admin:user.admin,owner:user.owner,member:user.member}:null});
 }catch(e){console.error('Club read failed',e);return fail('The club service is temporarily unavailable. Please try again.',503);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return fail('Please submit from this website.',403);
 const raw=await req.text();if(raw.length>16000)return fail('Request too large.',413);
 let data;try{data=JSON.parse(raw);}catch{return fail('Invalid request.');}
 const user=await identity();if(!user)return fail('Please sign in to continue.',401);
 const db=database(),now=new Date().toISOString();
 if(data.action==='membership'){
 const v=z.object({name:text,phone:z.string().trim().min(7).max(30),brca:z.string().trim().max(60),plan:z.enum(['adult','junior']),guardian:z.string().trim().max(150),consent:z.literal(true)}).parse(data);
 if(v.plan==='junior'&&!v.guardian)return fail('A parent or guardian name is required for junior membership.');
 if(user.member)return fail('You already have a membership application. View it in My racing.',409);
 await db.prepare('INSERT INTO members (id,email,name,phone,brca,plan,guardian,status,role,payment,created) VALUES (?,?,?,?,?,?,?,\'pending\',\'member\',\'unpaid\',?)').bind(user.userId,user.email.toLowerCase(),v.name,v.phone,v.brca,v.plan,v.guardian,now).run();
 return ok({message:'Application received. Pay your membership fee in cash at the club; an administrator will approve it and assign your number.'});
 }
 if(data.action==='book'){
 const v=z.object({event_id:text,name:text,brca:text,race_class:z.enum(CLASSES),transponder:z.string().trim().max(60),method:z.enum(['cash','online']),consent:z.literal(true)}).parse(data);
 const event=await db.prepare('SELECT * FROM events WHERE id=?').bind(v.event_id).first<RaceEvent>();
 if(!event||event.status!=='published'||event.cutoff<=now||event.starts<=now)return fail('Entries for this race are closed.');
 if(v.method==='online'&&!await onlineReady())return fail('Online payments are not available yet. Please choose cash.');
 const m=user.member;const active=memberPriceApplies(m,event.starts);
 const amount=active?event.member_price:event.guest_price;const id=crypto.randomUUID();
 const result=await db.prepare(`INSERT INTO entries (id,event_id,user_id,email,name,brca,race_class,transponder,amount,method,payment,status,created) SELECT ?,?,?,?,?,?,?,?,?,?,'unpaid','confirmed',? WHERE (SELECT COUNT(*) FROM entries WHERE event_id=? AND status='confirmed') < (SELECT capacity FROM events WHERE id=? AND status='published' AND cutoff>?) ON CONFLICT(event_id,user_id) DO NOTHING`).bind(id,event.id,user.userId,user.email,v.name,v.brca,v.race_class,v.transponder,amount,v.method,now,event.id,event.id,now).run();
 if(!result.meta.changes)return fail('This race is full or you already have an entry. Check My racing.',409);
 if(v.method==='online')return ok({message:'Entry reserved. Continue to secure payment.',entryId:id,checkoutUrl:await checkout(id,user.userId)});
 return ok({message:'You’re on the entry list. Pay cash at race control on the day.'});
 }
 if(data.action==='checkout')return ok({checkoutUrl:await checkout(text.parse(data.id),user.userId)});
 if(data.action==='cancel_entry'){
 const id=text.parse(data.id);const row=await db.prepare('SELECT b.*,e.cutoff FROM entries b JOIN events e ON e.id=b.event_id WHERE b.id=?').bind(id).first<Entry&{cutoff:string}>();
 if(!row||row.user_id!==user.userId&&!user.admin)return fail('Entry not found.',404);
 if(!user.admin&&row.cutoff<=now)return fail('Entries have closed. Contact the club to cancel.');
 await db.prepare("UPDATE entries SET status='cancelled',payment=CASE WHEN payment='paid' THEN 'refund_required' ELSE payment END WHERE id=?").bind(id).run();
 await log(user.userId,'cancel_entry',id);return ok({message:'Entry cancelled. Any paid fee needs a refund arranged by the club.'});
 }
 if(!user.admin)return fail('Administrator access required.',403);
 if(data.action==='initial_admin_access'){
 if(!user.owner)return fail('Only the main administrator can change admin access.',403);
 const enabled=z.boolean().parse(data.enabled);
 await db.batch([db.prepare("INSERT INTO settings (key,value) VALUES ('initial_admin_revoked',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(!enabled)),db.prepare('UPDATE members SET role=? WHERE email=?').bind(enabled?'admin':'member',INITIAL_ADMIN_EMAIL),db.prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,'initial_admin_access:'+enabled,INITIAL_ADMIN_EMAIL,now)]);
 return ok({message:'Administrator access updated.'});
 }
 if(data.action==='save_series'){
 const name=text.parse(data.name),id=crypto.randomUUID();
 const existing=await db.prepare('SELECT id FROM series WHERE lower(name)=lower(?)').bind(name).first();if(existing)return fail('A series with this name already exists.',409);
 await db.prepare('INSERT INTO series (id,name,created) VALUES (?,?,?)').bind(id,name,now).run();await log(user.userId,'save_series',id);return ok({message:'Race series added.',id});
 }
 if(data.action==='save_event'){
 const v=eventSchema.parse(data);const id=v.id||crypto.randomUUID();
 if(v.series_id&&!await db.prepare('SELECT id FROM series WHERE id=?').bind(v.series_id).first())return fail('Choose an existing race series.');
 if(!v.id&&v.starts<=now)return fail('New races must start in the future.');
 if(v.id){const old=await db.prepare('SELECT * FROM events WHERE id=?').bind(id).first<RaceEvent>();if(!old)return fail('Event not found.',404);const count=await db.prepare("SELECT COUNT(*) n FROM entries WHERE event_id=? AND status='confirmed'").bind(id).first<{n:number}>();if(v.capacity<(count?.n||0))return fail('Capacity cannot be lower than confirmed entries.');
 await db.batch([db.prepare('UPDATE events SET series_id=?,title=?,description=?,starts=?,ends=?,cutoff=?,capacity=?,member_price=?,guest_price=?,status=? WHERE id=?').bind(v.series_id,v.title,v.description,v.starts,v.ends,v.cutoff,v.capacity,v.member_price,v.guest_price,v.status,id),...(v.status==='cancelled'?[db.prepare("UPDATE entries SET status='cancelled',payment=CASE WHEN payment='paid' THEN 'refund_required' ELSE payment END WHERE event_id=?").bind(id)]:[])]);
 }else await db.prepare('INSERT INTO events (id,series_id,title,description,starts,ends,cutoff,capacity,member_price,guest_price,status,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,v.series_id,v.title,v.description,v.starts,v.ends,v.cutoff,v.capacity,v.member_price,v.guest_price,v.status,now).run();
 await log(user.userId,'save_event',id);return ok({message:'Race event saved.',id});
 }
 if(data.action==='update_member'){
 const v=z.object({id:text,number:z.string().trim().max(30).regex(/^[A-Za-z0-9-]*$/).transform(s=>s.toUpperCase()||null),status:z.enum(['pending','active','inactive']),payment:z.enum(['unpaid','paid']),expires:z.string().nullable()}).parse(data);
 const member=await db.prepare('SELECT * FROM members WHERE id=?').bind(v.id).first<Member>();if(!member)return fail('Member not found.',404);
 let expires=v.expires;if(expires&&!/^\d{4}-\d{2}-\d{2}$/.test(expires))return fail('Enter a valid expiry date.');
 if(v.status==='active'&&(!v.number||v.payment!=='paid'))return fail('Assign a membership number and confirm payment before approval.');
 if(v.status==='active'&&!expires){const d=new Date();d.setFullYear(d.getFullYear()+1);expires=d.toISOString().slice(0,10);}
 if(v.status==='active'&&(!expires||expires<now.slice(0,10)))return fail('Active membership needs a future expiry date.');
 await db.prepare('UPDATE members SET number=?,status=?,payment=?,expires=? WHERE id=?').bind(v.number,v.status,v.payment,expires?expires+'T23:59:59.999Z':null,v.id).run();await log(user.userId,'update_member',v.id);return ok({message:'Membership updated.'});
 }
 if(data.action==='set_role'){
 if(!user.owner)return fail('Only the main administrator can change admin access.',403);
 const v=z.object({id:text,role:z.enum(['member','admin'])}).parse(data);const m=await db.prepare('SELECT * FROM members WHERE id=?').bind(v.id).first<Member>();
 if(!m)return fail('Member not found.',404);if(m.email.toLowerCase()===OWNER_EMAIL)return fail('Main administrator access is protected.');
 if(v.role==='admin'&&m.status!=='active')return fail('Approve this member before granting administrator access.');
 await db.batch([db.prepare('UPDATE members SET role=? WHERE id=?').bind(v.role,v.id),...(m.email===INITIAL_ADMIN_EMAIL?[db.prepare("INSERT INTO settings (key,value) VALUES ('initial_admin_revoked',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(v.role!=='admin'))]:[]),db.prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,'set_role:'+v.role,v.id,now)]);return ok({message:'Administrator access updated.'});
 }
 if(data.action==='cash_paid'){
 const id=text.parse(data.id);const r=await db.prepare("UPDATE entries SET payment='paid' WHERE id=? AND method='cash' AND status='confirmed' AND payment='unpaid'").bind(id).run();if(!r.meta.changes)return fail('Only unpaid, confirmed cash entries can be marked paid.');await log(user.userId,'cash_paid',id);return ok({message:'Cash payment recorded.'});
 }
 if(data.action==='refund_recorded'){
 const id=text.parse(data.id);const r=await db.prepare("UPDATE entries SET payment='refunded' WHERE id=? AND payment='refund_required'").bind(id).run();if(!r.meta.changes)return fail('No refund is awaiting recording for this entry.');await log(user.userId,'refund_recorded',id);return ok({message:'Refund recorded. This action does not send money.'});
 }
 if(data.action==='online_settings'){
 if(!user.owner)return fail('Only the main administrator can change payment settings.',403);
 const enabled=z.boolean().parse(data.enabled);const env=runtime();if(enabled&&!(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.SITE_URL?.startsWith('https://')))return fail('Connect the Stripe account and webhook before enabling online payments.');
 await db.prepare("INSERT INTO settings (key,value) VALUES ('online_payments',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(enabled)).run();await log(user.userId,'online_payments:'+enabled,'settings');return ok({message:'Payment settings updated.'});
 }
 return fail('Unknown action.');
 }catch(e){if(e instanceof z.ZodError)return fail(e.issues[0]?.message||'Check the form fields.');const msg=e instanceof Error?e.message:'';if((e as {code?:string}).code==='23505'||msg.includes('UNIQUE constraint'))return fail('That membership number or account is already in use.',409);if(msg.startsWith('Payment:'))return fail(msg);console.error('Club write failed',e);return fail('Unable to save. Your information is still in the form. Please try again.',503);}}
async function onlineReady(){const e=runtime();return !!(e.STRIPE_SECRET_KEY&&e.STRIPE_WEBHOOK_SECRET&&e.SITE_URL?.startsWith('https://')&&(await database().prepare("SELECT value FROM settings WHERE key='online_payments'").first<{value:string}>())?.value==='true');}

