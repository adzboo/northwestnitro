import ClubClient from '../club-client';
export const dynamic='force-dynamic';
export default function AdminPage(){return <><div className="wrap page-head"><span className="eyebrow muted">RACE CONTROL</span><h1>Club administration.</h1><p>Manage your calendar, members and race-day entries.</p></div><ClubClient view="admin"/></>}
