import {isAllowedOrigin} from '@/lib/request-origin';
import {authClient,safeReturn} from '@/lib/auth';
import {z} from 'zod';
import {getMemberUser} from '@/lib/member-auth';
export async function GET(){
 try{return Response.json({signedIn:!!await getMemberUser()},{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'Session check unavailable.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
}
export async function POST(req:Request){
 if(!isAllowedOrigin(req))return Response.json({error:'Please submit from this website.'},{status:403});
 try{const raw=await req.text();if(raw.length>3000)return Response.json({error:'Request too large.'},{status:413});const d=JSON.parse(raw);const auth=await authClient();
 if(d.action==='signout'){await auth.auth.signOut();return Response.json({returnTo:'/'});}
 if(d.action==='verify_recovery'){
 const token_hash=z.string().min(1).max(512).parse(d.token);
 const {error}=await auth.auth.verifyOtp({token_hash,type:'recovery'});
 if(error)return Response.json({error:'This reset link has expired or already been used. Please request a new one.'},{status:400});
 return Response.json({verified:true});
 }
 if(d.action==='update_password'){
 const password=z.string().min(12).max(128).parse(d.password);
 const {data:{user},error:sessionError}=await auth.auth.getUser();
 if(sessionError||!user)return Response.json({error:'Your reset session has expired. Please request a new link.'},{status:401});
 const {error}=await auth.auth.updateUser({password});
 if(error)return Response.json({error:'Unable to update the password. Choose a different password of at least 12 characters and try again.'},{status:400});
 await auth.auth.signOut();
 return Response.json({updated:true});
 }
 const email=z.string().trim().email().max(254).parse(d.email).toLowerCase();
 if(d.action==='reset_password'){
 const site=process.env.SITE_URL;if(!site)return Response.json({error:'Password recovery is not configured. Please contact the club.'},{status:503});
 const {error}=await auth.auth.resetPasswordForEmail(email,{redirectTo:new URL('/reset-password',site).href});
 if(error)return Response.json({error:'Unable to send a reset email right now. Please wait a few minutes and try again, or contact the club.'},{status:503});
 return Response.json({message:'If an account exists for this email, a password reset link will be sent. Check your inbox and spam folder.'});
 }
 if(d.action==='signup'||d.action==='signin'){
 const password=z.string().min(d.action==='signup'?12:1).max(128).parse(d.password);
 if(d.action==='signup'){
 const settings=await fetch(process.env.SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY!},cache:'no-store'});
 const config=await settings.json();if(!settings.ok||config.mailer_autoconfirm!==true)return Response.json({error:'Registration is not ready yet. The club must disable email confirmation in Supabase before accounts can be created without emails.'},{status:503});
 const {data,error}=await auth.auth.signUp({email,password});if(error||!data.session)return Response.json({error:'Unable to create this account. If you already have an account, sign in instead.'},{status:400});
 return Response.json({returnTo:'/membership'});
 }
 const {error}=await auth.auth.signInWithPassword({email,password});if(error)return Response.json({error:'Email or password is incorrect, or the account is unavailable.'},{status:400});return Response.json({returnTo:safeReturn(d.returnTo)});
 }
 return Response.json({error:'Invalid action.'},{status:400});
 }catch(e){console.error('Authentication failed',e instanceof Error?e.name:'unknown');return Response.json({error:'Sign-in is unavailable or the details are invalid. Please try again later.'},{status:503});}
}
