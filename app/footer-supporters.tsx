import './footer-supporters.css';

const supporters = [
  { name: 'Trackside Performance', image: 'trackside-performance', url: 'https://tracksideperformance.co.uk/' },
  { name: 'TKR Graphics', image: 'tkr-graphics', url: 'https://tkrgraphics.com/' },
  { name: 'ERP Distribution', image: 'erp-distribution', url: 'https://www.erpdistribution.co.uk/' },
  { name: 'Answer-RC', image: 'answer-rc', url: 'https://answer-rc.com/' },
];

export default function FooterSupporters() {
  return <section className="footer-supporters" aria-labelledby="supporters-heading">
    <div className="supporters-heading"><h2 id="supporters-heading">Club supporters</h2><p>Supporting our racing community.</p></div>
    <div className="supporters-grid">
      {supporters.map(supporter => <a key={supporter.image} className="supporter-logo" href={supporter.url} target="_blank" rel="noopener noreferrer" aria-label={`${supporter.name} (opens in a new tab)`}>
        <img src={`/supporters/${supporter.image}.png`} alt={supporter.name} loading="lazy" />
      </a>)}
    </div>
  </section>;
}
