import { useMemo } from 'react';
import { City } from "country-state-city";
import { getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES } from '../../_lib/constants';
import { clsx } from 'clsx';
import { Clock, Trash } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import ResponsiveDatePicker from '../ui/ResponsiveDatePicker';
import SimpleSelect from '../ui/SimpleSelect';

const LABEL = "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";
const TEXTAREA_STYLES = "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[80px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors";

export default function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  const countryISO2 = useMemo(() => getIsoFromCountryName(layover.country), [layover.country]);
  const cityOptions = useMemo(() => countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : [], [countryISO2]);

  const cardClass = clsx(
    "rounded-xl border p-5 transition-all shadow-sm",
    highlighted
      ? "border-red-300 dark:border-red-700/50 bg-red-50 dark:bg-red-950/10 ring-1 ring-red-200 dark:ring-red-900/30"
      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600"
  );

  return (
    <div ref={innerRef} className={cardClass}>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Transit / Layover</h4>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <Trash className="w-3.5 h-3.5" /> Remove
        </button>
      </div>

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className={LABEL}>Country</label>
          <SearchableSelect
            value={layover.country}
            onChange={(val) => onChange({ country: val, city: "" })}
            options={CSC_COUNTRIES.map(c => c.name)}
            placeholder="Select country"
          />
        </div>
        <div>
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

      {/* ADDITIONAL */}
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
