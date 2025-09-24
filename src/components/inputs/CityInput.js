'use client';

import { useId, useMemo } from 'react';
import { City } from 'country-state-city';
import { nameToIso2 } from '@/lib/countryIndex';

export default function CityInput({ countryName, value, onChange, label = 'City / locality' }) {
  const listId = useId();

  const cityNames = useMemo(() => {
    const iso2 = nameToIso2(countryName);
    if (!iso2) return [];
    try {
      const list = City.getCitiesOfCountry(iso2) || [];
      // The library returns objects with name property; de-dupe and sort
      const names = Array.from(new Set(list.map(c => c.name))).sort((a, b) => a.localeCompare(b));
      return names;
    } catch {
      return [];
    }
  }, [countryName]);

  return (
    <div className="w-full">
      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <input
        list={listId}
        type="text"
        placeholder={countryName ? 'Start typing…' : 'Select a country first'}
        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!countryName}
      />
      <datalist id={listId}>
        {cityNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </div>
  );
}
