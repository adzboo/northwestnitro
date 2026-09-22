import {isAllowedOrigin} from '@/lib/request-origin';
import {authClient,safeReturn} from '@/lib/auth';
import {z} from 'zod';
export async function POST(req:Request){
 if(!isAllowedOrigin(req))return Response.json({error:'Please submit from this website.'},{status:403});
 try{const raw=await req.text();if(raw.length>3000)return Response.json({error:'Request too large.'},{status:413});const d=JSON.parse(raw);const auth=await authClient();
 if(d.action==='signout'){await auth.auth.signOut();return Response.json({returnTo:'/'});}
 const email=z.string().trim().email().max(254).parse(d.email).toLowerCase();
 if(d.action==='send'){const {error}=await auth.auth.signInWithOtp({email,options:{shouldCreateUser:true}});if(error)return Response.json({error:'Unable to send a code. Please wait a minute and try again.'},{status:429});return Response.json({message:'Check your email for your sign-in code.'});}
 if(d.action==='verify'){const token=z.string().regex(/^\d{6,10}$/).parse(d.token);const {error}=await auth.auth.verifyOtp({email,token,type:'email'});if(error)return Response.json({error:'This code is invalid or expired. Request a new code.'},{status:400});return Response.json({returnTo:safeReturn(d.returnTo)});}
 return Response.json({error:'Invalid action.'},{status:400});
 }catch(e){console.error('Authentication failed',e instanceof Error?e.name:'unknown');return Response.json({error:'Sign-in is unavailable or the details are invalid. Please try again later.'},{status:503});}
}
