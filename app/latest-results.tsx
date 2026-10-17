'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Trophy} from 'lucide-react';
import {resultDate,type SavedMeeting} from '@/lib/result-types';

export default function LatestResults(){
 const [meetings,setMeetings]=useState<SavedMeeting[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{const controller=new AbortController();fetch('/api/results',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<{meetings:SavedMeeting[]}>;}).then(data=>{setMeetings(data.meetings.slice(0,3));setState('ready');}).catch(()=>{if(!controller.signal.aborted)setState('error');});return()=>controller.abort();},[]);
 return <section className="wrap home-result-board" aria-labelledby="latest-results-title"><div className="result-board-heading"><h2 id="latest-results-title">Latest race results.</h2><p>The finishes, the lap times, the race-day stories.</p></div>
 {state==='loading'?<p className="result-board-message" role="status">Loading race results...</p>:state==='error'?<p className="result-board-message">Results are temporarily unavailable. <a href="/results">Visit the results page</a>.</p>:meetings.length?<div className="result-board-list">{meetings.map((meeting,index)=><a href={'/results?meeting='+meeting.id} className="result-board-row" key={meeting.id}><span className="result-board-date">{resultDate(meeting.date)}</span><h3>{meeting.title}{index===0&&<span className="result-board-latest">Latest</span>}</h3><span className="result-board-link">View results <ArrowUpRight size={20}/></span></a>)}</div>:<div className="result-board-message"><Trophy size={26}/><div><h3>The next finish belongs here.</h3><p>Meeting results will appear here once published by the club.</p></div></div>}
 <a className="text-link result-board-all" href="/results">All results <ArrowUpRight size={18}/></a></section>;
}
