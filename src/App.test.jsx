import { beforeEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { initialStations } from './data/stations';
import App from './App';

const testData = vi.hoisted(() => ({
  bookings: [],
  invoices: [],
  updates: [],
}));

const firebaseMocks = vi.hoisted(() => ({
  observeSession: vi.fn(),
  ensureStarterStations: vi.fn(),
  subscribeToStations: vi.fn(),
  subscribeToBookings: vi.fn(),
  subscribeToInvoices: vi.fn(),
  subscribeToBookingUpdates: vi.fn(),
  createBooking: vi.fn(),
  createStation: vi.fn(),
}));

vi.mock('./firebase', () => ({
  firebaseError: null,
  isFirebaseConfigured: true,
}));

vi.mock('./firebaseData', () => firebaseMocks);

beforeEach(() => {
  testData.bookings = [];
  testData.invoices = [];
  testData.updates = [];
  firebaseMocks.observeSession.mockImplementation((onSession) => {
    onSession({ uid: 'customer-test', isStationAdmin: true });
    return () => {};
  });
  firebaseMocks.ensureStarterStations.mockResolvedValue(undefined);
  firebaseMocks.subscribeToStations.mockImplementation((onData) => {
    onData(initialStations);
    return () => {};
  });
  firebaseMocks.subscribeToBookings.mockImplementation((_, onData) => {
    onData(testData.bookings);
    return () => {};
  });
  firebaseMocks.subscribeToInvoices.mockImplementation((_, onData) => {
    onData(testData.invoices);
    return () => {};
  });
  firebaseMocks.subscribeToBookingUpdates.mockImplementation((__, onData) => {
    onData(testData.updates);
    return () => {};
  });
  firebaseMocks.createBooking.mockImplementation(async (booking) => ({
    id: 'booking-created',
    stationId: booking.station.id,
    stationName: booking.station.name,
    customer: booking.customer,
    vehicleModel: booking.vehicleModel,
    plate: booking.plate,
    date: booking.date,
    time: booking.time,
    serviceName: 'Express Wash & Vacuum',
    status: 'pending',
    currentStage: -1,
    servicePriceCents: booking.station.priceCents,
    taxCents: Math.round(booking.station.priceCents * 0.08),
    totalCents: Math.round(booking.station.priceCents * 1.08),
  }));
  firebaseMocks.createStation.mockImplementation(async (station) => ({ id: 'new-station', ...station }));
});

test('renders the CarWash Connect owner station finder', () => {
  render(<App />);

  expect(screen.getByText('CarWash')).toBeDefined();
  expect(screen.getByRole('button', { name: /find detail stations/i })).toBeDefined();
  expect(screen.getByPlaceholderText(/search stations by name/i)).toBeDefined();
  expect(screen.getByRole('heading', { name: /aquaglow auto spa/i })).toBeDefined();
  expect(screen.getByRole('button', { name: /ceramic coating/i }).getAttribute('aria-pressed')).toBe('true');
});

test('filters stations by service and search query', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'All' }));
  await user.type(screen.getByPlaceholderText(/search stations by name/i), 'Riverside');

  expect(screen.getByRole('heading', { name: /crystal clear car care/i })).toBeDefined();
  expect(screen.queryByRole('heading', { name: /aquaglow auto spa/i })).toBeNull();
});

test('books a station slot and tracks the submitted vehicle details', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole('button', { name: /book a slot/i })[0]);
  expect(screen.getByRole('dialog', { name: /aquaglow auto spa/i })).toBeDefined();
  await user.clear(screen.getByLabelText(/your full name/i));
  await user.type(screen.getByLabelText(/your full name/i), 'Alex Driver');
  await user.clear(screen.getByLabelText(/car model & color/i));
  await user.type(screen.getByLabelText(/car model & color/i), 'Blue Hatchback');
  await user.clear(screen.getByLabelText(/license plate/i));
  await user.type(screen.getByLabelText(/license plate/i), 'ABC123');
  await user.click(screen.getByRole('button', { name: /save booking/i }));
  expect(screen.getByRole('status').textContent).toMatch(/booking and invoice saved/i);
  expect(firebaseMocks.createBooking).toHaveBeenCalledWith(
    expect.objectContaining({
      customer: 'Alex Driver',
      vehicleModel: 'Blue Hatchback',
      plate: 'ABC123',
    }),
    'customer-test',
  );

  await user.click(screen.getByRole('button', { name: /live wash tracker/i }));
  expect(screen.getByRole('heading', { name: /live service pipeline/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: /blue hatchback/i })).toBeDefined();
  await user.click(screen.getByRole('button', { name: /view invoice/i }));
  expect(screen.getByText('Alex Driver')).toBeDefined();
  expect(screen.getByText((_, element) => element.textContent === 'Blue Hatchback · ABC123')).toBeDefined();
});

test('shows a persisted vehicle pipeline, technician updates, and bay photos', async () => {
  const user = userEvent.setup();
  testData.bookings = [{
    id: 'booking-bmw',
    stationId: 'apex-detail',
    stationName: 'Apex Detail Studio & Ceramic Hub',
    customer: 'Jordan Vance',
    vehicleModel: 'BMW M4 Competition (Isle of Man Green)',
    plate: 'M4-POWER',
    serviceName: 'Express Wash & Vacuum',
    status: 'in-progress',
    currentStage: 0,
    servicePriceCents: 3500,
    taxCents: 280,
    totalCents: 3780,
  }];
  testData.invoices = [{
    bookingId: 'booking-bmw',
    paymentStatus: 'unpaid',
    servicePriceCents: 3500,
    taxCents: 280,
    totalCents: 3780,
  }];
  testData.updates = [{
    id: 'update-1',
    title: 'Technician update · Bay 04',
    message: 'Vehicle checked in. Pre-wash team is preparing the foam treatment.',
    photoUrl: '/car-wash-foam.jpg',
    photoCaption: 'Bay 04 · Wash in progress',
  }];
  render(<App />);

  await user.click(screen.getByRole('button', { name: /live wash tracker/i }));

  expect(screen.getByRole('heading', { name: /live service pipeline/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: /bmw m4 competition/i })).toBeDefined();
  expect(screen.getByText('Vehicle Received')).toBeDefined();
  expect(screen.getByText('Ready for Pickup')).toBeDefined();
  expect(screen.getByRole('heading', { name: /live technician updates & bay photos/i })).toBeDefined();
  expect(screen.getByRole('img', { name: /bay 04 · wash in progress/i })).toBeDefined();
  expect(screen.getByText(/pre-wash team is preparing/i)).toBeDefined();

  await user.click(screen.getByRole('button', { name: /view invoice/i }));
  expect(screen.getByRole('dialog', { name: /digital receipt/i })).toBeDefined();
  expect(screen.getByText('$37.80')).toBeDefined();
});

test('does not mark an invoice paid when payment processing is unavailable', async () => {
  const user = userEvent.setup();
  testData.bookings = [{
    id: 'booking-bmw',
    stationId: 'apex-detail',
    stationName: 'Apex Detail Studio & Ceramic Hub',
    customer: 'Jordan Vance',
    vehicleModel: 'BMW M4 Competition',
    plate: 'M4-POWER',
    serviceName: 'Express Wash & Vacuum',
    status: 'pending',
    currentStage: -1,
    servicePriceCents: 3500,
    taxCents: 280,
    totalCents: 3780,
  }];
  testData.invoices = [{
    bookingId: 'booking-bmw',
    paymentStatus: 'unpaid',
    servicePriceCents: 3500,
    taxCents: 280,
    totalCents: 3780,
  }];
  render(<App />);

  await user.click(screen.getByRole('button', { name: /live wash tracker/i }));
  await user.click(screen.getByRole('button', { name: /view invoice/i }));
  await user.click(screen.getByRole('button', { name: /pay \$37\.80 now/i }));

  expect(screen.getByRole('status').textContent).toMatch(/no payment was made/i);
  await user.click(screen.getByRole('button', { name: /invoices & orders/i }));
  expect(screen.getByText('Unpaid')).toBeDefined();
});

test('station admin can add a location to the workspace', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /station admin/i }));
  await user.click(screen.getByRole('button', { name: /add station/i }));

  expect(screen.getByRole('heading', { name: /station admin/i })).toBeDefined();
  expect(await screen.findByText(/new station added to firestore/i)).toBeDefined();
  expect(screen.getByText('New Detail Station')).toBeDefined();
});
