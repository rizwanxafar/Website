'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v10
// Updates:
// - Removed print-timeline functionality
// - Removed About modal/button
// - Adjusted layover placement structure (handled in TimelineVertical)
// - Added blank line before each country in summary
// - Bullet lists for cities and exposures

import { useEffect, useMemo, useRef, useState } from "react";
import CountryInput from "@/components/inputs/CountryInput";
import { Country, City } from "country-state-city";

// --- constants and utilities ---
const CSC_COUNTRIES = Country.getAllCountries();

function getIsoFromCountryName(name) {
  if (!name) return "";
  const q = name.trim().toLowerCase();
  let hit = CSC_COUNTRIES.find((c) => c.name.toLowerCase() === q);
  if (hit) return hit.isoCode;
  const norm = (s) =>
    s
      .normalize?.("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim()
      .toLowerCase() || s.toLowerCase();
  hit = CSC_COUNTRIES.find((c) => norm(c.name) === norm(q));
  return hit ? hit.isoCode : "";
}

const ACCOMMODATION_OPTIONS = [
  "Hotel/Resort",
  "Hostel",
  "Homestay",
  "Friends/Family home",
  "Rural camp",
  "Safari camp",
  "Refugee camp",
  "Healthcare facility residence",
  "Other",
];

const VACCINE_OPTIONS = [
  "Yellow fever",
  "Hepatitis A",
  "Hepatitis B",
  "Typhoid",
  "Meningitis ACWY",
  "Rabies (pre-exposure)",
  "Cholera (oral)",
  "Japanese encephalitis (JE)",
  "Tick-borne encephalitis (TBE)",
  "Other",
];

const MALARIA_DRUGS = [
  "None",
  "Atovaquone/Proguanil",
  "Doxycycline",
  "Mefloquine",
  "Chloroquine",
];
const MALARIA_INDICATIONS = ["Not indicated", "Taken", "Not taken"];

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const BTN_SECONDARY =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...p) => p.filter(Boolean).join(" ");

const parseDate = (d) => (d ? new Date(d) : null);
const formatDMY = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// ---- Initial shapes ----
const emptyStop = () => ({
  id: uid(),
  country: "",
  cities: [{ name: "", arrival: "", departure: "" }],
  arrival: "",
  departure: "",
  accommodations: [],
  accommodationOther: "",
  exposures: {
    mosquito: false,
    mosquitoDetails: "",
    tick: false,
    tickDetails: "",
    vectorOtherEnabled: false,
    vectorOther: "",
    vectorOtherDetails: "",
    freshwater: false,
    freshwaterDetails: "",
    cavesMines: false,
    cavesMinesDetails: "",
    ruralForest: false,
    ruralForestDetails: "",
    hikingWoodlands: false,
    hikingWoodlandsDetails: "",
    animalContact: false,
    animalContactDetails: "",
    animalBiteScratch: false,
    animalBiteScratchDetails: "",
    bushmeat: false,
    bushmeatDetails: "",
    needlesTattoos: false,
    needlesTattoosDetails: "",
    safariWildlife: false,
    safariWildlifeDetails: "",
    streetFood: false,
    streetFoodDetails: "",
    untreatedWater: false,
    untreatedWaterDetails: "",
    undercookedFood: false,
    undercookedFoodDetails: "",
    undercookedSeafood: false,
    undercookedSeafoodDetails: "",
    unpasteurisedMilk: false,
    unpasteurisedMilkDetails: "",
    funerals: false,
    funeralsDetails: "",
    largeGatherings: false,
    largeGatheringsDetails: "",
    sickContacts: false,
    sickContactsDetails: "",
    healthcareFacility: false,
    healthcareFacilityDetails: "",
    prison: false,
    prisonDetails: "",
    refugeeCamp: false,
    refugeeCampDetails: "",
    otherText: "",
  },
});

const emptyLayover = (tripId) => ({
  id: uid(),
  tripId,
  country: "",
  city: "",
  start: "",
  end: "",
  leftAirport: "no",
  activitiesText: "",
});

const emptyTrip = () => ({
  id: uid(),
  purpose: "",
  originCountry: "",
  originCity: "",
  vaccines: [],
  vaccinesOther: "",
  malaria: { indication: "Not indicated", drug: "None", adherence: "" },
  stops: [emptyStop()],
  layovers: [],
});

const initialState = {
  trips: [emptyTrip()],
  companions: {
    group: "Alone",
    otherText: "",
    companionsWell: "unknown",
    companionsUnwellDetails: "",
  },
};

// ===== Timeline data builder =====
function buildTripEvents(trip, companions) {
  const stopsSorted = [...trip.stops].sort(
    (a, b) => parseDate(a.arrival) - parseDate(b.arrival)
  );
  const layoversSorted = [...trip.layovers].sort(
    (a, b) => parseDate(a.start) - parseDate(b.start)
  );
  const events = [];

  if (!stopsSorted.length) {
    layoversSorted.forEach((l) =>
      events.push({ type: "layover", date: parseDate(l.start), layover: l })
    );
    return events;
  }

  const first = stopsSorted[0],
    last = stopsSorted[stopsSorted.length - 1];
  const before = [],
    after = [],
    between = Array.from({ length: Math.max(0, stopsSorted.length - 1) }, () => []);

  for (const l of layoversSorted) {
    const sT = parseDate(l.start),
      eT = parseDate(l.end);
    if (eT && eT <= parseDate(first.arrival)) {
      before.push(l);
      continue;
    }
    if (sT && sT >= parseDate(last.departure)) {
      after.push(l);
      continue;
    }
    let placed = false;
    for (let i = 0; i < stopsSorted.length - 1; i++) {
      const depI = parseDate(stopsSorted[i].departure),
        arrIp1 = parseDate(stopsSorted[i + 1].arrival);
      if (depI && arrIp1 && sT && eT && depI <= sT && eT <= arrIp1) {
        between[i].push(l);
        placed = true;
        break;
      }
    }
    if (!placed)
      (sT && sT < parseDate(first.arrival) ? before : after).push(l);
  }

  stopsSorted.forEach((s, i) => {
    const isFirst = s.id === first.id,
      isLast = s.id === last.id;
    if (i === 0)
      before
        .sort((a, b) => parseDate(a.end) - parseDate(b.end))
        .forEach((l) =>
          events.push({
            type: "layover",
            layover: l,
            date: parseDate(l.start),
            position: "before-stop",
          })
        );
    events.push({
      type: "stop",
      stop: {
        ...s,
        isFirstInTrip: isFirst,
        isLastInTrip: isLast,
        tripPurpose: trip.purpose,
        tripVaccines: trip.vaccines,
        tripVaccinesOther: trip.vaccinesOther,
        tripMalaria: trip.malaria,
        tripCompanions: companions,
        tripOriginCountry: trip.originCountry,
        tripOriginCity: trip.originCity,
      },
    });
    (between[i] || []).forEach((l) =>
      events.push({
        type: "layover",
        layover: l,
        date: parseDate(l.start),
        position: "between",
      })
    );
    if (i === stopsSorted.length - 1)
      after
        .sort((a, b) => parseDate(a.start) - parseDate(b.start))
        .forEach((l) =>
          events.push({
            type: "layover",
            layover: l,
            date: parseDate(l.start),
            position: "after-stop",
          })
        );
  });

  return events;
}

// ===== Main Page Component =====
export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({
    stopIds: new Set(),
    layoverIds: new Set(),
  });
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => {
    if (el) itemRefs.current.set(id, el);
  };

  // simple validation
  useEffect(() => {
    const list = [];
    const stopIds = new Set();
    state.trips.forEach((trip, tIdx) => {
      trip.stops.forEach((s, sIdx) => {
        if (s.arrival && s.departure && parseDate(s.arrival) > parseDate(s.departure)) {
          list.push({
            level: "error",
            msg: `Trip ${tIdx + 1}, Stop ${sIdx + 1}: Arrival is after departure.`,
          });
          stopIds.add(s.id);
        }
      });
    });
    setIssues(list);
    setHighlight({ stopIds, layoverIds: new Set() });
  }, [state.trips]);

  const mergedEvents = useMemo(() => {
    const all = [];
    state.trips.forEach((trip) =>
      buildTripEvents(trip, state.companions).forEach((ev) =>
        all.push({ ...ev, tripId: trip.id })
      )
    );
    return all.sort((a, b) => (a.date || 0) - (b.date || 0));
  }, [state.trips, state.companions]);

  const { summaryHtml, summaryTextPlain } = useMemo(
    () => buildSummaryFromEvents(state, mergedEvents),
    [state, mergedEvents]
  );

  const updateTrip = (id, patch) =>
    setState((p) => ({
      ...p,
      trips: p.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));

  const updateStop = (tId, sId, patch) =>
    setState((p) => ({
      ...p,
      trips: p.trips.map((t) =>
        t.id === tId
          ? { ...t, stops: t.stops.map((s) => (s.id === sId ? { ...s, ...patch } : s)) }
          : t
      ),
    }));

  const addTrip = () =>
    setState((p) => ({ ...p, trips: [...p.trips, emptyTrip()] }));
  const removeTrip = (id) =>
    setState((p) => ({ ...p, trips: p.trips.filter((t) => t.id !== id) }));
  const addStop = (tId) =>
    setState((p) => ({
      ...p,
      trips: p.trips.map((t) =>
        t.id === tId ? { ...t, stops: [...t.stops, emptyStop()] } : t
      ),
    }));

  const clearAll = () => {
    if (confirm("Clear all data?")) setState(initialState);
  };

  return (
    <main className="py-10 sm:py-14">
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Travel History Generator
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Build a clear, printable travel history. Provide as much information as possible to
            generate accurate history.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>
            Clear all
          </button>
        </div>
      </header>

      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3">
        <span aria-hidden="true">⚠️</span>
        <p className="text-sm">Do not enter private or patient-identifiable information.</p>
      </div>

      {issues.length > 0 && (
        <div className="mb-6 space-y-2" aria-live="polite">
          {issues.map((e, i) => (
            <div
              key={i}
              className="rounded-lg border px-3 py-2 text-sm border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-200"
            >
              {e.msg}
            </div>
          ))}
        </div>
      )}

      {/* Trip builder */}
      <section className="space-y-10">
        {state.trips.map((trip, tIdx) => (
          <TripCard
            key={trip.id}
            innerRef={setItemRef(trip.id)}
            trip={trip}
            index={tIdx}
            updateTrip={updateTrip}
            updateStop={updateStop}
            addStop={addStop}
            removeTrip={removeTrip}
            highlight={highlight}
          />
        ))}
        <button type="button" onClick={addTrip} className={BTN_PRIMARY}>
          + Add another trip
        </button>
      </section>

      {/* Timeline */}
      <section
        id="timeline-section"
        className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Timeline
        </h2>
        <TimelineVertical events={mergedEvents} />
      </section>

      {/* Text summary */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Travel History Summary
        </h2>
        <div
          className="text-sm text-slate-700 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: summaryHtml }}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(summaryTextPlain)}
            className={BTN_SECONDARY}
          >
            Copy summary
          </button>
        </div>
      </section>
    </main>
  );
}

// ===== Trip Card =====
function TripCard({
  trip,
  index,
  updateTrip,
  updateStop,
  addStop,
  removeTrip,
  highlight,
  innerRef,
}) {
  // Trip-level vaccine toggle
  const toggleTripVaccine = (v) => {
    const set = new Set(trip.vaccines || []);
    const had = set.has(v);
    if (had) set.delete(v);
    else set.add(v);
    const patch = { vaccines: Array.from(set) };
    if (v === "Other" && had) patch.vaccinesOther = "";
    updateTrip(trip.id, patch);
  };

  // Trip-level malaria setters (ensure fields clear when not "Taken")
  const setMalaria = (patch) => {
    const next = { ...(trip.malaria || {}), ...patch };
    if (next.indication !== "Taken") {
      next.drug = "None";
      next.adherence = "";
    }
    updateTrip(trip.id, { malaria: next });
  };

  // Origin helpers (country -> city list)
  const originISO2 = useMemo(
    () => getIsoFromCountryName(trip.originCountry),
    [trip.originCountry]
  );
  const originCityNames = useMemo(() => {
    const list = originISO2 ? City.getCitiesOfCountry(originISO2) || [] : [];
    const names = Array.from(new Set(list.map((c) => c.name)));
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return names;
  }, [originISO2]);

  // ---- Layovers management (handled locally via updateTrip) ----
  const addLayoverLocal = () => {
    const l = {
      id: Math.random().toString(36).slice(2, 9),
      tripId: trip.id,
      country: "",
      city: "",
      start: "",
      end: "",
      leftAirport: "no",
      activitiesText: "",
    };
    updateTrip(trip.id, { layovers: [...(trip.layovers || []), l] });
  };

  const updateLayoverLocal = (layoverId, patch) => {
    const next = (trip.layovers || []).map((l) =>
      l.id === layoverId ? { ...l, ...patch } : l
    );
    updateTrip(trip.id, { layovers: next });
  };

  const removeLayoverLocal = (layoverId) => {
    const next = (trip.layovers || []).filter((l) => l.id !== layoverId);
    updateTrip(trip.id, { layovers: next });
  };

  // Remove stop (handled locally via updateTrip)
  const removeStopLocal = (stopId) => {
    const next = (trip.stops || []).filter((s) => s.id !== stopId);
    updateTrip(trip.id, { stops: next.length ? next : [] });
  };

  return (
    <div
      ref={innerRef}
      className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Trip {index + 1}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addStop(trip.id)}
            className={BTN_PRIMARY}
          >
            + Add stop
          </button>
          <button
            type="button"
            onClick={addLayoverLocal}
            className={BTN_PRIMARY}
          >
            + Add layover
          </button>
          <button
            type="button"
            onClick={() => removeTrip(trip.id)}
            className={BTN_SECONDARY}
          >
            Remove trip
          </button>
        </div>
      </div>

      {/* Travelling from */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
          Travelling from
        </label>
        <div className="mt-2 grid sm:grid-cols-2 gap-4">
          <CountryInput
            value={trip.originCountry}
            onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: "" })}
          />
          <div className="w-full">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              list={`trip-origin-cities-${trip.id}`}
              placeholder="Start typing or select city…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.originCity || ""}
              onChange={(e) => updateTrip(trip.id, { originCity: e.target.value })}
            />
            <datalist id={`trip-origin-cities-${trip.id}`}>
              {originCityNames.map((nm) => (
                <option key={nm} value={nm} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Trip purpose */}
      <div className="mt-4">
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
          Purpose
        </label>
        <input
          type="text"
          placeholder="Work, VFR, tourism, humanitarian, etc."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          value={trip.purpose}
          onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })}
        />
      </div>

      {/* Trip-wide Vaccines & Malaria */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Vaccines */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Pre-travel vaccinations
          </label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VACCINE_OPTIONS.map((v) => (
              <Checkbox
                key={v}
                label={v}
                checked={(trip.vaccines || []).includes(v)}
                onChange={() => toggleTripVaccine(v)}
              />
            ))}
          </div>
          {(trip.vaccines || []).includes("Other") && (
            <div className="mt-2">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Other vaccination(s)
              </label>
              <input
                type="text"
                placeholder="Enter vaccine name(s)…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.vaccinesOther || ""}
                onChange={(e) => updateTrip(trip.id, { vaccinesOther: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Malaria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Malaria prophylaxis
          </label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            {/* Indication */}
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.malaria.indication}
              onChange={(e) => setMalaria({ indication: e.target.value })}
            >
              {MALARIA_INDICATIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Drug (only when Taken) */}
            {trip.malaria.indication === "Taken" && (
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.malaria.drug}
                onChange={(e) => setMalaria({ drug: e.target.value })}
              >
                {["None", "Atovaquone/Proguanil", "Doxycycline", "Mefloquine", "Chloroquine"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Adherence (only when Taken) */}
            {trip.malaria.indication === "Taken" && (
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.malaria.adherence}
                onChange={(e) => setMalaria({ adherence: e.target.value })}
              >
                <option value="">Adherence…</option>
                <option value="Good">Good</option>
                <option value="Partial">Partial</option>
                <option value="Poor">Poor</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Stops */}
      <div className="mt-6 space-y-6">
        {trip.stops.map((stop, sIdx) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={sIdx}
            onChange={(patch) => updateStop(trip.id, stop.id, patch)}
            onRemove={() => removeStopLocal(stop.id)}
            highlighted={highlight.stopIds.has(stop.id)}
          />
        ))}
      </div>

      {/* Layovers */}
      {(trip.layovers || []).length > 0 && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Layovers
          </h3>
          <div className="space-y-4">
            {(trip.layovers || []).map((l) => (
              <LayoverCard
                key={l.id}
                layover={l}
                onChange={(patch) => updateLayoverLocal(l.id, patch)}
                onRemove={() => removeLayoverLocal(l.id)}
                highlighted={highlight.layoverIds?.has?.(l.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Stop Card =====
function StopCard({ stop, index, onChange, onRemove, highlighted }) {
  const exp = stop.exposures || {};

  // Normalize cities to objects
  const normalizedCities = (stop.cities || []).map((c) =>
    typeof c === "string"
      ? { name: c || "", arrival: "", departure: "" }
      : { name: c?.name || "", arrival: c?.arrival || "", departure: c?.departure || "" }
  );

  // Country → cities options
  const countryISO2 = useMemo(() => getIsoFromCountryName(stop.country), [stop.country]);
  const cityOptions = useMemo(
    () => (countryISO2 ? City.getCitiesOfCountry(countryISO2) || [] : []),
    [countryISO2]
  );

  const commitCities = (next) => onChange({ cities: next });

  const setCityName = (i, name) => {
    const next = [...normalizedCities];
    next[i] = { ...next[i], name };
    commitCities(next);
  };
  const setCityArrival = (i, arrival) => {
    const next = [...normalizedCities];
    next[i] = { ...next[i], arrival };
    commitCities(next);
  };
  const setCityDeparture = (i, departure) => {
    const next = [...normalizedCities];
    next[i] = { ...next[i], departure };
    commitCities(next);
  };
  const addCity = () =>
    commitCities([...normalizedCities, { name: "", arrival: "", departure: "" }]);
  const removeCity = (i) => {
    const next = [...normalizedCities];
    next.splice(i, 1);
    if (!next.length) next.push({ name: "", arrival: "", departure: "" });
    commitCities(next);
  };

  // Accommodation toggles
  const toggleAccommodation = (value) => {
    const set = new Set(stop.accommodations || []);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ accommodations: Array.from(set) });
  };

  return (
    <div
      className={classNames(
        "rounded-lg border p-4",
        highlighted
          ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Stop {index + 1}
        </h3>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>
          Remove stop
        </button>
      </div>

      {/* Top row: Country + country-level dates */}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CountryInput value={stop.country} onChange={(val) => onChange({ country: val })} />

        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival *</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={stop.arrival}
            onChange={(e) => onChange({ arrival: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure *</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={stop.departure}
            onChange={(e) => onChange({ departure: e.target.value })}
          />
        </div>
      </div>

      {/* Cities list */}
      <div className="mt-4">
        {/* Header row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">City</label>
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">Arrival</label>
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">Departure</label>
          </div>
          <div />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {normalizedCities.map((row, i) => {
            const listId = `city-list-${stop.id}-${i}`;
            return (
              <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* City + datalist */}
                <div className="w-full">
                  <input
                    type="text"
                    list={listId}
                    placeholder="Start typing or select city…"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    value={row.name}
                    onChange={(e) => setCityName(i, e.target.value)}
                  />
                  <datalist id={listId}>
                    {(cityOptions || []).map((opt) => (
                      <option
                        key={`${opt.name}-${opt.latitude}-${opt.longitude}`}
                        value={opt.name}
                      />
                    ))}
                  </datalist>
                </div>

                {/* Arrival */}
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  value={row.arrival}
                  onChange={(e) => setCityArrival(i, e.target.value)}
                  aria-label="City arrival date"
                />

                {/* Departure */}
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  value={row.departure}
                  onChange={(e) => setCityDeparture(i, e.target.value)}
                  aria-label="City departure date"
                />

                {/* Remove city */}
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => removeCity(i)}
                    className="w-full sm:w-auto rounded-lg px-3 py-2 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addCity}
            className="rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition mt-2"
          >
            + Add another city
          </button>
        </div>
      </div>

      {/* Accommodation */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Accommodation (select one or more)
        </label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <label
                key={opt}
                htmlFor={id}
                className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
                  checked={checked}
                  onChange={() => toggleAccommodation(opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes("Other") && (
          <div className="mt-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              Other (describe)
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={stop.accommodationOther}
              onChange={(e) => onChange({ accommodationOther: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Exposures */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Activities / Exposures
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Vector-borne */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Vector-borne
            </legend>
            <ExposureCheck
              label="Mosquito bites"
              checked={!!exp.mosquito}
              details={exp.mosquitoDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })}
            />
            <ExposureCheck
              label="Tick bites"
              checked={!!exp.tick}
              details={exp.tickDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })}
            />
            <div className="space-y-1">
              <label className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
                  checked={!!exp.vectorOtherEnabled}
                  onChange={(e) =>
                    onChange({ exposures: { ...exp, vectorOtherEnabled: e.target.checked } })
                  }
                />
                <span>Other vector</span>
              </label>
              {exp.vectorOtherEnabled && (
                <>
                  <input
                    type="text"
                    placeholder="Other vector (e.g., sandflies)"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                    value={exp.vectorOther || ""}
                    onChange={(e) => onChange({ exposures: { ...exp, vectorOther: e.target.value } })}
                  />
                  <input
                    type="text"
                    placeholder="Please provide more details."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                    value={exp.vectorOtherDetails || ""}
                    onChange={(e) =>
                      onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })
                    }
                  />
                </>
              )}
            </div>
          </fieldset>

          {/* Water / Environment */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Water / Environment
            </legend>
            <ExposureCheck
              label="Freshwater contact"
              checked={!!exp.freshwater}
              details={exp.freshwaterDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })}
            />
            <ExposureCheck
              label="Visited caves or mines (if yes, any contact with bats or bat droppings?)"
              checked={!!exp.cavesMines}
              details={exp.cavesMinesDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })}
            />
            <ExposureCheck
              label="Rural / forest stay"
              checked={!!exp.ruralForest}
              details={exp.ruralForestDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })}
            />
            <ExposureCheck
              label="Went hiking in forest, bush or woodlands"
              checked={!!exp.hikingWoodlands}
              details={exp.hikingWoodlandsDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })}
            />
          </fieldset>

          {/* Animal & Procedures */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Animal & Procedures
            </legend>
            <ExposureCheck
              label="Animal contact"
              checked={!!exp.animalContact}
              details={exp.animalContactDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })}
            />
            <ExposureCheck
              label="Animal bite / scratch"
              checked={!!exp.animalBiteScratch}
              details={exp.animalBiteScratchDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })}
            />
            <ExposureCheck
              label="Bushmeat consumption"
              checked={!!exp.bushmeat}
              details={exp.bushmeatDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })}
            />
            <ExposureCheck
              label="Needles / tattoos / piercings"
              checked={!!exp.needlesTattoos}
              details={exp.needlesTattoosDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })}
            />
            <ExposureCheck
              label="Safari / wildlife viewing"
              checked={!!exp.safariWildlife}
              details={exp.safariWildlifeDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })}
            />
          </fieldset>

          {/* Food & Water */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Food & Water
            </legend>
            <ExposureCheck
              label="Street food"
              checked={!!exp.streetFood}
              details={exp.streetFoodDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })}
            />
            <ExposureCheck
              label="Drank untreated water"
              checked={!!exp.untreatedWater}
              details={exp.untreatedWaterDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })}
            />
            <ExposureCheck
              label="Undercooked food"
              checked={!!exp.undercookedFood}
              details={exp.undercookedFoodDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })}
            />
            <ExposureCheck
              label="Undercooked seafood"
              checked={!!exp.undercookedSeafood}
              details={exp.undercookedSeafoodDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })}
            />
            <ExposureCheck
              label="Unpasteurised milk"
              checked={!!exp.unpasteurisedMilk}
              details={exp.unpasteurisedMilkDetails}
              onToggle={(v) => onChange({ exposures: { ...exp, unpasteurisedMilk: v } })}
              onDetails={(v) => onChange({ exposures: { ...exp, unpasteurisedMilkDetails: v } })}
            />
          </fieldset>

          {/* Institutional / Social */}
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Institutional / Social
            </legend>
            <div className="grid sm:grid-cols-2 gap-2">
              <ExposureCheck
                label="Attended funerals"
                checked={!!exp.funerals}
                details={exp.funeralsDetails}
                onToggle={(v) => onChange({ exposures: { ...exp, funerals: v } })}
                onDetails={(v) => onChange({ exposures: { ...exp, funeralsDetails: v } })}
              />
              <ExposureCheck
                label="Sick contacts (including TB)"
                checked={!!exp.sickContacts}
                details={exp.sickContactsDetails}
                onToggle={(v) => onChange({ exposures: { ...exp, sickContacts: v } })}
                onDetails={(v) => onChange({ exposures: { ...exp, sickContactsDetails: v } })}
              />
              <ExposureCheck
                label="Healthcare facility contact"
                checked={!!exp.healthcareFacility}
                details={exp.healthcareFacilityDetails}
                onToggle={(v) => onChange({ exposures: { ...exp, healthcareFacility: v } })}
                onDetails={(v) => onChange({ exposures: { ...exp, healthcareFacilityDetails: v } })}
              />
              <ExposureCheck
                label="Prison contact"
                checked={!!exp.prison}
                details={exp.prisonDetails}
                onToggle={(v) => onChange({ exposures: { ...exp, prison: v } })}
                onDetails={(v) => onChange({ exposures: { ...exp, prisonDetails: v } })}
              />
              <ExposureCheck
                label="Refugee camp contact"
                checked={!!exp.refugeeCamp}
                details={exp.refugeeCampDetails}
                onToggle={(v) => onChange({ exposures: { ...exp, refugeeCamp: v } })}
                onDetails={(v) => onChange({ exposures: { ...exp, refugeeCampDetails: v } })}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Other exposure (free-text)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                value={exp.otherText || ""}
                onChange={(e) => onChange({ exposures: { ...exp, otherText: e.target.value } })}
              />
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

// ===== Layover Card =====
function LayoverCard({ layover, onChange, onRemove, highlighted }) {
  const countryISO2 = useMemo(
    () => getIsoFromCountryName(layover.country),
    [layover.country]
  );
  const cityOptions = useMemo(
    () => (countryISO2 ? City.getCitiesOfCountry(countryISO2) || [] : []),
    [countryISO2]
  );

  return (
    <div
      className={classNames(
        "rounded-lg border p-4",
        highlighted
          ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layover</h4>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>
          Remove layover
        </button>
      </div>

      {/* Country / City / Start / End */}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Country */}
        <CountryInput
          value={layover.country}
          onChange={(val) => onChange({ country: val, city: "" })}
        />

        {/* City */}
        <div className="w-full">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
          <input
            type="text"
            list={`layover-city-options-${layover.id}`}
            placeholder="Start typing or select city…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.city || ""}
            onChange={(e) => onChange({ city: e.target.value })}
          />
          <datalist id={`layover-city-options-${layover.id}`}>
            {(cityOptions || []).map((opt) => (
              <option
                key={`${opt.name}-${opt.latitude}-${opt.longitude}`}
                value={opt.name}
              />
            ))}
          </datalist>
        </div>

        {/* Start */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </div>

        {/* End */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.end}
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </div>
      </div>

      {/* Left airport + activities */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
            Did you leave the airport?
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.leftAirport}
            onChange={(e) => onChange({ leftAirport: e.target.value })}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        {layover.leftAirport === "yes" && (
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              Please describe any activities undertaken
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={layover.activitiesText || ""}
              onChange={(e) => onChange({ activitiesText: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Small helpers =====
function Checkbox({ label, checked, onChange }) {
  const id = useMemo(() => uid(), []);
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300"
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ExposureCheck({ label, checked, details, onToggle, onDetails }) {
  const id = useMemo(() => uid(), []);
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300"
      >
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
          checked={!!checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {checked && (
        <input
          type="text"
          placeholder="Please provide more details."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          value={details || ""}
          onChange={(e) => onDetails(e.target.value)}
        />
      )}
    </div>
  );
}

// ===== Timeline =====
function TimelineVertical({ events }) {
  if (!events?.length)
    return <p className="text-sm text-slate-600 dark:text-slate-400">No events yet.</p>;

  return (
    <ol className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-2 pl-4 space-y-4">
      {events.map((ev, i) => {
        if (ev.type === "stop") {
          const s = ev.stop;
          return (
            <li key={ev.stop.id}>
              <div className="absolute -left-[9px] mt-1.5 h-3 w-3 rounded-full bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]" />
              <div className="ml-4">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {s.country || "Unknown country"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {formatDMY(s.arrival)} – {formatDMY(s.departure)}
                </p>
              </div>
            </li>
          );
        }

        if (ev.type === "layover") {
          const l = ev.layover;
          const label =
            ev.position === "before-stop"
              ? "Layover before trip"
              : ev.position === "after-stop"
              ? "Layover after trip"
              : "Layover between countries";
          return (
            <li key={l.id}>
              <div className="absolute -left-[7px] mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              <div className="ml-4 text-xs text-slate-700 dark:text-slate-300">
                <strong>{label}:</strong>{" "}
                {l.city ? `${l.city}, ` : ""}
                {l.country || "Unknown country"} (
                {formatDMY(l.start)}–{formatDMY(l.end)})
              </div>
            </li>
          );
        }

        return null;
      })}
    </ol>
  );
}

// ===== Text summary builder =====
function buildSummaryFromEvents(state, events) {
  let html = "";
  let text = "";

  if (!events?.length) {
    return {
      summaryHtml: "<p>No travel data available.</p>",
      summaryTextPlain: "No travel data available.",
    };
  }

  const trips = state.trips || [];
  html += `<p><strong>Travel History Summary</strong></p>`;
  text += "Travel History Summary\n\n";

  trips.forEach((trip, idx) => {
    const tripHeader =
      trips.length > 1
        ? `<p><strong>Trip ${idx + 1}</strong> (${trip.purpose || "Purpose not specified"})</p>`
        : `<p><strong>Trip details:</strong> (${trip.purpose || "Purpose not specified"})</p>`;
    html += tripHeader;
    text += trips.length > 1
      ? `Trip ${idx + 1} (${trip.purpose || "Purpose not specified"})\n`
      : `Trip details: (${trip.purpose || "Purpose not specified"})\n`;

    const stops = trip.stops || [];
    stops.forEach((stop, sIdx) => {
      const countryLine = `<p style="margin-top:0.8em;"><strong>Country ${sIdx + 1}:</strong> ${stop.country || "Unknown"}</p>`;
      html += countryLine;
      text += `\nCountry ${sIdx + 1}: ${stop.country || "Unknown"}\n`;

      // Cities
      const cities = (stop.cities || [])
        .map((c) => c.name)
        .filter(Boolean);
      if (cities.length) {
        html += `<ul>${cities.map((c) => `<li>${c}</li>`).join("")}</ul>`;
        text += "Cities / regions:\n" + cities.map((c) => `• ${c}`).join("\n") + "\n";
      }

      // Accommodation
      const acc =
        (stop.accommodations || []).join(", ") ||
        stop.accommodationOther ||
        "Not specified";
      html += `<p>Accommodation: ${acc}</p>`;
      text += `Accommodation: ${acc}\n`;

      // Exposures
      const exposuresList = [];
      const exp = stop.exposures || {};
      Object.entries(exp).forEach(([key, val]) => {
        if (typeof val === "boolean" && val) {
          const detailsKey = `${key}Details`;
          const details = exp[detailsKey] || "";
          exposuresList.push(
            `${cap(key.replace(/([A-Z])/g, " $1"))}${details ? ` — ${details}` : ""}`
          );
        }
      });
      if (exposuresList.length) {
        html += `<p>Exposures:</p><ul>${exposuresList
          .map((e) => `<li>${e}</li>`)
          .join("")}</ul>`;
        text +=
          "Exposures:\n" + exposuresList.map((e) => `• ${e}`).join("\n") + "\n";
      }
    });

    // Layovers
    if (trip.layovers?.length) {
      html += `<p><strong>Layovers:</strong></p><ul>`;
      text += "Layovers:\n";
      trip.layovers.forEach((l) => {
        html += `<li>${l.city ? `${l.city}, ` : ""}${l.country || "Unknown"} (${formatDMY(
          l.start
        )}–${formatDMY(l.end)})</li>`;
        text += `• ${l.city ? `${l.city}, ` : ""}${l.country || "Unknown"} (${formatDMY(
          l.start
        )}–${formatDMY(l.end)})\n`;
      });
      html += "</ul>";
    }
  });

  return { summaryHtml: html, summaryTextPlain: text.trim() };
}

// ===== Exports for utilities =====
export {
  TimelineVertical,
  buildSummaryFromEvents,
  formatDMY,
  parseDate,
  cap,
};
