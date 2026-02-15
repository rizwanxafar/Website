import { useMemo } from 'react';
import { City } from "country-state-city";
import { classNames, getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES } from '../../_lib/constants';
import { clsx } from 'clsx';
import { Clock, Trash } from 'lucide-react'; 
import SearchableSelect from '../ui/SearchableSelect';
import ResponsiveDatePicker from '../ui/ResponsiveDatePicker';
import SimpleSelect from '../ui/SimpleSelect';

export default function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  const countryISO2 = useMemo(() => getIsoFromCountryName(layover.country), [layover.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : []; }, [countryISO2]);

  // --- STYLES ---
  const CARD_BASE = clsx(
    "rounded-lg border p-5 transition-colors duration-300 mb-4",
    highlighted 
      ? "border-red-500/50 bg-red-500/10" 
      : "border-slate-700 bg-slate-800/40 hover:bg-slate-800/60"
  );
  const LABEL = "block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2";
  const TEXTAREA_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 min-h-[80px] resize-none placeholder:text-slate-600";

  return (
    <div ref={innerRef} className={CARD_BASE}>
      
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6 border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4" />
          <h4 className="text-sm font-bold font-mono tracking-widest uppercase">Transit / Layover</h4>
        </div>
        <button 
          type="button" 
          onClick={onRemove} 
          className="text-[10px] font-mono text-slate-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          <Trash className="w-3 h-3" /> Remove
        </button>
      </div>

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="w-full">
           <label className={LABEL}>Country</label>
           <SearchableSelect 
              value={layover.country} 
              onChange={(val) => { onChange({ country: val, city: "" }); }} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
           />
        </div>
        <div className="w-full">
          <label className={LABEL}>City</label>
          <SearchableSelect 
              value={layover.city} 
              onChange={(val) => onChange({ city: val })} 
              options={cityOptions.map(c => c.name)}
              placeholder="Search city"
              allowCustom={true} 
           />
        </div>
        <div>
          <label className={LABEL}>Start</label>
          <ResponsiveDatePicker value={layover.start} onChange={(val) => onChange({ start: val })} />
        </div>
        <div>
          <label className={LABEL}>End</label>
          <ResponsiveDatePicker value={layover.end} onChange={(val) => onChange({ end: val })} />
        </div>
      </div>

      {/* ADDITIONAL INFO */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Left Airport?</label>
          <SimpleSelect 
            value={layover.leftAirport} 
            onChange={(val) => onChange({ leftAirport: val })} 
            options={['no', 'yes']}
          />
        </div>
        {layover.leftAirport === "yes" && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Activities Undertaken</label>
            <textarea 
              rows={3} 
              className={TEXTAREA_STYLES} 
              value={layover.activitiesText} 
              onChange={(e) => onChange({ activitiesText: e.target.value })} 
              placeholder="Describe activities outside the airport..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
