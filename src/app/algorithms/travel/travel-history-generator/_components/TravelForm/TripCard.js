import { useMemo } from 'react';
import { City } from "country-state-city";
import { clsx } from 'clsx';
// We retain logic constants but will ignore the style constants to force the new look
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
import { MapPin, Users, Syringe, Pill, Trash, Plus, Navigation } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import MultiSelectTags from '../ui/MultiSelectTags';
import SimpleSelect from '../ui/SimpleSelect';
import SmoothReveal from '../ui/SmoothReveal';
import StopCard from './StopCard';
import LayoverCard from './LayoverCard';

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

  const headerTitle = totalTrips > 1 ? `TRIP_0${index + 1}` : "TRIP_DETAILS";

  // --- STYLES ---
  const CARD_BASE = "rounded-xl border border-slate-700 bg-slate-800/40 p-6";
  const LABEL = "block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2";
  const SUB_LABEL = "block text-[10px] font-mono text-slate-500 uppercase mb-1";
  
  const INPUT_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-slate-600 transition-colors font-sans";
  
  const BTN_TOGGLE_BASE = "px-3 py-1.5 text-[11px] font-mono uppercase tracking-wide rounded-lg border transition-all duration-200";
  const BTN_TOGGLE_ACTIVE = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
  const BTN_TOGGLE_INACTIVE = "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300";

  const BTN_ACTION = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wide border transition-all";
  const BTN_ADD = "bg-slate-900 border-slate-700 text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono font-bold tracking-wide uppercase";
  const BTN_REMOVE = "bg-transparent border-transparent text-slate-500 hover:text-red-400";

  return (
    <div ref={innerRef} className={CARD_BASE}>
      
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6 border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded bg-emerald-500/10 border border-emerald-500/50 text-emerald-500">
             <Navigation className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-200 font-mono tracking-widest">{headerTitle}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className={BTN_ADD}>
            <Plus className="w-3 h-3" /> Destination
          </button>
          <button type="button" onClick={() => addLayover(trip.id)} className={BTN_ADD}>
            <Plus className="w-3 h-3" /> Layover
          </button>
          <button type="button" onClick={() => removeTrip(trip.id)} className={BTN_REMOVE}>
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ORIGIN SECTION */}
      <div className="mb-8">
        <label className={LABEL}>Origin Point</label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={SUB_LABEL}>Country</label>
            <div className="relative group">
              <SearchableSelect 
                value={trip.originCountry} 
                onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })} 
                options={CSC_COUNTRIES.map(c => c.name)}
                placeholder="Select country..."
              />
            </div>
          </div>
          <div className="w-full">
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

      {/* META DATA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* REASON */}
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/30">
          <label className={LABEL}>Travel Purpose</label>
          <input 
            type="text" 
            placeholder="e.g. VFR, Business, Tourism" 
            className={INPUT_STYLES} 
            value={trip.purpose} 
            onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} 
          />
        </div>

        {/* COMPANIONS */}
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/30">
          <label className={clsx(LABEL, "flex items-center gap-2")}>
            <Users className="w-3 h-3" /> Companions
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
                className={clsx(
                  BTN_TOGGLE_BASE,
                  trip.companions.group === opt ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE
                )}
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
            <div className="grid gap-3 border-t border-slate-700 pt-3">
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
                        className={clsx(
                          BTN_TOGGLE_BASE,
                          trip.companions.companionsWell === val ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SmoothReveal show={trip.companions.companionsWell === 'no'}>
                <div className="mt-2">
                  <input 
                    type="text" 
                    placeholder="Describe symptoms..."
                    className={INPUT_STYLES}
                    value={trip.companions.companionsUnwellDetails}
                    onChange={(e) => updateCompanions({ companionsUnwellDetails: e.target.value })}
                  />
                </div>
              </SmoothReveal>
            </div>
          </SmoothReveal>
        </div>

        {/* VACCINES */}
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/30">
          <label className={clsx(LABEL, "flex items-center gap-2")}>
            <Syringe className="w-3 h-3" /> Pre-Travel Vaccines
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {VACCINE_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setVaccines({ status: opt })}
                className={clsx(
                   BTN_TOGGLE_BASE,
                   (trip.vaccines?.status || 'unknown') === opt ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.vaccines?.status === 'Taken'}>
             <div className="border-t border-slate-700 pt-3">
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
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/30">
          <label className={clsx(LABEL, "flex items-center gap-2")}>
            <Pill className="w-3 h-3" /> Malaria Prophylaxis
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {MALARIA_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setMalaria({ indication: opt })}
                className={clsx(
                  BTN_TOGGLE_BASE,
                  trip.malaria.indication === opt ? BTN_TOGGLE_ACTIVE : BTN_TOGGLE_INACTIVE
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.malaria.indication === 'Taken'}>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
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

      {/* STOPS SECTION */}
      <div className="mt-8 space-y-6">
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

      {/* LAYOVERS SECTION */}
      {trip.layovers.length > 0 && (
        <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest mb-4">Transit / Layovers</h3>
          <div className="space-y-4">
            {trip.layovers.map((l) => (
              <LayoverCard key={l.id} innerRef={setItemRef(l.id)} layover={l} onChange={(patch) => updateLayover(trip.id, l.id, patch)} onRemove={() => removeLayover(trip.id, l.id)} highlighted={highlight.layoverIds.has(l.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
