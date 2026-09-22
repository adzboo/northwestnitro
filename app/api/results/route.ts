import {isAllowedOrigin} from '@/lib/request-origin';
import {database} from '@/db/store';
import {identity} from '@/lib/server';
import {getVenueMeetings,importMeeting,meetingId} from '@/lib/rc-results';
import type {MeetingResults} from '@/lib/result-types';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const error=(message:string,status=400)=>json({error:message},status);
export async function GET(req:Request){try{const url=new URL(req.url),admin=url.searchParams.get('admin')==='1',source=url.searchParams.has('source');if((admin||source)&&!(await identity())?.admin)return error('Administrator access required.',403);
 if(source){const page=Number(url.searchParams.get('page')||1);if(!Number.isInteger(page)||page<1||page>100)return error('Invalid source page.');return json(await getVenueMeetings(page));}
 const id=url.searchParams.get('meeting');if(id){const key=meetingId(id);const row=await database().prepare(`SELECT snapshot,imported_at,published FROM result_meetings WHERE id=? ${admin?'':'AND published=1'}`).bind(key).first<{snapshot:string;imported_at:string;published:number}>();if(!row)return error('These results have not been published.',404);return json({meeting:JSON.parse(row.snapshot),importedAt:row.imported_at,published:!!row.published});}
 const rows=(await database().prepare(`SELECT id,title,date,imported_at AS importedAt,published,table_count AS tableCount,row_count AS rowCount FROM result_meetings ${admin?'':'WHERE published=1'} ORDER BY date DESC,id DESC`).all()).results;
 return json({meetings:rows.map(r=>({...r,published:!!r.published}))});
 }catch(e){console.error('Results read failed',e);return error('Results could not be loaded. Please try again shortly.',503);}}
export async function POST(req:Request){try{
 if(!isAllowedOrigin(req))return error('Please submit from this website.',403);
 const user=await identity();if(!user?.admin)return error('Administrator access required.',403);
 const raw=await req.text();if(raw.length>3000)return error('Request too large.',413);let data;try{data=JSON.parse(raw);}catch{return error('Invalid request.');}
 const db=database(),now=new Date().toISOString();
 if(data.action==='preview'){
 if(typeof data.source!=='string'||data.source.length>500)return error('Enter a meeting URL or ID.');
 const meeting=await importMeeting(data.source);const token=crypto.randomUUID();const expires=new Date(Date.now()+30*60000).toISOString();await db.prepare('INSERT INTO result_previews (user_id,token,snapshot,expires) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,snapshot=excluded.snapshot,expires=excluded.expires').bind(user.userId,token,JSON.stringify(meeting),expires).run();return json({meeting,token,expires});
 }
 if(data.action==='publish'){
 if(typeof data.token!=='string'||data.token.length>100)return error('Invalid preview.');const preview=await db.prepare('SELECT snapshot FROM result_previews WHERE user_id=? AND token=? AND expires>?').bind(user.userId,data.token,now).first<{snapshot:string}>();if(!preview)return error('This preview has expired or been replaced. Load a fresh preview.',409);
 const m:MeetingResults=JSON.parse(preview.snapshot);const tables=m.documents.flatMap(d=>d.tables);await db.batch([
 db.prepare('INSERT INTO result_meetings (id,title,date,snapshot,imported_at,imported_by,published,table_count,row_count) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,date=excluded.date,snapshot=excluded.snapshot,imported_at=excluded.imported_at,imported_by=excluded.imported_by,published=1,table_count=excluded.table_count,row_count=excluded.row_count').bind(m.id,m.title,m.date,preview.snapshot,now,user.userId,tables.length,tables.reduce((n,t)=>n+t.rows.length,0)),
 db.prepare('DELETE FROM result_previews WHERE user_id=? AND token=?').bind(user.userId,data.token),
 db.prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,'publish_results',m.id,now)]);return json({message:'Meeting results published.',id:m.id});
 }
 if(data.action==='visibility'){
 if(typeof data.id!=='string'||typeof data.published!=='boolean')return error('Invalid meeting.');const id=meetingId(data.id);const results=await db.batch([db.prepare('UPDATE result_meetings SET published=? WHERE id=?').bind(data.published?1:0,id),db.prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,data.published?'show_results':'hide_results',id,now)]);if(!results[0].meta.changes)return error('Meeting not found.',404);return json({message:data.published?'Results are visible on the website.':'Results hidden from the website.'});
 }return error('Unknown action.');
 }catch(e){console.error('Results import failed',e);const msg=e instanceof Error?e.message:'';return error(/RC Results|meeting|result|import|page|venue|Paste|Only/i.test(msg)&&!msg.includes('D1')?msg:'Import could not finish. Previously published results have not been changed. Please try again.',502);}}
