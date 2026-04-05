import { useMemo } from 'react';
import { City } from "country-state-city";
import { clsx } from 'clsx';
import {
  CSC_COUNTRIES,
  COMPANION_GROUPS,
  COMPANION_WELL_OPTIONS,
  VACCINE_STATUS_OPTIONS,
  VACCINE_SUGGESTIONS,
  MALARIA_STATUS_OPTIONS,
  MALARIA_DRUGS,
  ADHERENCE_OPTIONS
} from '../../_lib/constants';
import { getIsoFromCountryName } from '../../_lib/utils';
import { MapPin, Users, Syringe, Pill, Trash, Plus, Navigation, Briefcase } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import MultiSelectTags from '../ui/MultiSelectTags';
import SimpleSelect from '../ui/SimpleSelect';
import SmoothReveal from '../ui/SmoothReveal';
import StopCard from './StopCard';
import LayoverCard from './LayoverCard';

// --- SHARED STYLE TOKENS ---
const CARD_BASE = "rounded-xl border border-slate-200 bg-white shadow-sm";
const LABEL = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
const SUB_LABEL = "block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5";
const INPUT_STYLES = "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-slate-400 transition-colors";
const SECTION_CARD = "p-5 rounded-xl border border-slate-200 bg-slate-50";

const toggleBtn = (active) => clsx(
  "px-4 py-2 text-xs font-semibold rounded-lg border transition-colors",
  active
    ? "bg-brand/10 border-brand text-brand"
    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
);

const BTN_ADD = "bg-white border border-slate-300 text-slate-600 hover:border-brand/50 hover:text-brand px-3.5 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors";
const BTN_REMOVE = "p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors";

export default function TripCard({
  trip, index, totalTrips, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip,
  highlight, setItemRef, innerRef
}) {
  const setMalaria = (patch) => {
    const next = { ...trip.malaria, ...patch };
    if (next.indication !== 'Taken') { next.drug = 'None'; next.adherence = ''; }
    updateTrip(trip.id, { malaria: next });
  };

  const setVaccines = (patch) => {
    const next = { ...trip.vaccines, ...patch };
    if (next.status !== 'Taken') { next.details = []; }
    updateTrip(trip.id, { vaccines: next });
  };

  const updateCompanions = (patch) => {
    updateTrip(trip.id, { companions: { ...trip.companions, ...patch } });
  };

  const originISO2 = useMemo(() => getIsoFromCountryName(trip.originCountry), [trip.originCountry]);
  const originCityNames = useMemo(() => {
    const list = originISO2 ? (City.getCitiesOfCountry(originISO2) || []) : [];
    const names = Array.from(new Set(list.map((c) => c.name)));
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return names;
  }, [originISO2]);

  const headerTitle = totalTrips > 1 ? `Trip ${index + 1}` : "Trip Information";

  return (
    <div ref={innerRef} className={CARD_BASE}>

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand/10 text-brand">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{headerTitle}</h2>
            <p className="text-xs text-slate-400">Logistics and risk factors</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className={BTN_ADD}>
            <Plus className="w-3.5 h-3.5" /> Destination
          </button>
          <button type="button" onClick={() => addLayover(trip.id)} className={BTN_ADD}>
            <Plus className="w-3.5 h-3.5" /> Layover
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button type="button" onClick={() => removeTrip(trip.id)} className={BTN_REMOVE}>
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ORIGIN */}
        <div className={SECTION_CARD}>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <MapPin className="w-3.5 h-3.5" /> Origin Point
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={SUB_LABEL}>Country</label>
              <SearchableSelect
                value={trip.originCountry}
                onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })}
                options={CSC_COUNTRIES.map(c => c.name)}
                placeholder="Select country..."
              />
            </div>
            <div>
              <label className={SUB_LABEL}>City</label>
              <SearchableSelect
                value={trip.originCity}
                onChange={(val) => updateTrip(trip.id, { originCity: val })}
                options={originCityNames}
                placeholder="Select city..."
                allowCustom={true}
              />
            </div>
          </div>
        </div>

        {/* META GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PURPOSE */}
          <div className={SECTION_CARD}>
            <label className={clsx(LABEL, "flex items-center gap-2")}>
              <Briefcase className="w-3.5 h-3.5" /> Travel Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. VFR, Business, Tourism"
              className={INPUT_STYLES}
              value={trip.purpose}
              onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })}
            />
          </div>

          {/* COMPANIONS */}
          <div className={SECTION_CARD}>
            <label className={clsx(LABEL, "flex items-center gap-2")}>
              <Users className="w-3.5 h-3.5" /> Companions
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMPANION_GROUPS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = { group: opt };
                    if (opt === 'Alone') {
                      next.companionsWell = 'unknown';
                      next.companionsUnwellDetails = '';
                      next.otherText = '';
                    }
                    updateCompanions(next);
                  }}
                  className={toggleBtn(trip.companions.group === opt)}
                >
                  {opt}
                </button>
              ))}
            </div>

            <SmoothReveal show={trip.companions.group === 'Other'}>
              <div className="mb-3">
                <input
                  type="text"
                  className={INPUT_STYLES}
                  placeholder="Describe companions..."
                  value={trip.companions.otherText}
                  onChange={(e) => updateCompanions({ otherText: e.target.value })}
                />
              </div>
            </SmoothReveal>

            <SmoothReveal show={trip.companions.group !== 'Alone'}>
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <div>
                  <label className={SUB_LABEL}>Are they well?</label>
                  <div className="flex gap-2">
                    {COMPANION_WELL_OPTIONS.map((opt) => {
                      const val = opt.toLowerCase();
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateCompanions({ companionsWell: val, companionsUnwellDetails: val === 'no' ? trip.companions.companionsUnwellDetails : '' })}
                          className={toggleBtn(trip.companions.companionsWell === val)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <SmoothReveal show={trip.companions.companionsWell === 'no'}>
                  <input
                    type="text"
                    placeholder="Describe symptoms..."
                    className={INPUT_STYLES}
                    value={trip.companions.companionsUnwellDetails}
                    onChange={(e) => updateCompanions({ companionsUnwellDetails: e.target.value })}
                  />
                </SmoothReveal>
              </div>
            </SmoothReveal>
          </div>

          {/* VACCINES */}
          <div className={SECTION_CARD}>
            <label className={clsx(LABEL, "flex items-center gap-2")}>
              <Syringe className="w-3.5 h-3.5" /> Pre-Travel Vaccines
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {VACCINE_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVaccines({ status: opt })}
                  className={toggleBtn((trip.vaccines?.status || 'unknown') === opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <SmoothReveal show={trip.vaccines?.status === 'Taken'}>
              <div className="border-t border-slate-200 pt-3">
                <label className={SUB_LABEL}>Select Vaccines</label>
                <MultiSelectTags
                  value={trip.vaccines.details || []}
                  onChange={(val) => setVaccines({ details: val })}
                  options={VACCINE_SUGGESTIONS}
                  placeholder="Search vaccines..."
                />
              </div>
            </SmoothReveal>
          </div>

          {/* MALARIA */}
          <div className={SECTION_CARD}>
            <label className={clsx(LABEL, "flex items-center gap-2")}>
              <Pill className="w-3.5 h-3.5" /> Malaria Prophylaxis
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {MALARIA_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMalaria({ indication: opt })}
                  className={toggleBtn(trip.malaria.indication === opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <SmoothReveal show={trip.malaria.indication === 'Taken'}>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className={SUB_LABEL}>Drug</label>
                  <SimpleSelect value={trip.malaria.drug} onChange={(val) => setMalaria({ drug: val })} options={MALARIA_DRUGS} />
                </div>
                <div>
                  <label className={SUB_LABEL}>Adherence</label>
                  <SimpleSelect value={trip.malaria.adherence} onChange={(val) => setMalaria({ adherence: val })} options={ADHERENCE_OPTIONS} />
                </div>
              </div>
            </SmoothReveal>
          </div>
        </div>

        {/* STOPS */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-grow" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">Itinerary</span>
            <div className="h-px bg-slate-200 flex-grow" />
          </div>
          {trip.stops.map((stop, sIdx) => (
            <StopCard
              key={stop.id}
              innerRef={setItemRef(stop.id)}
              stop={stop}
              index={sIdx}
              totalStops={trip.stops.length}
              onChange={(patch) => updateStop(trip.id, stop.id, patch)}
              onRemove={() => removeStop(trip.id, stop.id)}
              highlighted={highlight.stopIds.has(stop.id)}
            />
          ))}
        </div>

        {/* LAYOVERS */}
        {trip.layovers.length > 0 && (
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Transit / Layovers
            </h3>
            <div className="space-y-3">
              {trip.layovers.map((l) => (
                <LayoverCard
                  key={l.id}
                  innerRef={setItemRef(l.id)}
                  layover={l}
                  onChange={(patch) => updateLayover(trip.id, l.id, patch)}
                  onRemove={() => removeLayover(trip.id, l.id)}
                  highlighted={highlight.layoverIds.has(l.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
