import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export async function authClient(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Member sign-in is not configured yet.');const jar=await cookies();return createServerClient(url,key,{cookies:{getAll:()=>jar.getAll(),setAll:items=>{for(const item of items)jar.set(item.name,item.value,item.options);}}});}
export function safeReturn(value:unknown){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return '/account';const u=new URL(value,'https://nwn.invalid');return u.origin==='https://nwn.invalid'&&!u.pathname.startsWith('/auth')&&!u.pathname.startsWith('/login')?u.pathname+u.search+u.hash:'/account';}
