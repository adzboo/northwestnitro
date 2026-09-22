// Identity comes only from a verified Supabase session, never request headers.
import {authClient} from '@/lib/auth';
import {database} from '@/db/store';
export async function getMemberUser(){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)return null;
 const client=await authClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email||!user.email_confirmed_at)return null;
 const email=user.email.toLowerCase();
 // A verified email reconnects an imported member to their existing club record.
 const member=await database().prepare('SELECT id,name FROM members WHERE lower(email)=?').bind(email).first<{id:string;name:string}>();
 const legacy=member?null:await database().prepare('SELECT user_id FROM entries WHERE lower(email)=? ORDER BY created LIMIT 1').bind(email).first<{user_id:string}>();
 return {userId:member?.id??legacy?.user_id??user.id,email,displayName:member?.name??email,fullName:member?.name??null};
}
