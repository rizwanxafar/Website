import { useMemo } from 'react';
import { City } from "country-state-city";
import { clsx } from 'clsx';
import { classNames, getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES, ACCOMMODATION_OPTIONS } from '../../_lib/constants';
import { MapPin, Calendar, Home, Activity, Trash, Plus } from 'lucide-react'; 
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

  const headerTitle = totalStops > 1 ? `DESTINATION_0${index + 1}` : "DESTINATION";

  // --- STYLES ---
  const CARD_BASE = clsx(
    "rounded-lg border p-5 transition-colors duration-300",
    highlighted 
      ? "border-red-500/50 bg-red-500/10" 
      : "border-slate-700 bg-slate-800/40"
  );
  const LABEL = "block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2";
  const SUB_LABEL = "block text-[10px] font-mono text-slate-500 uppercase mb-1";
  const INPUT_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-slate-600 transition-colors font-sans";

  return (
    <div ref={innerRef} className={CARD_BASE}>
      
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6 border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-slate-200">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold font-mono tracking-widest">{headerTitle}</h3>
        </div>
        <button 
          type="button" 
          onClick={onRemove} 
          className="text-[10px] font-mono text-slate-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          <Trash className="w-3 h-3" /> Remove
        </button>
      </div>

      {/* COUNTRY & DATES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="w-full">
           <label className={LABEL}>Country</label>
           <SearchableSelect 
              value={stop.country} 
              onChange={(val) => onChange({ country: val })} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country..."
           />
        </div>
        <div>
          <label className={LABEL}>Arrival *</label>
          <ResponsiveDatePicker value={stop.arrival} onChange={(val) => onChange({ arrival: val })} />
        </div>
        <div>
          <label className={LABEL}>Departure *</label>
          <ResponsiveDatePicker value={stop.departure} onChange={(val) => onChange({ departure: val })} />
        </div>
      </div>

      {/* CITIES */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 mb-6">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-4")}>
          <Home className="w-3 h-3" /> Cities Visited
        </label>
        
        <div className="space-y-3">
          {normalizedCities.map((row, i) => (
            <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
              <div className="w-full">
                <label className={SUB_LABEL}>City Name</label>
                <SearchableSelect 
                  value={row.name} 
                  onChange={(val) => setCityName(i, val)} 
                  options={cityOptions.map(c => c.name)}
                  placeholder="Search city..."
                  allowCustom={true} 
                />
              </div>
              <div>
                <label className={SUB_LABEL}>Arrival (Optional)</label>
                <ResponsiveDatePicker value={row.arrival} onChange={(val) => setCityArrival(i, val)} />
              </div>
              <div>
                <label className={SUB_LABEL}>Departure (Optional)</label>
                <ResponsiveDatePicker value={row.departure} onChange={(val) => setCityDeparture(i, val)} />
              </div>
              <button 
                type="button" 
                onClick={() => removeCity(i)} 
                className="h-[38px] w-full sm:w-auto px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/50 transition-colors flex items-center justify-center"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addCity} 
            className="mt-2 text-[10px] font-mono font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 uppercase tracking-wide"
          >
            <Plus className="w-3 h-3" /> Add_City
          </button>
        </div>
      </div>

      {/* ACCOMMODATION */}
      <div className="mb-6">
        <label className={LABEL}>Accommodation Type</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label 
                key={opt} 
                htmlFor={id} 
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                  checked 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                    : "bg-slate-800/40 border-slate-700 text-slate-500 hover:bg-slate-700/50"
                )}
              >
                <input 
                  id={id} 
                  type="checkbox" 
                  className="appearance-none h-4 w-4 rounded border border-slate-600 bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 focus:ring-0 focus:ring-offset-0" 
                  checked={checked} 
                  onChange={() => toggleAccommodation(opt)} 
                />
                <span className="text-xs font-mono uppercase">{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-2">
            <input 
              type="text" 
              className={INPUT_STYLES} 
              placeholder="Describe accommodation..."
              value={stop.accommodationOther} 
              onChange={(e) => onChange({ accommodationOther: e.target.value })} 
            />
          </div>
        )}
      </div>

      {/* EXPOSURES */}
      <div className="border-t border-slate-700 pt-6">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-4")}>
          <Activity className="w-3 h-3" /> Risk Exposures & Activities
        </label>
        <div className="p-1"> 
          <ExposureTagSystem exposures={exp} onChange={(newExp) => onChange({ exposures: newExp })} />
        </div>
      </div>
    </div>
  );
}
