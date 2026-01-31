import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronUpDown, Check, Plus } from '../icons';
import { CONTAINER_BASE, INPUT_BASE } from '../../_lib/constants';
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

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative mt-1">
        <div className={CONTAINER_BASE}>
          <ComboboxInput
            className={INPUT_BASE}
            displayValue={(item) => item || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDown aria-hidden="true" />
          </ComboboxButton>
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
              allowCustom ? (
                <ComboboxOption
                  className={({ active }) =>
                    clsx('relative cursor-pointer select-none py-2 pl-4 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')
                  }
                  value={query}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Use "{query}"</span>
                  </div>
                </ComboboxOption>
              ) : (
                <div className="relative cursor-default select-none px-4 py-2 text-slate-500">Nothing found.</div>
              )
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                return (
                  <ComboboxOption
                    key={key}
                    className={({ active }) =>
                      clsx('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')
                    }
                    value={label}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>{label}</span>
                        {selected ? (
                          <span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-white' : 'text-[hsl(var(--brand))]')}>
                            <Check aria-hidden="true" />
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
