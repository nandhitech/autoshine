import './App.css';

const features = [
  { title: 'Express Wash', text: 'Fast, thorough detailing for your busy day.' },
  { title: 'Ceramic Protection', text: 'Lock in a glossy finish and long-lasting shine.' },
  { title: 'Paint Correction', text: 'Restore clarity and confidence to every drive.' },
];

function App() {
  return (
    <div className="App">
      <header className="hero">
        <nav className="topbar" aria-label="Main navigation">
          <div className="brand">AutoShine</div>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#results">Results</a>
            <a href="#booking">Book</a>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Premium detailing studio</p>
            <h1>AutoShine</h1>
            <p className="subtitle">
              Keep every drive looking showroom-ready with expert care, premium products,
              and a finish that lasts.
            </p>
            <div className="cta-group">
              <button type="button">Book a Detail</button>
              <button type="button" className="secondary">
                Explore Packages
              </button>
            </div>
          </div>

          <div className="hero-panel" aria-label="AutoShine service highlights">
            <img src="Octocat.png" alt="AutoShine logo" className="logo" />
            <div className="stats">
              <div>
                <strong>1,200+</strong>
                <span>Vehicles cared for</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Average rating</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="services" id="services">
          <p className="section-label">What we offer</p>
          <h2>Detailing designed around your routine.</h2>
          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="results" id="results">
          <div>
            <p className="section-label">Why drivers choose us</p>
            <h2>Protection, polish, and confidence in every mile.</h2>
          </div>
          <div className="result-list">
            <span>Same-day appointments</span>
            <span>Eco-conscious products</span>
            <span>Paint-safe techniques</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
