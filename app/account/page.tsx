import ClubClient from '../club-client';
export const metadata={robots:{index:false,follow:false}};
export default function AccountPage(){return <><div className="wrap page-head"><span className="eyebrow muted">YOUR PLACE ON THE GRID</span><h1>My racing.</h1><p>Your membership number, race entries and payment status in one place.</p></div><ClubClient view="account"/></>}
