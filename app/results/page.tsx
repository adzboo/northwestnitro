import ResultsClient from './results-client';
export const metadata={title:'Race results | North West Nitro',description:'Race results, qualifying standings and finals from North West Nitro.'};
export default function ResultsPage(){return <><div className="wrap page-head"><span className="eyebrow muted">EVERY LAP COUNTS</span><h1>The finish line.</h1><p>Final positions, qualifying standings and race-by-race results from North West Nitro.</p></div><ResultsClient/></>}
