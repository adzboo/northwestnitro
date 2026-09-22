import {database,runtime} from '@/db/store';
import {Entry} from './club';
export async function checkout(id:string,userId:string){
 const db=database(),env=runtime();const enabled=await db.prepare("SELECT value FROM settings WHERE key='online_payments'").first<{value:string}>();
 if(enabled?.value!=='true'||!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.SITE_URL?.startsWith('https://'))throw new Error('Payment: Online payments are not available.');
 const row=await db.prepare('SELECT b.*,e.title,e.cutoff,e.status event_status FROM entries b JOIN events e ON e.id=b.event_id WHERE b.id=? AND b.user_id=?').bind(id,userId).first<Entry&{stripe_session:string|null;cutoff:string;event_status:string}>();
 if(!row||row.method!=='online'||row.payment!=='unpaid'||row.status!=='confirmed'||row.event_status!=='published'||row.cutoff<=new Date().toISOString())throw new Error('Payment: This entry is not available for online payment.');
 if(row.stripe_session){const result=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(row.stripe_session),{headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`}});const session=await result.json() as {status:string;url:string};if(!result.ok||session.status!=='open')throw new Error('Payment: This payment session has finished. Refresh your entries or contact the club.');return session.url;}
 const base=env.SITE_URL.replace(/\/$/,'');const body=new URLSearchParams({mode:'payment','payment_method_types[0]':'card',customer_email:row.email,success_url:base+'/account?payment=returned',cancel_url:base+'/account?payment=cancelled','line_items[0][quantity]':'1','line_items[0][price_data][currency]':'gbp','line_items[0][price_data][unit_amount]':String(row.amount),'line_items[0][price_data][product_data][name]':row.title+' — '+row.race_class,'metadata[entry_id]':row.id});
 const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'entry-'+row.id},body});
 const session=await res.json() as {id:string;url:string};if(!res.ok||!session.url)throw new Error('Payment: Your entry is reserved, but checkout is unavailable. Retry from My racing or contact the club.');
 await db.prepare('UPDATE entries SET stripe_session=? WHERE id=?').bind(session.id,row.id).run();return session.url;
}

