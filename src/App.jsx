import './App.css';

const features = [
  {
    title: 'Express Wash',
    text: 'Fast, thorough detailing for busy schedules and everyday shine.',
  },
  {
    title: 'Ceramic Protection',
    text: 'Lock in a glossy finish with hydrophobic protection that lasts.',
  },
  {
    title: 'Paint Correction',
    text: 'Restore clarity and depth so every surface looks like new again.',
  },
];

const packages = [
  {
    name: 'Essential Care',
    price: '$79',
    features: ['Exterior hand wash', 'Wheel and tire detail', 'Interior vacuum', 'Spray wax finish'],
  },
  {
    name: 'Signature Shine',
    price: '$149',
    featured: true,
    features: ['Everything in Essential', 'Clay treatment', 'Ceramic boost sealant', 'Glass and trim restoration'],
  },
  {
    name: 'Ultimate Protection',
    price: '$249',
    features: ['Everything in Signature', 'Multi-stage paint correction', 'Full ceramic coating', '12-month protection plan'],
  },
];

const testimonials = [
  {
    quote: 'The finish on my SUV looked better than the day I bought it. AutoShine is the real deal.',
    name: 'Marcus T.',
  },
  {
    quote: 'Clean, professional, and incredibly detailed. Their ceramic option gave my coupe a serious glow.',
    name: 'Nina R.',
  },
  {
    quote: 'From pickup to delivery, everything felt premium. The results were instant and flawless.',
    name: 'David L.',
  },
];

const process = [
  'Book a tailored service with your preferred package and timeline.',
  'Our detailers inspect paint, trim, and interior surfaces for precision care.',
  'We restore, protect, and finish every inch for a showroom-worthy result.',
];

function App() {
  return (
    <div className="App">
      <header className="hero">
        <nav className="topbar" aria-label="Main navigation">
          <div className="brand">AutoShine</div>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#packages">Packages</a>
            <a href="#reviews">Reviews</a>
            <a href="#book">Book</a>
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
            <div className="mini-stats" aria-label="AutoShine metrics">
              <div>
                <strong>1200+</strong>
                <span>Vehicles cared for</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Client rating</span>
              </div>
            </div>
          </div>

          <div className="hero-panel" aria-label="AutoShine service highlights">
            <img src="Octocat.png" alt="AutoShine logo" className="logo" />
            <div className="feature-badges">
              <span>Same-day slots</span>
              <span>Eco-conscious care</span>
              <span>Certified detailers</span>
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
                <div className="card-icon" aria-hidden="true">✦</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="process" aria-label="How AutoShine works">
          <div className="section-header">
            <p className="section-label">Our process</p>
            <h2>Luxury results without the luxury wait.</h2>
          </div>
          <div className="process-grid">
            {process.map((step, index) => (
              <div key={step} className="process-step">
                <span>{`0${index + 1}`}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="packages" id="packages">
          <div className="section-header">
            <p className="section-label">Packages</p>
            <h2>Choose the finish that fits your drive.</h2>
          </div>
          <div className="package-grid">
            {packages.map((item) => (
              <article key={item.name} className={`package-card ${item.featured ? 'featured' : ''}`}>
                <p className="package-name">{item.name}</p>
                <div className="price-row">
                  <span className="currency">$</span>
                  <span className="price">{item.price.replace('$', '')}</span>
                  <span className="period">/ visit</span>
                </div>
                <ul>
                  {item.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button type="button">Book now</button>
              </article>
            ))}
          </div>
        </section>

        <section className="results" id="reviews">
          <div className="section-header">
            <p className="section-label">Why drivers choose us</p>
            <h2>Protection, polish, and confidence in every mile.</h2>
          </div>
          <div className="result-list">
            <span>Same-day appointments</span>
            <span>Eco-conscious products</span>
            <span>Paint-safe techniques</span>
          </div>
        </section>

        <section className="testimonials" aria-label="Customer reviews">
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="testimonial-card">
                <div className="stars" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <p>“{testimonial.quote}”</p>
                <strong>{testimonial.name}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-panel" id="book">
          <div>
            <p className="section-label">Ready to roll?</p>
            <h2>Give your car the treatment it deserves.</h2>
          </div>
          <button type="button">Reserve your slot</button>
        </section>
      </main>

      <footer className="footer">
        <div className="brand">AutoShine</div>
        <p>Luxury care for the everyday driver.</p>
      </footer>
    </div>
  );
}

export default App;
