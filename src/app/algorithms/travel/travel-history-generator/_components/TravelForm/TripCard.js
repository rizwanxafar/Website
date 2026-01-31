import { useMemo } from 'react';
import { City } from "country-state-city";
import { clsx } from 'clsx';
import { CSC_COUNTRIES, SECTION_HEADING, BTN_PRIMARY, BTN_SECONDARY, TEXT_INPUT_CLASS, INPUT_BASE, COMPANION_GROUPS, COMPANION_WELL_OPTIONS, VACCINE_STATUS_OPTIONS, VACCINE_SUGGESTIONS, MALARIA_STATUS_OPTIONS, MALARIA_DRUGS, ADHERENCE_OPTIONS } from '../../_lib/constants';
import { getIsoFromCountryName } from '../../_lib/utils';
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

  const headerTitle = totalTrips > 1 ? `Trip ${index + 1}` : "Trip details";

  return (
    <div ref={innerRef} className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className={SECTION_HEADING}>{headerTitle}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className={BTN_PRIMARY}>+ Add destination</button>
          <button type="button" onClick={() => addLayover(trip.id)} className={BTN_PRIMARY}>+ Add layover</button>
          <button type="button" onClick={() => removeTrip(trip.id)} className={BTN_SECONDARY}>Remove trip</button>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Travelling from</label>
        <div className="mt-2 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
            <SearchableSelect 
              value={trip.originCountry} 
              onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
            <SearchableSelect 
              value={trip.originCity} 
              onChange={(val) => updateTrip(trip.id, { originCity: val })} 
              options={originCityNames}
              placeholder="Search city"
              allowCustom={true} 
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
        
        {/* TOP LEFT: Reason */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">What was the reason for travel?</label>
          <div className={TEXT_INPUT_CLASS}>
            <input 
              type="text" 
              placeholder="Work, VFR, tourism, etc." 
              className={INPUT_BASE} 
              value={trip.purpose} 
              onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} 
            />
          </div>
        </div>

        {/* TOP RIGHT: Companions */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Who did they travel with?</label>
          <div className="flex flex-wrap gap-2">
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
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  trip.companions.group === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          <SmoothReveal show={trip.companions.group === 'Other'}>
            <div className="mt-2">
              <div className={TEXT_INPUT_CLASS}>
                <input 
                  type="text" 
                  className={INPUT_BASE}
                  placeholder="Describe companions..."
                  value={trip.companions.otherText}
                  onChange={(e) => updateCompanions({ otherText: e.target.value })}
                />
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal show={trip.companions.group !== 'Alone'}>
            <div className="mt-2 grid gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Are they well?</label>
                <div className="flex gap-2">
                  {COMPANION_WELL_OPTIONS.map((opt) => {
                    const val = opt.toLowerCase(); 
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateCompanions({ companionsWell: val, companionsUnwellDetails: val === 'no' ? trip.companions.companionsUnwellDetails : '' })}
                        className={clsx(
                          "px-2 py-1 text-xs font-medium rounded border transition",
                          trip.companions.companionsWell === val
                            ? "bg-[hsl(var(--brand))] text-white border-transparent"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SmoothReveal show={trip.companions.companionsWell === 'no'}>
                <div>
                  <div className={TEXT_INPUT_CLASS}>
                    <input 
                      type="text" 
                      placeholder="Details (symptoms, etc.)"
                      className={INPUT_BASE}
                      value={trip.companions.companionsUnwellDetails}
                      onChange={(e) => updateCompanions({ companionsUnwellDetails: e.target.value })}
                    />
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </SmoothReveal>
        </div>

        {/* BOTTOM LEFT: Vaccines */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Did they have any pre-travel vaccinations?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {VACCINE_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setVaccines({ status: opt })}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  (trip.vaccines?.status || 'unknown') === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.vaccines?.status === 'Taken'}>
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Details (Select multiple or type custom)</label>
               <MultiSelectTags 
                 value={trip.vaccines.details || []}
                 onChange={(val) => setVaccines({ details: val })}
                 options={VACCINE_SUGGESTIONS}
                 placeholder="Select or type..."
               />
             </div>
          </SmoothReveal>
        </div>

        {/* BOTTOM RIGHT: Malaria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Did they take any malaria prophylaxis?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {MALARIA_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setMalaria({ indication: opt })}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  trip.malaria.indication === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.malaria.indication === 'Taken'}>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Drug</label>
                <SimpleSelect value={trip.malaria.drug} onChange={(val) => setMalaria({ drug: val })} options={MALARIA_DRUGS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adherence</label>
                <SimpleSelect value={trip.malaria.adherence} onChange={(val) => setMalaria({ adherence: val })} options={ADHERENCE_OPTIONS} />
              </div>
            </div>
          </SmoothReveal>
        </div>
      </div>

      <div className="mt-6 space-y-6">
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

      {trip.layovers.length > 0 && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Layovers</h3>
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
