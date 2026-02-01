import { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { format } from 'date-fns';
import { Printer, Clipboard, X, Loader2 } from 'lucide-react'; // Swapped icons
import dynamic from 'next/dynamic';

// ---- Dynamic Map Import (Dark Mode Loader) ----
const TravelMap = dynamic(() => import('./TravelMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-100 border border-neutral-200 rounded flex flex-col items-center justify-center text-neutral-400 text-xs font-mono gap-2 uppercase tracking-wider">
      <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      <span>Rendering_Map_Data...</span>
    </div>
  )
});

export default function PrintOverlay({ open, onClose, events, summaryHtml, summaryText }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- BUTTON STYLES ---
  const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all";
  const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-xs font-bold font-mono uppercase tracking-wide transition-all";

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        
        {/* BACKDROP */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity print:hidden" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto print:overflow-visible print:inset-auto print:absolute print:top-0 print:left-0 print:w-full print:h-full">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 print:block print:min-h-0 print:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* MODAL PANEL: Dark Frame */}
              <DialogPanel className="relative transform overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 text-left shadow-2xl transition-all w-full max-w-5xl h-[85vh] flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:border-none print:bg-white">
                
                {/* --- MAGIC PRINT FIX: Ghost Page Removal --- */}
                <style jsx global>{`
                  @media print {
                    /* 1. Hide the entire app UI */
                    main, header, nav, footer, .fixed {
                      display: none !important;
                    }
                    
                    /* 2. Reset Body */
                    body {
                      background-color: white !important;
                      color: black !important;
                    }

                    /* 3. Make only the print root visible */
                    #print-root {
                      display: block !important;
                      visibility: visible !important;
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 20px !important;
                      background-color: white !important;
                      color: black !important;
                    }

                    /* 4. Ensure map prints correctly */
                    .leaflet-container {
                      print-color-adjust: exact;
                    }
                  }
                `}</style>

                {/* HEADER (Dark Mode Controls) - Hidden on Print */}
                <div className="bg-neutral-900/50 px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0 print:hidden backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-neutral-300 font-mono tracking-wider uppercase">Report Preview</span>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" className={BTN_PRIMARY} onClick={handlePrint}>
                      <Printer className="w-4 h-4" /> Print PDF
                    </button>
                    <button type="button" className={BTN_SECONDARY} onClick={onClose}>
                      <X className="w-4 h-4" /> Close
                    </button>
                  </div>
                </div>

                {/* CONTENT AREA: Dark Background, White Paper */}
                <div className="flex-1 overflow-y-auto bg-neutral-900/50 p-8 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
                  
                  {/* THE PAPER (White Sheet) */}
                  <div id="print-root" className="bg-white text-slate-900 max-w-3xl mx-auto shadow-2xl p-10 min-h-[800px] print:shadow-none print:p-0 print:min-h-0">
                    
                    {/* Report Header */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                       <div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Travel History Report</h1>
                         <p className="text-sm text-slate-500 mt-2 font-mono">Generated: {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
                       </div>
                       <div className="text-right">
                         <div className="text-xs font-bold uppercase tracking-widest text-slate-400">ID-NORTHWEST</div>
                         <div className="text-xs text-slate-400">Clinical Decision Support</div>
                       </div>
                    </div>

                    {/* MAP VISUALIZATION */}
                    <div className="mb-8 break-inside-avoid print:break-inside-avoid h-[400px] w-full rounded border border-slate-200 overflow-hidden relative z-0 bg-slate-50">
                      <TravelMap events={events} />
                    </div>

                    {/* TEXT SUMMARY */}
                    <div>
                       <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2 print:border-none">
                         <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">Clinical Narrative</h2>
                         <button 
                           type="button" 
                           onClick={handleCopy}
                           className="text-xs font-bold uppercase tracking-wide text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition print:hidden"
                         >
                           {copied ? <span>Copied!</span> : <span>Copy Text</span>}
                           <Clipboard className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       
                       {/* The summary HTML is trusted content generated by the engine */}
                       <div 
                         className="prose prose-sm max-w-none prose-slate text-slate-900 prose-headings:font-bold prose-headings:uppercase prose-headings:text-xs prose-headings:tracking-widest prose-p:leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: summaryHtml }} 
                       />
                    </div>

                    {/* Footer for Print */}
                    <div className="mt-12 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center font-mono uppercase">
                      Generated via ID-Northwest Clinical Portal // Do not store without patient consent
                    </div>

                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
