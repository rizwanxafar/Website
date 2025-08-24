// src/components/CountryChips.jsx
"use client";

export default function CountryChips({ items, onRemove }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <span
          key={`chip-${c.id}`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100"
        >
          {c.name}
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400"
            aria-label={`Remove ${c.name}`}
            onClick={() => onRemove?.(c.id)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
