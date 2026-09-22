type OriginConfig={SITE_URL?:string;URL?:string;DEPLOY_PRIME_URL?:string;DEPLOY_URL?:string;NODE_ENV?:string};
// Hosting proxies may rewrite request.url. Trust configured deployment addresses,
// never client-supplied Host or X-Forwarded-Host headers.
export function isAllowedOrigin(req:Request,config:OriginConfig=process.env){
 const supplied=req.headers.get('origin');if(!supplied||supplied==='null')return false;
 const allowed=new Set<string>();
 for(const value of [config.SITE_URL,config.URL,config.DEPLOY_PRIME_URL,config.DEPLOY_URL]){if(!value)continue;try{const u=new URL(value);if(u.protocol==='https:'||(config.NODE_ENV!=='production'&&u.protocol==='http:'))allowed.add(u.origin);}catch{/* Invalid settings do not permit requests. */}}
 if(config.NODE_ENV!=='production')allowed.add(new URL(req.url).origin);
 return allowed.has(supplied);
}
