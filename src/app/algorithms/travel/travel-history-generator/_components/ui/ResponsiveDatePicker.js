import React, { forwardRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const ResponsiveDatePicker = forwardRef(({ value, onChange, placeholder = "Select date" }, ref) => {
  return (
    <div className="relative w-full group">
      {/* Icon Overlay (Pointer events none so clicking passes through to input) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none group-focus-within:text-neutral-300 transition-colors">
        <CalendarIcon className="w-4 h-4" />
      </div>

      {/* Native Date Input with "Blackout" Styling 
         color-scheme: dark forces the internal calendar popup to be dark mode 
      */}
      <input
        ref={ref}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full rounded-lg bg-neutral-950 border border-neutral-800 
          pl-10 pr-3 py-2.5 text-sm text-neutral-200 
          placeholder:text-neutral-600 
          focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/50
          transition-all
          [color-scheme:dark] 
          [&::-webkit-calendar-picker-indicator]:opacity-0 
          [&::-webkit-calendar-picker-indicator]:absolute 
          [&::-webkit-calendar-picker-indicator]:left-0 
          [&::-webkit-calendar-picker-indicator]:right-0 
          [&::-webkit-calendar-picker-indicator]:w-full 
          [&::-webkit-calendar-picker-indicator]:h-full 
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
        `}
      />
      
      {/* The native picker indicator is hidden (opacity-0) and stretched over the input 
         so clicking anywhere opens the calendar. The custom icon sits underneath visually.
      */}
    </div>
  );
});

ResponsiveDatePicker.displayName = "ResponsiveDatePicker";

export default ResponsiveDatePicker;
