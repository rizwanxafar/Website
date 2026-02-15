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

  const headerTitle = totalStops > 1 ? `Destination 0${index + 1}` : "Destination";

  // --- STYLES ---
  const CARD_BASE = clsx(
    "rounded-xl border p-8 transition-all duration-300 shadow-sm",
    highlighted 
      ? "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/30" 
      : "border-slate-700 bg-slate-800/20"
  );
  const LABEL = "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5";
  const SUB_LABEL = "block text-xs font-medium text-slate-300 uppercase mb-2";
  const INPUT_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder:text-slate-500 transition-colors shadow-sm";

  return (
    <div ref={innerRef} className={CARD_BASE}>
      
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-8 border-b border-slate-700/50 pb-5">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
             <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">{headerTitle}</h3>
        </div>
        <button 
          type="button" 
          onClick={onRemove} 
          className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono text-slate-500 hover:text-red-400 hover:bg-red-500/10 uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <Trash className="w-4 h-4" /> Remove
        </button>
      </div>

      {/* COUNTRY & DATES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
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
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-700/60 mb-8 shadow-inner">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-6 text-slate-300")}>
          <Home className="w-4 h-4 text-emerald-500" /> Cities Visited
        </label>
        
        <div className="space-y-6">
          {normalizedCities.map((row, i) => (
            <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-6 items-end pb-6 border-b border-slate-800 last:border-0 last:pb-0">
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
                className="h-[46px] w-full sm:w-auto px-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors flex items-center justify-center"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addCity} 
            className="mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-emerald-500 flex items-center gap-2 uppercase tracking-wide transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" /> Add_City
          </button>
        </div>
      </div>

      {/* ACCOMMODATION */}
      <div className="mb-8">
        <label className={LABEL}>Accommodation Type</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label 
                key={opt} 
                htmlFor={id} 
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all shadow-sm group select-none",
                  checked 
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                    : "bg-slate-800/40 border-slate-700 hover:bg-slate-800/80"
                )}
              >
                <input 
                  id={id} 
                  type="checkbox" 
                  className="appearance-none h-5 w-5 rounded border border-slate-600 bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors" 
                  checked={checked} 
                  onChange={() => toggleAccommodation(opt)} 
                />
                <span className={clsx("text-sm font-medium transition-colors", checked ? "text-emerald-400" : "text-slate-300 group-hover:text-slate-200")}>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-4">
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
      <div className="border-t border-slate-700 pt-8">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-6 text-slate-300")}>
          <Activity className="w-4 h-4 text-emerald-500" /> Risk Exposures & Activities
        </label>
        <div className="p-1"> 
          <ExposureTagSystem exposures={exp} onChange={(newExp) => onChange({ exposures: newExp })} />
        </div>
      </div>
    </div>
  );
}
