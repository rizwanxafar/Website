import { useMemo } from 'react';
import { City } from "country-state-city";
import { classNames, getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES, LINKISH_SECONDARY, ACCOMMODATION_OPTIONS, TEXT_INPUT_CLASS, INPUT_BASE } from '../../_lib/constants';
import SearchableSelect from '../ui/SearchableSelect';
import ResponsiveDatePicker from '../ui/ResponsiveDatePicker';
import ExposureTagSystem from './ExposureTagSystem';

export default function StopCard({ stop, index, totalStops, onChange, onRemove, innerRef, highlighted }) {
  const exp = stop.exposures;
  const normalizedCities = (stop.cities || []).map((c) =>
    typeof c === 'string' ? { name: c || '', arrival: '', departure: '' } : { name: c?.name || '', arrival: c?.arrival || '', departure: c?.departure || '' }
  );
  
  const countryISO2 = useMemo(() => getIsoFromCountryName(stop.country), [stop.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? City.getCitiesOfCountry(countryISO2) : []; }, [countryISO2]);
  
  const commitCities = (next) => onChange({ cities: next });
  const setCityName = (i, name) => { const next = [...normalizedCities]; next[i] = { ...next[i], name }; commitCities(next); };
  const setCityArrival = (i, arrival) => { const next = [...normalizedCities]; next[i] = { ...next[i], arrival }; commitCities(next); };
  const setCityDeparture = (i, departure) => { const next = [...normalizedCities]; next[i] = { ...next[i], departure }; commitCities(next); };
  const addCity = () => { commitCities([...normalizedCities, { name: '', arrival: '', departure: '' }]); };
  const removeCity = (i) => { const next = [...normalizedCities]; next.splice(i, 1); if (next.length === 0) next.push({ name: '', arrival: '', departure: '' }); commitCities(next); };
  const toggleAccommodation = (value) => { const set = new Set(stop.accommodations || []); if (set.has(value)) set.delete(value); else set.add(value); onChange({ accommodations: Array.from(set) }); };

  const headerTitle = totalStops > 1 ? `Destination ${index + 1}` : "Destination";

  return (
    <div ref={innerRef} className={classNames("rounded-lg border p-4", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</h3>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove destination</button>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="w-full">
           <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
           <SearchableSelect 
              value={stop.country} 
              onChange={(val) => onChange({ country: val })} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
           />
        </div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival *</label><ResponsiveDatePicker value={stop.arrival} onChange={(val) => onChange({ arrival: val })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure *</label><ResponsiveDatePicker value={stop.departure} onChange={(val) => onChange({ departure: val })} /></div>
      </div>

      <div className="mt-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">City</label></div>
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">Arrival</label></div>
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">Departure</label></div>
        </div>
        <div className="space-y-2">
          {normalizedCities.map((row, i) => {
            return (
              <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="w-full">
                  <SearchableSelect 
                    value={row.name} 
                    onChange={(val) => setCityName(i, val)} 
                    options={cityOptions.map(c => c.name)}
                    placeholder="Search city"
                    allowCustom={true} 
                  />
                </div>
                <ResponsiveDatePicker value={row.arrival} onChange={(val) => setCityArrival(i, val)} />
                <ResponsiveDatePicker value={row.departure} onChange={(val) => setCityDeparture(i, val)} />
                <div className="flex"><button type="button" onClick={() => removeCity(i)} className="w-full sm:w-auto rounded-lg px-3 py-2 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition">Remove</button></div>
              </div>
            );
          })}
          <button type="button" onClick={addCity} className="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition text-slate-600 dark:text-slate-400">+ Add another city</button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">What sort of accommodation did they stay in?</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label key={opt} htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]" checked={checked} onChange={() => toggleAccommodation(opt)} />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (describe)</label>
            <div className={TEXT_INPUT_CLASS}>
              <input type="text" className={INPUT_BASE} value={stop.accommodationOther} onChange={(e) => onChange({ accommodationOther: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Did they have any of the following exposures or activities?</h4>
        <ExposureTagSystem exposures={exp} onChange={(newExp) => onChange({ exposures: newExp })} />
      </div>
    </div>
  );
}
