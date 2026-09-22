import {database,runtime} from '@/db/store';
import {verifyStripe} from '@/lib/stripe-signature';
export async function POST(req:Request){const secret=runtime().STRIPE_WEBHOOK_SECRET;if(!secret)return new Response('Not configured',{status:503});const raw=await req.text();if(raw.length>1000000)return new Response('Too large',{status:413});if(!await verifyStripe(raw,req.headers.get('stripe-signature')||'',secret))return new Response('Invalid signature',{status:400});try{const event=JSON.parse(raw);const s=event.data?.object;const db=database();if(event.type==='checkout.session.completed'&&s.payment_status==='paid'){
 await db.prepare("UPDATE entries SET payment=CASE WHEN status='confirmed' THEN 'paid' ELSE 'refund_required' END,stripe_session=? WHERE id=? AND method='online' AND amount=? AND ?='gbp' AND (stripe_session IS NULL OR stripe_session=?) AND payment='unpaid'").bind(s.id,s.metadata?.entry_id||'',s.amount_total,s.currency,s.id).run();
 }else if(event.type==='checkout.session.expired'){
 await db.prepare("UPDATE entries SET status='cancelled' WHERE id=? AND stripe_session=? AND payment='unpaid' AND method='online'").bind(s.metadata?.entry_id||'',s.id).run();
 }return Response.json({received:true});}catch(e){console.error('Stripe webhook failed',e);return new Response('Please retry',{status:500});}}

