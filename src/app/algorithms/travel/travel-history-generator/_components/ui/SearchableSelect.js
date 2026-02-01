import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronDown, Check, Plus } from 'lucide-react'; // Swapped icons to Lucide
import { normalize } from '../../_lib/utils';

export default function SearchableSelect({ value, onChange, options, placeholder, allowCustom = false }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    const fullList = query === '' 
      ? options 
      : options.filter((opt) => {
          const str = typeof opt === 'string' ? opt : opt.name;
          return normalize(str).includes(q);
        });
    return fullList.slice(0, 100);
  }, [query, options]);

  // --- STYLES ---
  const INPUT_STYLES = "w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 placeholder:text-neutral-600 transition-colors font-sans";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-neutral-950 border border-neutral-800 py-1 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm";

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative mt-1 group">
        <div className="relative">
          <ComboboxInput
            className={INPUT_STYLES}
            displayValue={(item) => item || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-neutral-500 group-hover:text-neutral-300" aria-hidden="true" />
          </ComboboxButton>
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
              allowCustom ? (
                <ComboboxOption
                  className={({ active }) =>
                    clsx('relative cursor-pointer select-none py-2 pl-4 pr-4', active ? 'bg-emerald-900/30 text-emerald-400' : 'text-neutral-400')
                  }
                  value={query}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Use "{query}"</span>
                  </div>
                </ComboboxOption>
              ) : (
                <div className="relative cursor-default select-none px-4 py-2 text-neutral-500 font-mono text-xs">NO_RESULTS_FOUND</div>
              )
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                return (
                  <ComboboxOption
                    key={key}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors', 
                        active ? 'bg-emerald-900/20 text-emerald-400' : 'text-neutral-300'
                      )
                    }
                    value={label}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx('block truncate', selected ? 'font-medium text-emerald-400' : 'font-normal')}>{label}</span>
                        {selected ? (
                          <span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-emerald-400' : 'text-emerald-500')}>
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                );
              })
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
