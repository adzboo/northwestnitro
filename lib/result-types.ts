export type SourceMeeting={id:string;title:string;date:string};
export type ResultTable={title:string;headers:string[];rows:string[][]};
export type ResultDocument={id:string;title:string;category:'finals'|'qualifying'|'races'|'grids';sourceUrl:string;notes:string[];tables:ResultTable[]};
export type MeetingResults={id:string;title:string;date:string;sourceUrl:string;fetchedAt:string;documents:ResultDocument[]};
export type SavedMeeting=SourceMeeting&{importedAt:string;published:boolean;tableCount:number;rowCount:number};
export const resultDate=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
export const resultHeading=(s:string)=>s.replace(/<mixed group>/gi,'Mixed class');
