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

  // --- CLINICAL SAAS STYLES ---
  const INPUT_STYLES = "w-full h-12 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder:text-slate-500 transition-colors font-sans flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-600";
  const PANEL_BASE = "absolute z-50 mt-2 p-5 bg-slate-950 rounded-xl shadow-2xl border border-slate-800 w-[320px]";

  return (
    <div className="relative w-full">
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
            <span className={clsx("block truncate", !value && "text-slate-500")}>
              {value ? formatDMY(value) : "Select date..."}
            </span>
            <span className="text-slate-500">
              <CalendarIcon className="w-5 h-5" />
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
                    caption: "flex justify-center pt-1 relative items-center mb-4",
                    caption_label: "text-sm font-bold text-slate-200 uppercase tracking-widest",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-transparent hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 transition",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] uppercase font-mono",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-medium hover:bg-slate-800 rounded-lg text-slate-300 transition-colors",
                    // SELECTED STATE: Emerald Block
                    day_selected: "!bg-emerald-600 !text-white font-bold shadow-md shadow-emerald-900/50", 
                    // TODAY STATE: Underline
                    day_today: "text-emerald-400 font-bold underline decoration-slate-600 underline-offset-4",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="w-5 h-5" />,
                    IconRight: () => <ChevronRight className="w-5 h-5" />,
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
