import { useMemo } from 'react';
import { City } from "country-state-city";
import { classNames, getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES, LINKISH_SECONDARY, TEXTAREA_CLASS } from '../../_lib/constants';
import SearchableSelect from '../ui/SearchableSelect';
import ResponsiveDatePicker from '../ui/ResponsiveDatePicker';
import SimpleSelect from '../ui/SimpleSelect';

export default function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  const countryISO2 = useMemo(() => getIsoFromCountryName(layover.country), [layover.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : []; }, [countryISO2]);

  return (
    <div ref={innerRef} className={classNames("rounded-lg border p-4", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layover</h4>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove layover</button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="w-full">
           <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
           <SearchableSelect 
              value={layover.country} 
              onChange={(val) => { onChange({ country: val, city: "" }); }} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
           />
        </div>
        <div className="w-full">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
          <SearchableSelect 
              value={layover.city} 
              onChange={(val) => onChange({ city: val })} 
              options={cityOptions.map(c => c.name)}
              placeholder="Search city"
              allowCustom={true} 
           />
        </div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label><ResponsiveDatePicker value={layover.start} onChange={(val) => onChange({ start: val })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label><ResponsiveDatePicker value={layover.end} onChange={(val) => onChange({ end: val })} /></div>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Did they leave the airport?</label>
          <SimpleSelect 
            value={layover.leftAirport} 
            onChange={(val) => onChange({ leftAirport: val })} 
            options={['no', 'yes']}
          />
        </div>
        {layover.leftAirport === "yes" && (<div className="sm:col-span-2"><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Please describe any activities undertaken</label><textarea rows={3} className={TEXTAREA_CLASS} value={layover.activitiesText} onChange={(e) => onChange({ activitiesText: e.target.value })} /></div>)}
      </div>
    </div>
  );
}
