import { useMemo } from 'react';
import { City } from "country-state-city";
import { clsx } from 'clsx';
import { getIsoFromCountryName } from '../../_lib/utils';
import { CSC_COUNTRIES, ACCOMMODATION_OPTIONS } from '../../_lib/constants';
import { MapPin, Calendar, Home, Activity, Trash, Plus } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import ResponsiveDatePicker from '../ui/ResponsiveDatePicker';
import ExposureTagSystem from './ExposureTagSystem';

const LABEL = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
const SUB_LABEL = "block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5";
const INPUT_STYLES = "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-slate-400 transition-colors";

export default function StopCard({ stop, index, totalStops, onChange, onRemove, innerRef, highlighted }) {
  const exp = stop.exposures;
  const normalizedCities = (stop.cities || []).map((c) =>
    typeof c === 'string' ? { name: c || '', arrival: '', departure: '' } : { name: c?.name || '', arrival: c?.arrival || '', departure: c?.departure || '' }
  );

  const countryISO2 = useMemo(() => getIsoFromCountryName(stop.country), [stop.country]);
  const cityOptions = useMemo(() => countryISO2 ? City.getCitiesOfCountry(countryISO2) : [], [countryISO2]);

  const commitCities = (next) => onChange({ cities: next });
  const setCityName = (i, name) => { const next = [...normalizedCities]; next[i] = { ...next[i], name }; commitCities(next); };
  const setCityArrival = (i, arrival) => { const next = [...normalizedCities]; next[i] = { ...next[i], arrival }; commitCities(next); };
  const setCityDeparture = (i, departure) => { const next = [...normalizedCities]; next[i] = { ...next[i], departure }; commitCities(next); };
  const addCity = () => commitCities([...normalizedCities, { name: '', arrival: '', departure: '' }]);
  const removeCity = (i) => { const next = [...normalizedCities]; next.splice(i, 1); if (next.length === 0) next.push({ name: '', arrival: '', departure: '' }); commitCities(next); };
  const toggleAccommodation = (value) => { const set = new Set(stop.accommodations || []); if (set.has(value)) set.delete(value); else set.add(value); onChange({ accommodations: Array.from(set) }); };

  const headerTitle = totalStops > 1 ? `Destination ${index + 1}` : "Destination";

  const cardClass = clsx(
    "rounded-xl border p-5 transition-all shadow-sm",
    highlighted
      ? "border-red-300 bg-red-50 ring-1 ring-red-200"
      : "border-slate-200 bg-white"
  );

  return (
    <div ref={innerRef} className={cardClass}>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{headerTitle}</h3>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash className="w-3.5 h-3.5" /> Remove
        </button>
      </div>

      {/* COUNTRY & DATES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div>
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
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-4")}>
          <Home className="w-3.5 h-3.5" /> Cities Visited
        </label>
        <div className="space-y-4">
          {normalizedCities.map((row, i) => (
            <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end pb-4 border-b border-slate-200 last:border-0 last:pb-0">
              <div>
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
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCity}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:border-brand/40 hover:text-brand transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add City
          </button>
        </div>
      </div>

      {/* ACCOMMODATION */}
      <div className="mb-5">
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
                  "flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors select-none",
                  checked
                    ? "bg-brand/5 border-brand/30 text-brand"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  id={id}
                  type="checkbox"
                  className="appearance-none h-4 w-4 rounded border border-slate-300 bg-white checked:bg-brand checked:border-brand focus:ring-0 transition-colors"
                  checked={checked}
                  onChange={() => toggleAccommodation(opt)}
                />
                <span className={clsx("text-xs font-medium transition-colors", checked ? "" : "text-slate-600")}>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-3">
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
      <div className="border-t border-slate-200 pt-5">
        <label className={clsx(LABEL, "flex items-center gap-2 mb-4")}>
          <Activity className="w-3.5 h-3.5" /> Risk Exposures &amp; Activities
        </label>
        <ExposureTagSystem exposures={exp} onChange={(newExp) => onChange({ exposures: newExp })} />
      </div>
    </div>
  );
}
