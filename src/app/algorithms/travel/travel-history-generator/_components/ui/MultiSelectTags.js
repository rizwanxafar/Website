import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { X, Plus } from 'lucide-react'; // Swapped icons
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

  // --- STYLES ---
  const CONTAINER = "flex flex-wrap items-center gap-1.5 p-1.5 min-h-[42px] w-full bg-neutral-900 border border-neutral-800 rounded";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-neutral-950 border border-neutral-800 py-1 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm";
  const TAG_BASE = "inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400";
  const INPUT_STYLES = "min-w-[120px] flex-1 border-none bg-transparent py-1 pl-1 text-sm leading-5 text-neutral-200 focus:ring-0 placeholder:text-neutral-600";

  return (
    <Combobox value={null} onChange={addTag} nullable>
      <div className="relative mt-1">
        <div className={CONTAINER}>
          {value.map((tag) => (
            <span key={tag} className={TAG_BASE}>
              {tag}
              <button
                type="button"
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-emerald-500/20 text-emerald-500"
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
                  clsx('relative cursor-pointer select-none py-2 pl-4 pr-4', active ? 'bg-emerald-900/30 text-emerald-400' : 'text-neutral-400')
                }
                value={query}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add "{query}"</span>
                </div>
              </ComboboxOption>
            ) : (
              filteredOptions.map((opt, idx) => (
                <ComboboxOption
                  key={idx}
                  className={({ active }) =>
                    clsx('relative cursor-default select-none py-2 pl-4 pr-4 transition-colors', active ? 'bg-emerald-900/20 text-emerald-400' : 'text-neutral-300')
                  }
                  value={opt}
                >
                  <span className="block truncate font-normal">{opt}</span>
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
