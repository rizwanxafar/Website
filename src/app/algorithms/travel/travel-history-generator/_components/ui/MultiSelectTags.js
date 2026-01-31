import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { X, Plus } from '../icons';
import { CONTAINER_BASE } from '../../_lib/constants';
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

  return (
    <Combobox value={null} onChange={addTag} nullable>
      <div className="relative mt-1">
        <div className={clsx(CONTAINER_BASE, "flex flex-wrap items-center gap-1.5 p-1.5 min-h-[42px]")}>
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded bg-[hsl(var(--brand))]/10 border border-[hsl(var(--brand))]/20 px-2 py-0.5 text-xs font-medium text-[hsl(var(--brand))] dark:text-[hsl(var(--accent))]">
              {tag}
              <button
                type="button"
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-[hsl(var(--brand))]/20"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <ComboboxInput
            className="min-w-[120px] flex-1 border-none bg-transparent py-1 pl-1 text-sm leading-5 text-slate-900 focus:ring-0 dark:text-slate-100 placeholder:text-slate-400"
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
          <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              <ComboboxOption
                className={({ active }) =>
                  clsx('relative cursor-pointer select-none py-2 pl-4 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')
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
                    clsx('relative cursor-default select-none py-2 pl-4 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')
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
