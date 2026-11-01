import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { auth, db, firebaseError } from './firebase';
import { initialStations } from './data/stations';

function requireFirebase() {
  if (firebaseError) {
    throw new Error(firebaseError);
  }
  if (!auth || !db) {
    throw new Error('Firebase is not ready.');
  }
}

function toRecords(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function observeSession(onSession, onError) {
  if (firebaseError || !auth) {
    onSession(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      user.getIdTokenResult()
        .then((token) => onSession({
          uid: user.uid,
          isStationAdmin: token.claims.admin === true,
        }))
        .catch(onError);
      return;
    }

    signInAnonymously(auth).catch(onError);
  }, onError);
}

export function ensureStarterStations() {
  requireFirebase();

  return runTransaction(db, async (transaction) => {
    const stationRefs = initialStations.map((station) => doc(db, 'stations', station.id));
    const existing = await Promise.all(stationRefs.map((stationRef) => transaction.get(stationRef)));

    stationRefs.forEach((stationRef, index) => {
      if (!existing[index].exists()) {
        const { id, ...station } = initialStations[index];
        transaction.set(stationRef, station);
      }
    });
  });
}

export function subscribeToStations(onData, onError) {
  requireFirebase();
  const stationsQuery = query(collection(db, 'stations'), where('active', '==', true));
  return onSnapshot(stationsQuery, (snapshot) => onData(toRecords(snapshot)), onError);
}

export function subscribeToBookings(ownerUid, onData, onError) {
  requireFirebase();
  const bookingsQuery = query(collection(db, 'bookings'), where('ownerUid', '==', ownerUid));
  return onSnapshot(bookingsQuery, (snapshot) => onData(toRecords(snapshot)), onError);
}

export function subscribeToInvoices(ownerUid, onData, onError) {
  requireFirebase();
  const invoicesQuery = query(collection(db, 'invoices'), where('ownerUid', '==', ownerUid));
  return onSnapshot(invoicesQuery, (snapshot) => onData(toRecords(snapshot)), onError);
}

export function subscribeToBookingUpdates(bookingId, onData, onError) {
  requireFirebase();
  const updatesRef = collection(db, 'bookings', bookingId, 'updates');
  return onSnapshot(query(updatesRef, where('visibleToCustomer', '==', true)), (snapshot) => {
    onData(toRecords(snapshot));
  }, onError);
}

export async function createBooking({ station, customer, vehicleModel, plate, date, time }, ownerUid) {
  requireFirebase();
  if (!ownerUid) {
    throw new Error('Sign in before saving a booking.');
  }

  const servicePriceCents = station.priceCents ?? 3500;
  const taxCents = Math.round(servicePriceCents * 0.08);
  const bookingRef = doc(collection(db, 'bookings'));
  const invoiceRef = doc(db, 'invoices', bookingRef.id);
  const stationRef = doc(db, 'stations', station.id);
  const booking = {
    ownerUid,
    stationId: station.id,
    stationName: station.name,
    customer,
    vehicleModel,
    plate,
    serviceName: 'Express Wash & Vacuum',
    date,
    time,
    status: 'pending',
    currentStage: -1,
    servicePriceCents,
    taxCents,
    totalCents: servicePriceCents + taxCents,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const invoice = {
    bookingId: bookingRef.id,
    ownerUid,
    stationId: station.id,
    stationName: station.name,
    customer,
    vehicleModel,
    plate,
    serviceName: booking.serviceName,
    servicePriceCents,
    taxCents,
    totalCents: booking.totalCents,
    paymentStatus: 'unpaid',
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const stationSnapshot = await transaction.get(stationRef);
    if (!stationSnapshot.exists() || stationSnapshot.data().active !== true) {
      throw new Error('This station is no longer available. Refresh and choose another station.');
    }
    transaction.set(bookingRef, booking);
    transaction.set(invoiceRef, invoice);
  });

  return { id: bookingRef.id, ...booking, createdAt: new Date() };
}

export async function createStation(station, isStationAdmin) {
  requireFirebase();
  if (!isStationAdmin) {
    throw new Error('Station administrator access is required to add a station.');
  }

  const stationData = { ...station, active: true, createdAt: serverTimestamp() };
  const stationRef = await addDoc(collection(db, 'stations'), stationData);
  return { id: stationRef.id, ...stationData };
}
