import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { X, Plus } from 'lucide-react'; 
import { normalize } from '../../_lib/utils';

export default function MultiSelectTags({ value = [], onChange, options, placeholder }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    return query === '' 
      ? options.filter(opt => !value.includes(opt))
      : options.filter((opt) => {
          return normalize(opt).includes(q) && !value.includes(opt);
        });
  }, [query, options, value]);

  const removeTag = (tag) => {
    onChange(value.filter(t => t !== tag));
  };

  const addTag = (tag) => {
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setQuery('');
  };

  // --- CLINICAL SAAS STYLES ---
  const CONTAINER = "flex flex-wrap items-center gap-2 p-2 min-h-[48px] w-full bg-slate-900 border border-slate-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500/40 transition-all";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-slate-950 border border-slate-800 py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm custom-scrollbar";
  
  // Tags are slightly more substantial now
  const TAG_BASE = "inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400";
  const INPUT_STYLES = "min-w-[120px] flex-1 border-none bg-transparent py-1 pl-1 text-base leading-5 text-white focus:ring-0 placeholder:text-slate-500 font-sans";

  return (
    <Combobox value={null} onChange={addTag} nullable>
      <div className="relative w-full">
        <div className={CONTAINER}>
          {value.map((tag) => (
            <span key={tag} className={TAG_BASE}>
              {tag}
              <button
                type="button"
                className="group relative -mr-1 h-4 w-4 rounded-sm hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-colors"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <ComboboxInput
            className={INPUT_STYLES}
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className={DROPDOWN_BASE}>
            {filteredOptions.length === 0 && query !== '' ? (
              <ComboboxOption
                className={({ active }) =>
                  clsx('relative cursor-pointer select-none py-3 pl-4 pr-4', active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400')
                }
                value={query}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add "{query}"</span>
                </div>
              </ComboboxOption>
            ) : (
              filteredOptions.map((opt, idx) => (
                <ComboboxOption
                  key={idx}
                  className={({ active }) =>
                    clsx('relative cursor-default select-none py-3 pl-4 pr-4 transition-colors border-b border-slate-800/50 last:border-0', active ? 'bg-slate-800 text-emerald-400' : 'text-slate-300')
                  }
                  value={opt}
                >
                  <span className="block truncate font-medium">{opt}</span>
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
