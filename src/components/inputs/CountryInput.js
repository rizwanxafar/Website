'use client';

import { useEffect, useMemo, useState } from 'react';
import countries from 'world-countries';
import aliases from '@/data/country-aliases.json';
import { resolveCountry } from '@/lib/resolveCountry';

// Canonical list (e.g., "United States", "Türkiye", ...)
const COUNTRY_LIST = countries
  .map((c) => c.name.common)
  .sort((a, b) => a.localeCompare(b));

// Build alias -> canonical pairs array for quick filtering
const ALIAS_ENTRIES = Object.entries(aliases); // [ [alias, canonical], ... ]

export default function CountryInput({
  value = '',
  onChange,
  id = 'country',
  placeholder = 'Country…',
}) {
  const [text, setText] = useState(value);

  // Keep local text in sync if parent updates value
  useEffect(() => {
    setText(value || '');
  }, [value]);

  // Suggest canonical names + aliases that match the query
  const suggestions = useMemo(() => {
    const q = (text || '').trim().toLowerCase();
    if (!q) {
      // Initial suggestions: just canonical names
      return COUNTRY_LIST.slice(0, 50);
    }

    // Canonical matches
    const canonMatches = COUNTRY_LIST.filter((name) =>
      name.toLowerCase().includes(q)
    );

    // Alias matches (show the alias string itself as a suggestion)
    const aliasMatches = ALIAS_ENTRIES
      .filter(([alias]) => alias.toLowerCase().includes(q))
      .map(([alias]) => alias);

    // Merge (aliases first so users see what they typed), then canonical; de-dupe
    const merged = [...aliasMatches, ...canonMatches];
    return Array.from(new Set(merged)).slice(0, 50);
  }, [text]);

  const listId = `${id}-list`;

  // On every keystroke, just update text. If what they typed resolves to a known country,
  // also push the canonical up immediately (so parent state stays clean).
  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    const resolved = resolveCountry(val);
    if (resolved) {
      onChange?.(resolved);
    }
  };

  // On blur, force normalization to canonical text in the box.
  const handleBlur = () => {
    const resolved = resolveCountry(text);
    setText(resolved);
    onChange?.(resolved);
  };

  return (
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
        Country *
      </label>
      <input
        list={listId}
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <datalist id={listId}>
        {suggestions.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}
