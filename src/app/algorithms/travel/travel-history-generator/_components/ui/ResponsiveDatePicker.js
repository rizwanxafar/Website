import { Fragment } from 'react';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDate, formatDMY } from '../../_lib/utils';

export default function ResponsiveDatePicker({ value, onChange }) {
  const dateObj = value ? parseDate(value) : undefined;

  const handleDaySelect = (d) => {
    if (!d) { onChange(''); return; }
    onChange(format(d, 'yyyy-MM-dd'));
  };

  // --- STYLES (Neutral / Blackout Theme) ---
  const INPUT_STYLES = "w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 transition-colors font-sans flex items-center justify-between";
  const PANEL_BASE = "absolute z-50 mt-2 p-4 bg-neutral-950 rounded-xl shadow-2xl border border-neutral-800 w-[300px]";

  return (
    <div className="relative mt-1">
      {/* MOBILE: Native Input (Dark Mode) */}
      <div className="block md:hidden">
        <div className="relative">
           <input
            type="date"
            className={INPUT_STYLES}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            // Force browser date picker to be dark mode
            style={{ colorScheme: 'dark' }} 
          />
        </div>
      </div>

      {/* DESKTOP: Custom Popover */}
      <div className="hidden md:block">
        <Popover className="relative w-full">
          <PopoverButton className={INPUT_STYLES}>
            <span className={clsx("block truncate", !value && "text-neutral-600")}>
              {value ? formatDMY(value) : "Select date..."}
            </span>
            <span className="text-neutral-500">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className={PANEL_BASE}>
              {({ close }) => (
                <DayPicker
                  mode="single"
                  selected={dateObj}
                  onSelect={(d) => { handleDaySelect(d); close(); }}
                  showOutsideDays
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center mb-2",
                    caption_label: "text-sm font-bold text-neutral-300 uppercase tracking-widest",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent hover:bg-neutral-800 rounded-md flex items-center justify-center text-neutral-400 transition",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-neutral-600 rounded-md w-9 font-normal text-[0.8rem] uppercase font-mono",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors",
                    // SELECTED STATE: High contrast Neutral (White/Light Grey block)
                    day_selected: "!bg-neutral-200 !text-neutral-950 font-bold", 
                    // TODAY STATE: White text + Underline
                    day_today: "text-white font-bold underline decoration-neutral-600 underline-offset-4",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="w-4 h-4" />,
                    IconRight: () => <ChevronRight className="w-4 h-4" />,
                  }}
                />
              )}
            </PopoverPanel>
          </Transition>
        </Popover>
      </div>
    </div>
  );
}
