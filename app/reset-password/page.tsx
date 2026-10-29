import PasswordReset from './password-reset';
export const metadata={title:'Reset password | North West Nitro',referrer:'no-referrer' as const,robots:{index:false,follow:false}};
export default function Page(){return <div className="wrap content"><div className="page-head"><span className="eyebrow muted">YOUR CLUB. YOUR RACING.</span><h1>Reset your password.</h1><p>Get back into your North West Nitro account.</p></div><PasswordReset/></div>}
