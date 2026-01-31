import { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronUpDown, Check } from '../icons';
import { CONTAINER_BASE } from '../../_lib/constants';

export default function SimpleSelect({ value, onChange, options }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <ListboxButton className={CONTAINER_BASE}>
          <span className="block truncate py-2 pl-3 pr-10 min-h-[36px]">{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDown aria-hidden="true" />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {options.map((opt, idx) => (
              <ListboxOption
                key={idx}
                className={({ active }) =>
                  clsx('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')
                }
                value={opt}
              >
                {({ selected, active }) => (
                  <>
                    <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>{opt}</span>
                    {selected ? (
                      <span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-white' : 'text-[hsl(var(--brand))]')}>
                        <Check aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
