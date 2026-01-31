import { format } from 'date-fns';
import { CSC_COUNTRIES } from './constants';

// --- ID & String Helpers ---
export const uid = () => Math.random().toString(36).slice(2, 9);

export const classNames = (...parts) => parts.filter(Boolean).join(' ');

export const normalize = (str) => 
  str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const escapeHtml = (s) => {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
};

export const getIsoFromCountryName = (name) => {
  if (!name) return "";
  const q = normalize(name.trim());
  let hit = CSC_COUNTRIES.find(c => normalize(c.name) === q);
  if (hit) return hit.isoCode;
  return "";
};

// --- Date Helpers ---
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
};

// --- Chronology Logic ---
export function buildTripEvents(trip, companions) {
  const stopsSorted = [...trip.stops].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
  const layoversSorted = [...trip.layovers].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
  const events = [];

  if (stopsSorted.length === 0) {
    layoversSorted.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l }));
    return events;
  }

  const firstStop = stopsSorted[0];
  const lastStop = stopsSorted[stopsSorted.length - 1];
  const beforeFirst = [];
  const afterLast = [];
  const betweenByIndex = Array.from({ length: Math.max(0, stopsSorted.length - 1) }, () => []);

  for (const l of layoversSorted) {
    const sTime = parseDate(l.start);
    const eTime = parseDate(l.end);
    if (eTime && eTime <= parseDate(firstStop.arrival)) { beforeFirst.push(l); continue; }
    if (sTime && sTime >= parseDate(lastStop.departure)) { afterLast.push(l); continue; }
    let placed = false;
    for (let i = 0; i < stopsSorted.length - 1; i++) {
      const depI = parseDate(stopsSorted[i].departure);
      const arrIp1 = parseDate(stopsSorted[i + 1].arrival);
      if (depI && arrIp1 && sTime && eTime && depI <= sTime && eTime <= arrIp1) {
        betweenByIndex[i].push(l); placed = true; break;
      }
    }
    if (!placed) { (sTime && sTime < parseDate(firstStop.arrival) ? beforeFirst : afterLast).push(l); }
  }

  const firstStopId = firstStop.id;
  const lastStopId = lastStop.id;
  beforeFirst.sort((a, b) => (parseDate(a.end) - parseDate(b.end)));
  afterLast.sort((a, b) => (parseDate(a.start) - parseDate(b.start)));

  stopsSorted.forEach((s, i) => {
    const isFirstInTrip = s.id === firstStopId;
    const isLastInTrip = s.id === lastStopId;
    events.push({
      type: 'stop',
      date: parseDate(s.arrival),
      stop: {
        ...s, isFirstInTrip, isLastInTrip,
        tripPurpose: trip.purpose,
        tripVaccines: trip.vaccines || { status: 'unknown', details: [] },
        tripMalaria: trip.malaria || { indication: 'Not indicated', drug: 'None', adherence: '' },
        tripCompanions: companions || null,
        tripOriginCountry: trip.originCountry || '', tripOriginCity: trip.originCity || '',
      },
    });
    // Add layovers as events...
    if (i === 0 && beforeFirst.length) {
      beforeFirst.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'before-stop' }));
    }
    if (i < betweenByIndex.length) {
      const group = betweenByIndex[i].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
      group.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'between' }));
    }
    if (isLastInTrip && afterLast.length) {
      afterLast.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'after-stop' }));
    }
  });
  return events;
}

// --- Initial State Generators ---
export const emptyStop = () => ({
  id: uid(),
  country: '',
  cities: [{ name: '', arrival: '', departure: '' }],
  arrival: '',
  departure: '',
  accommodations: [],
  accommodationOther: '',
  exposures: {
    mosquito: 'unknown',
    tick: 'unknown',
    vectorOtherEnabled: 'unknown',
    freshwater: 'unknown',
    cavesMines: 'unknown',
    ruralForest: 'unknown',
    hikingWoodlands: 'unknown',
    animalContact: 'unknown',
    animalBiteScratch: 'unknown',
    batsRodents: 'unknown',
    bushmeat: 'unknown',
    needlesTattoos: 'unknown',
    safariWildlife: 'unknown',
    streetFood: 'unknown',
    untreatedWater: 'unknown',
    undercookedFood: 'unknown',
    undercookedSeafood: 'unknown',
    unpasteurisedMilk: 'unknown',
    funerals: 'unknown',
    sickContacts: 'unknown',
    healthcareFacility: 'unknown',
    prison: 'unknown',
    refugeeCamp: 'unknown',
    unprotectedSex: 'unknown',
    positiveDetails: '',
    otherText: '',
  },
});

export const emptyLayover = (tripId) => ({
  id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no', activitiesText: '',
});

export const emptyPastTravel = () => ({
  id: uid(), country: '', year: '', details: '',
});

export const emptyTrip = () => ({
  id: uid(),
  purpose: '',
  originCountry: 'United Kingdom',
  originCity: 'Manchester',
  vaccines: { status: 'unknown', details: [] }, 
  malaria: { indication: 'Not indicated', drug: 'None', adherence: '' },
  companions: { group: 'Alone', otherText: '', companionsWell: 'unknown', companionsUnwellDetails: '' },
  stops: [emptyStop()],
  layovers: [],
});

export const initialState = {
  trips: [emptyTrip()],
  pastTravels: [],
};
