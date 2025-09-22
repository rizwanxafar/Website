'use client';

import { useId } from 'react';
import countries from 'world-countries';

// Canonical list of country names (e.g., "United States", "Türkiye", ...)
const COUNTRY_LIST = countries
  .map((c) => c.name.common)
  .sort((a, b) => a.localeCompare(b));

export default function CountryInput({ value, onChange, label = 'Country *' }) {
  const listId = useId(); // avoid duplicate datalist IDs if multiple inputs are on the page

  return (
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        list={listId}
        type="text"
        placeholder="Start typing…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {COUNTRY_LIST.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
