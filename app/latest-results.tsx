'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Trophy} from 'lucide-react';
import {resultDate,type SavedMeeting} from '@/lib/result-types';

export default function LatestResults(){
 const [meetings,setMeetings]=useState<SavedMeeting[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{const controller=new AbortController();fetch('/api/results',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<{meetings:SavedMeeting[]}>;}).then(data=>{setMeetings(data.meetings.slice(0,3));setState('ready');}).catch(()=>{if(!controller.signal.aborted)setState('error');});return()=>controller.abort();},[]);
 return <section className="wrap home-results" aria-labelledby="latest-results-title"><div className="section-top"><div><span className="eyebrow muted">FROM THE TIMING LINE</span><h2 id="latest-results-title">Latest race results.</h2></div><a className="text-link" href="/results">All results <ArrowUpRight size={18}/></a></div>
 {state==='loading'?<p role="status">Loading race results…</p>:state==='error'?<p>Results are temporarily unavailable. <a href="/results">Visit the results page</a>.</p>:meetings.length?<div className="results-meetings">{meetings.map((meeting,index)=><a href={'/results?meeting='+meeting.id} className="results-meeting-card" key={meeting.id}><div className="results-card-top"><span className="eyebrow muted">{index===0?'LATEST MEETING':'RACE RESULTS'}</span><Trophy size={24}/></div><p>{resultDate(meeting.date)}</p><h3>{meeting.title}</h3><span className="text-link">View results <ArrowUpRight size={18}/></span></a>)}</div>:<p>Race results will appear here once published.</p>}
 </section>;
}
