'use client';
import {useEffect,useState,FormEvent} from 'react';
export default function PasswordReset(){
 const [token,setToken]=useState(''),[stage,setStage]=useState('loading'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{const value=new URLSearchParams(location.search).get('token_hash');if(value){setToken(value);setStage('verify');history.replaceState(null,'','/reset-password');}else setStage('request');},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');setMessage('');const fields=new FormData(e.currentTarget);
 try{
 if(stage==='password'&&fields.get('password')!==fields.get('confirm'))throw new Error('The passwords do not match.');
 const data=stage==='verify'?{action:'verify_recovery',token}:stage==='password'?{action:'update_password',password:fields.get('password')}:{action:'reset_password',email:fields.get('email')};
 const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The sign-in service is unavailable. Please try again later.');
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again.');
 if(stage==='verify'){setToken('');setStage('password');}else if(stage==='password'){setStage('done');}else setMessage(result.message);
 }catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}}
 return <form className="panel stack" style={{maxWidth:560,marginBottom:60}} onSubmit={submit}>
 {error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
 {stage==='loading'&&<p>Loading…</p>}
 {stage==='request'&&<><h2>Forgot your password?</h2><p>Enter your account email and we’ll send you a secure reset link.</p><label className="field">Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><button className="button lime" disabled={busy}>{busy?'Sending…':'Send reset link'}</button></>}
 {stage==='verify'&&<><h2>Choose a new password</h2><p>Continue to securely verify your reset link.</p><button className="button lime" disabled={busy}>{busy?'Checking…':'Continue password reset'}</button><a className="text-link" href="/reset-password">Request a new link</a></>}
 {stage==='password'&&<><h2>Set your new password</h2><label className="field">New password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><p className="fine">Use at least 12 characters.</p><label className="field">Confirm new password<input name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><button className="button lime" disabled={busy}>{busy?'Saving…':'Save new password'}</button></>}
 {stage==='done'&&<p role="status">Your password has been updated. Sign in with your new password.</p>}
 <a className="text-link" href="/login">Back to sign in</a>
 </form>;
}
