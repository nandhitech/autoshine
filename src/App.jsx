import { useEffect, useState } from 'react';
import { initialStations } from './data/stations';
import {
  createBooking,
  createStation,
  ensureStarterStations,
  observeSession,
  subscribeToBookingUpdates,
  subscribeToBookings,
  subscribeToInvoices,
  subscribeToStations,
} from './firebaseData';
import { firebaseError, isFirebaseConfigured } from './firebase';
import './App.css';

const filters = ['All', 'Ceramic Coating', 'Detail Station', 'Eco Steam', 'Express Wash'];

const demoOrder = {
  id: 'demo-bmw-order',
  vehicle: 'BMW M4 Competition (M4-POWER)',
  stationName: 'Apex Detail Studio & Ceramic Hub',
  packageName: 'Express Wash & Vacuum',
  status: 'In Progress',
  currentStage: 0,
  customer: 'Jordan Vance',
  vehicleModel: 'BMW M4 Competition (Isle of Man Green)',
  plate: 'M4-POWER',
  servicePriceCents: 3500,
  taxCents: 280,
  totalCents: 3780,
  paid: false,
};

const serviceStages = [
  { title: 'Vehicle Received', description: 'Key handed over, vehicle checked into bay' },
  { title: 'Pre-Wash & Foam', description: 'High-pressure rinse & dirt emulsification foam' },
  { title: 'High-Pressure Rinse', description: 'Deep wheel scrub, underbody spray & rinse' },
  { title: 'Interior & Polish', description: 'Vacuum, leather steam clean & hand polish' },
  { title: 'Quality Inspection', description: 'Supervisor audit & streak-free glass verify' },
  { title: 'Ready for Pickup', description: 'Parked in delivery bay, invoice finalized' },
];

const demoUpdates = [
  {
    time: '23:27',
    title: 'Stage 1 Log Update',
    message: 'Booking confirmed & slot reserved in Bay 04. Vehicle intake inspection complete.',
  },
  {
    time: '23:31',
    title: 'Technician update · Bay 04',
    message: 'Vehicle checked in. Pre-wash team is preparing the foam treatment.',
  },
];

const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const TAX_RATE = 0.08;

function getLocalDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatCurrency(amountInCents) {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 11 1.7-4.1A2 2 0 0 1 8.55 5.7h6.9a2 2 0 0 1 1.85 1.2L19 11l1.2.6a2 2 0 0 1 1.1 1.8v3.1a1 1 0 0 1-1 1h-1.1a2.2 2.2 0 0 1-4.3 0H9.1a2.2 2.2 0 0 1-4.3 0H3.5a1 1 0 0 1-1-1v-3.1a2 2 0 0 1 1.1-1.8L5 11Zm1.2-.3h11.6l-1.4-3.3a1 1 0 0 0-.92-.6h-6.2a1 1 0 0 0-.92.6l-1.4 3.3ZM7 16.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4.5 13a.5.5 0 0 0-.5.5v.5h2.5a2.2 2.2 0 0 1 4.1 0h2.8a2.2 2.2 0 0 1 4.1 0H20v-.5a.5.5 0 0 0-.5-.5h-15Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h7m4 0h5M4 12h2m4 0h10M4 18h8m4 0h4" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </svg>
  );
}

function TabIcon({ name }) {
  if (name === 'tracker') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.4 6.4L3 16m0 4v-4h4" />
      </svg>
    );
  }

  if (name === 'invoices') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M9 13h6m-6 4h6" />
      </svg>
    );
  }

  return <SearchIcon />;
}

function App() {
  const [stations, setStations] = useState(isFirebaseConfigured ? [] : initialStations);
  const [activeTab, setActiveTab] = useState('stations');
  const [role, setRole] = useState('owner');
  const [selectedFilter, setSelectedFilter] = useState('Ceramic Coating');
  const [query, setQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseStatus, setFirebaseStatus] = useState(isFirebaseConfigured ? 'connecting' : 'demo');
  const [firebaseMessage, setFirebaseMessage] = useState(firebaseError);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(isFirebaseConfigured ? '' : demoOrder.id);
  const [modal, setModal] = useState(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer: 'Jordan Vance',
    vehicleModel: 'BMW M4 Competition',
    plate: 'M4-POWER',
    date: getLocalDate(),
    time: timeSlots[0],
  });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!modal) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setModal(null);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    let active = true;
    let currentUid = null;
    const unsubscribeData = [];
    const handleError = (error) => {
      if (active) setFirebaseMessage(error.message || 'Firebase request failed.');
    };

    const unsubscribeAuth = observeSession((user) => {
      if (!active || !user || user.uid === currentUid) return;
      currentUid = user.uid;
      setFirebaseUser(user);
      setFirebaseStatus('connected');
      setFirebaseMessage('');
      ensureStarterStations().catch(handleError);
      unsubscribeData.push(
        subscribeToStations((records) => setStations(records.sort((a, b) => a.name.localeCompare(b.name))), handleError),
        subscribeToBookings(user.uid, setBookings, handleError),
        subscribeToInvoices(user.uid, setInvoices, handleError),
      );
    }, handleError);

    return () => {
      active = false;
      unsubscribeAuth();
      unsubscribeData.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const visibleStations = stations.filter((station) => {
    const matchesQuery = `${station.name} ${station.location} ${station.services.join(' ')}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesFilter = selectedFilter === 'All' || station.services.includes(selectedFilter);
    return matchesQuery && matchesFilter;
  });
  const invoiceByBooking = new Map(invoices.map((invoice) => [invoice.bookingId, invoice]));
  const trackedOrders = [
    ...(!isFirebaseConfigured ? [demoOrder] : []),
    ...bookings.map((booking) => {
      const invoice = invoiceByBooking.get(booking.id);
      return {
        ...booking,
        vehicle: `${booking.vehicleModel} (${booking.plate})`,
        packageName: booking.serviceName || 'Express Wash & Vacuum',
        status: booking.status === 'in-progress' ? 'In Progress' : 'Pending',
        servicePriceCents: booking.servicePriceCents ?? invoice?.servicePriceCents ?? 0,
        taxCents: booking.taxCents ?? invoice?.taxCents ?? 0,
        totalCents: booking.totalCents ?? invoice?.totalCents ?? 0,
        paid: invoice?.paymentStatus === 'paid',
      };
    }),
  ];
  const activeOrder = trackedOrders.find((order) => order.id === selectedOrderId) ?? trackedOrders[0];
  const bookingPriceCents = modal?.type === 'booking' ? (modal.station.priceCents ?? 3500) : 0;
  const bookingTaxCents = Math.round(bookingPriceCents * TAX_RATE);

  useEffect(() => {
    if (!firebaseUser || !activeOrder || activeOrder.id === demoOrder.id) {
      setLiveUpdates([]);
      return undefined;
    }

    return subscribeToBookingUpdates(activeOrder.id, setLiveUpdates, (error) => {
      setFirebaseMessage(error.message || 'Could not load service updates.');
    });
  }, [activeOrder?.id, firebaseUser]);

  function bookStation(station) {
    const existingBooking = bookings.find((booking) => booking.stationId === station.id);
    if (existingBooking) {
      setNotice(`You already have an order with ${station.name}.`);
      return;
    }

    setBookingForm({
      customer: 'Jordan Vance',
      vehicleModel: 'BMW M4 Competition',
      plate: 'M4-POWER',
      date: getLocalDate(),
      time: timeSlots[0],
    });
    setModal({ type: 'booking', station });
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!firebaseUser || !modal?.station) {
      setNotice(firebaseMessage || 'Firebase must be configured before a booking can be saved.');
      return;
    }

    setSavingBooking(true);
    try {
      const booking = await createBooking({
        station: modal.station,
        customer: bookingForm.customer.trim(),
        vehicleModel: bookingForm.vehicleModel.trim(),
        plate: bookingForm.plate.trim().toUpperCase(),
        date: bookingForm.date,
        time: bookingForm.time,
      }, firebaseUser.uid);
      setBookings((current) => [...current.filter((item) => item.id !== booking.id), booking]);
      setSelectedOrderId(booking.id);
      setActiveTab('tracker');
      setNotice(`Booking and invoice saved for ${booking.date} at ${booking.time}.`);
      setModal(null);
    } catch (error) {
      setNotice(`Could not save booking: ${error.message}`);
    } finally {
      setSavingBooking(false);
    }
  }

  function payInvoice(order) {
    if (order.paid) return;

    setNotice('Online payment is not configured. No payment was made; this invoice remains unpaid.');
  }

  async function addStation() {
    const station = {
      name: 'New Detail Station',
      location: 'Your area',
      distance: 'Nearby',
      rating: 0,
      reviews: 0,
      priceCents: 0,
      availability: 'Setup required',
      services: ['Detail Station'],
    };
    try {
      const savedStation = await createStation(station, firebaseUser?.isStationAdmin === true);
      setStations((current) => [...current.filter((item) => item.id !== savedStation.id), savedStation]);
      setNotice('New station added to Firestore.');
    } catch (error) {
      setNotice(`Could not add station: ${error.message}`);
    }
  }

  return (
    <div className="App">
      <header className="portal-header">
        <div className="brand-lockup">
          <div className="brand-mark"><CarIcon /></div>
          <div className="brand-copy">
            <div className="brand-name">CarWash <span>CONNECT</span></div>
            <div className="portal-status">CAR OWNER PORTAL <span className="status-divider">•</span> <span className="live-status"><i /> {firebaseStatus === 'connected' ? 'FIRESTORE' : 'DEMO DATA'}</span></div>
          </div>
        </div>

        <div className="role-switch" aria-label="Choose portal">
          <button
            type="button"
            className={role === 'owner' ? 'selected' : ''}
            aria-pressed={role === 'owner'}
            onClick={() => {
              setRole('owner');
              setNotice('');
            }}
          >
            <span className="role-icon"><UserIcon /></span> Car Owner
          </button>
          <button
            type="button"
            className={role === 'admin' ? 'selected' : ''}
            aria-pressed={role === 'admin'}
            onClick={() => {
              setRole('admin');
              setNotice('');
            }}
          >
            <span className="role-icon"><SlidersIcon /></span> Station Admin
          </button>
        </div>
      </header>

      <main className="portal-main">
        {firebaseMessage && (
          <div className="connection-banner" role="alert">
            {firebaseMessage}
            {!isFirebaseConfigured && <span> Station browsing is a preview; bookings and invoices are not saved until Firebase is configured.</span>}
          </div>
        )}
        {role === 'owner' && (
          <nav className="portal-tabs" aria-label="Owner portal sections">
            <button
              type="button"
              className={activeTab === 'stations' ? 'active' : ''}
              aria-current={activeTab === 'stations' ? 'page' : undefined}
              onClick={() => setActiveTab('stations')}
            >
              <TabIcon name="stations" /> Find Detail Stations
            </button>
            <button
              type="button"
              className={activeTab === 'tracker' ? 'active' : ''}
              aria-current={activeTab === 'tracker' ? 'page' : undefined}
              onClick={() => setActiveTab('tracker')}
            >
              <TabIcon name="tracker" /> Live Wash Tracker
            </button>
            <button
              type="button"
              className={activeTab === 'invoices' ? 'active' : ''}
              aria-current={activeTab === 'invoices' ? 'page' : undefined}
              onClick={() => setActiveTab('invoices')}
            >
              <TabIcon name="invoices" /> Invoices &amp; Orders ({trackedOrders.length})
            </button>
          </nav>
        )}

        {notice && <div className="notice" role="status">{notice}</div>}

        {role === 'admin' ? (
          <section className="admin-view">
            <div className="view-heading">
              <div>
                <p className="eyebrow">Station workspace</p>
                <h1>Station Admin</h1>
                <p>Manage your locations, services, and customer orders.</p>
              </div>
              <button type="button" className="primary-button" onClick={addStation}>＋ Add station</button>
            </div>
            <div className="admin-stats">
              <div><span>Active stations</span><strong>{stations.length}</strong></div>
              <div><span>Open orders</span><strong>{bookings.length}</strong></div>
              <div><span>Average rating</span><strong>4.9 <span className="cyan">★</span></strong></div>
            </div>
            <div className="admin-list">
              <h2>Your locations</h2>
              {stations.map((station) => (
                <article className="admin-row" key={station.id}>
                  <div className="station-avatar"><CarIcon /></div>
                  <div className="admin-row-copy">
                    <strong>{station.name}</strong>
                    <span>{station.location} · {station.services.length} services</span>
                  </div>
                  <span className="open-badge">{station.availability.includes('Open') ? 'Open' : 'Setup'}</span>
                </article>
              ))}
            </div>
          </section>
        ) : activeTab === 'stations' ? (
          <section className="station-browser" aria-label="Find detail stations">
            <label className="search-field">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search stations by name, location or services..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="filter-list" aria-label="Filter stations by service">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={selectedFilter === filter ? 'selected' : ''}
                  aria-pressed={selectedFilter === filter}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="station-list" aria-live="polite">
              {visibleStations.length ? visibleStations.map((station) => {
                const isBooked = bookings.some((booking) => booking.stationId === station.id);
                return (
                  <article className="station-card" key={station.id}>
                    <div className="station-photo">
                      <img src="/car-wash.jpg" alt={`${station.name} washing a car`} />
                      <div className="station-rating"><StarIcon /> {station.rating} <span>({station.reviews})</span></div>
                      <div className="station-distance"><PinIcon /> {station.distance}</div>
                    </div>
                    <div className="station-details">
                      <div className="station-title-row">
                        <div>
                          <h2>{station.name}</h2>
                          <p>{station.location} · {station.availability}</p>
                        </div>
                        <strong className="station-price">From {formatCurrency(station.priceCents)}</strong>
                      </div>
                      <div className="station-services">
                        {station.services.slice(0, 3).map((service) => <span key={service}>{service}</span>)}
                      </div>
                      <button
                        type="button"
                        className={isBooked ? 'book-button booked' : 'book-button'}
                        onClick={() => bookStation(station)}
                      >
                        {isBooked ? 'Booking saved' : 'Book a slot'}
                      </button>
                    </div>
                  </article>
                );
              }) : (
                <div className="empty-state">
                  <SearchIcon />
                  <h2>No stations found</h2>
                  <p>Try a different search or service filter.</p>
                  <button type="button" onClick={() => { setQuery(''); setSelectedFilter('All'); }}>Clear filters</button>
                </div>
              )}
            </div>
          </section>
        ) : activeTab === 'tracker' ? (
          <section className="content-view tracker-view">
            {activeOrder ? (
              <>
                <article className="tracker-order-card">
                  <div className="tracker-car"><CarIcon /></div>
                  <div className="tracker-order-info">
                    <label htmlFor="tracked-order">Track order</label>
                    <select
                      id="tracked-order"
                      value={activeOrder.id}
                      onChange={(event) => setSelectedOrderId(event.target.value)}
                    >
                      {trackedOrders.map((order) => (
                        <option key={order.id} value={order.id}>{order.vehicle}</option>
                      ))}
                    </select>
                    <h1>{activeOrder.vehicle.replace(/ \([^)]*\)$/u, '')}</h1>
                    <p>{activeOrder.stationName} · Package: {activeOrder.packageName}</p>
                  </div>
                  <div className="tracker-order-actions">
                    <div><span>Realtime Status</span><strong className={activeOrder.status === 'In Progress' ? 'progress-status' : 'pending-status'}>{activeOrder.status === 'In Progress' ? '◌ In Progress' : activeOrder.status}</strong></div>
                    <button type="button" className="invoice-button" onClick={() => setModal({ type: 'invoice', order: activeOrder })}>
                      <TabIcon name="invoices" /> View Invoice
                    </button>
                  </div>
                </article>

                <section className="pipeline-panel" aria-labelledby="pipeline-title">
                  <div className="pipeline-heading">
                    <div>
                      <h2 id="pipeline-title">Live Service Pipeline</h2>
                      <p>{activeOrder.id === demoOrder.id ? 'Demo stage view' : 'Live booking updates from Firestore'}</p>
                    </div>
                    <div className="time-remaining"><span>Est. Time Remaining</span><strong>{activeOrder.status === 'Pending' ? 'Awaiting check-in' : '60 mins'}</strong></div>
                  </div>
                  <ol className="service-timeline">
                    {serviceStages.map((stage, index) => {
                      const isComplete = index < activeOrder.currentStage;
                      const isActive = index === activeOrder.currentStage;
                      return (
                        <li className={`${isComplete ? 'complete' : ''} ${isActive ? 'current' : ''}`} key={stage.title}>
                          <span className="stage-number">{isComplete ? '✓' : index + 1}</span>
                          <div className="stage-copy">
                            <strong>{stage.title}</strong>
                            <p>{stage.description}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                <section className="updates-panel" aria-labelledby="updates-title">
                  <h2 id="updates-title"><BellIcon /> Live Technician Updates &amp; Bay Photos</h2>
                  {activeOrder.status === 'Pending' ? (
                    <div className="update-log">
                      <div className="update-meta"><time>Now</time><strong>Booking Request</strong></div>
                      <p>Request sent to {activeOrder.stationName}. Waiting for station check-in and slot confirmation.</p>
                    </div>
                  ) : (
                    <>
                      <div className="update-log-list">
                        {(activeOrder.id === demoOrder.id ? demoUpdates : liveUpdates).map((update, index) => (
                          <article className="update-log" key={update.id || update.time || index}>
                            <div className="update-meta"><time>{update.time || update.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Live'}</time><strong>{update.title || 'Technician update'}</strong></div>
                            <p>{update.message}</p>
                          </article>
                        ))}
                        {activeOrder.id !== demoOrder.id && liveUpdates.length === 0 && (
                          <p className="no-updates">No technician updates have been posted yet.</p>
                        )}
                      </div>
                      {activeOrder.id === demoOrder.id ? (
                        <div className="bay-photo-grid">
                          <figure>
                            <img src="/car-wash.jpg" alt="Vehicle checked into the wash bay" />
                            <figcaption><span>Bay 04 · Vehicle intake</span><time>23:27</time></figcaption>
                          </figure>
                          <figure>
                            <img src="/car-wash-foam.jpg" alt="Live bay photo through the wash foam" />
                            <figcaption><span>Bay 04 · Wash in progress</span><time>23:31</time></figcaption>
                          </figure>
                        </div>
                      ) : liveUpdates.some((update) => update.photoUrl) ? (
                        <div className="bay-photo-grid">
                          {liveUpdates.filter((update) => update.photoUrl).map((update) => (
                            <figure key={update.id}>
                              <img src={update.photoUrl} alt={update.photoCaption || 'Service bay update'} />
                              <figcaption>
                                <span>{update.photoCaption || 'Service bay update'}</span>
                                <time>{update.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Live'}</time>
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              </>
            ) : (
              <div className="empty-state">
                <TabIcon name="tracker" />
                <h2>No wash orders yet</h2>
                <p>Your saved bookings will appear here with live service updates.</p>
                <button type="button" onClick={() => setActiveTab('stations')}>Find a station</button>
              </div>
            )}
          </section>
        ) : (
          <section className="content-view">
            <div className="view-heading">
              <div>
                <p className="eyebrow">Your account</p>
                <h1>Invoices &amp; Orders</h1>
                <p>Review your recent wash orders and payment history.</p>
              </div>
            </div>
            {trackedOrders.length ? trackedOrders.map((order) => (
              <div className="invoice-card" key={order.id}>
                <div className="invoice-icon"><TabIcon name="invoices" /></div>
                <div className="invoice-copy">
                  <strong>{order.packageName}</strong>
                  <span>{order.stationName} · {order.date || 'Demo order'}</span>
                </div>
                <strong className="invoice-amount">{formatCurrency(order.totalCents)}</strong>
                <span className={order.paid ? 'paid-badge' : 'pending-badge'}>{order.paid ? 'Paid' : 'Unpaid'}</span>
                <div className="invoice-actions">
                  <button type="button" className="invoice-list-button" onClick={() => setModal({ type: 'invoice', order })}>View Invoice</button>
                  {!order.paid && <button type="button" className="invoice-list-button pay" onClick={() => setModal({ type: 'invoice', order })}>Pay now</button>}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <TabIcon name="invoices" />
                <h2>No invoices yet</h2>
                <p>Invoices are created automatically when you save a booking.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {modal?.type === 'booking' && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}>
          <section className="app-modal booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
            <button type="button" className="modal-close" aria-label="Close booking form" onClick={() => setModal(null)}>×</button>
            <p className="eyebrow">Reserve service slot</p>
            <h2 id="booking-modal-title">{modal.station.name}</h2>
            <p className="modal-subtitle">Express Wash &amp; Vacuum · <strong>{formatCurrency(bookingPriceCents)}</strong></p>
            <form onSubmit={submitBooking}>
              <label className="form-field full">
                <span>Your Full Name</span>
                <input
                  required
                  autoComplete="name"
                  value={bookingForm.customer}
                  onChange={(event) => setBookingForm((current) => ({ ...current, customer: event.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>Car Model &amp; Color</span>
                <input
                  required
                  value={bookingForm.vehicleModel}
                  onChange={(event) => setBookingForm((current) => ({ ...current, vehicleModel: event.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>License Plate</span>
                <input
                  required
                  value={bookingForm.plate}
                  onChange={(event) => setBookingForm((current) => ({ ...current, plate: event.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>Preferred Date</span>
                <input
                  required
                  type="date"
                  min={getLocalDate()}
                  value={bookingForm.date}
                  onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>Time Slot</span>
                <select
                  value={bookingForm.time}
                  onChange={(event) => setBookingForm((current) => ({ ...current, time: event.target.value }))}
                >
                  {timeSlots.map((time) => <option key={time}>{time}</option>)}
                </select>
              </label>
              <div className="booking-total">
                <span>Total with 8% tax</span>
                <strong>{formatCurrency(bookingPriceCents + bookingTaxCents)}</strong>
              </div>
              <button type="submit" className="booking-submit" disabled={savingBooking}>
                {savingBooking ? 'Saving…' : 'Save Booking'}
              </button>
            </form>
            <p className="modal-demo-note">
              {isFirebaseConfigured
                ? 'Your booking and unpaid invoice will be saved to your account.'
                : 'Demo preview only. Configure Firebase to save bookings and invoices.'}
            </p>
          </section>
        </div>
      )}

      {modal?.type === 'invoice' && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}>
          <section className="app-modal invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title">
            <button type="button" className="modal-close" aria-label="Close invoice" onClick={() => setModal(null)}>×</button>
            <div className="invoice-modal-icon"><TabIcon name="invoices" /></div>
            <h2 id="invoice-modal-title">Digital Receipt</h2>
            <p className="invoice-document-id">Doc ID: {modal.order.id.slice(0, 14)}...</p>
            <div className="receipt-details">
              <div><span>Customer:</span><strong>{modal.order.customer || 'Jordan Vance'}</strong></div>
              <div><span>Vehicle:</span><strong>{modal.order.plate ? `${modal.order.vehicleModel} · ${modal.order.plate}` : modal.order.vehicleModel || 'BMW M4 Competition (Isle of Man Green)'}</strong></div>
              <div><span>Station:</span><strong>{modal.order.stationName}</strong></div>
            </div>
            <div className="receipt-line"><span>{modal.order.packageName}</span><strong>{formatCurrency(modal.order.servicePriceCents)}</strong></div>
            <div className="receipt-line receipt-tax"><span>Tax &amp; Eco Fee (8%)</span><strong>{formatCurrency(modal.order.taxCents)}</strong></div>
            <div className="receipt-total"><strong>Total Amount</strong><strong>{formatCurrency(modal.order.totalCents)}</strong></div>
            {modal.order.paid ? (
              <div className="receipt-paid" role="status">Payment confirmed</div>
            ) : (
              <button type="button" className="pay-invoice-button" onClick={() => payInvoice(modal.order)}>
                <span aria-hidden="true">▱</span> Pay {formatCurrency(modal.order.totalCents)} Now
              </button>
            )}
            <p className="modal-demo-note">Online payment is not available yet. No payment method is charged.</p>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
