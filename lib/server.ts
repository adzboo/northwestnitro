import {getMemberUser} from '@/lib/member-auth';
import {database} from '@/db/store';
import {OWNER_EMAIL, INITIAL_ADMIN_EMAIL, Member} from './club';
export async function identity(){const user=await getMemberUser();if(!user)return null;const member=await database().prepare('SELECT * FROM members WHERE id=?').bind(user.userId).first<Member>();const revoked=await database().prepare("SELECT value FROM settings WHERE key='initial_admin_revoked'").first<{value:string}>();const initialAdmin=user.email.toLowerCase()===INITIAL_ADMIN_EMAIL&&revoked?.value!=='true';return {...user,member,owner:user.email.toLowerCase()===OWNER_EMAIL,admin:user.email.toLowerCase()===OWNER_EMAIL||initialAdmin||member?.role==='admin'};}
export async function log(actor:string,action:string,target:string){await database().prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,new Date().toISOString()).run();}
