import { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { format } from 'date-fns';
import { BTN_PRIMARY, BTN_SECONDARY } from '../../_lib/constants';
import { Printer, Clipboard } from '../icons';
import dynamic from 'next/dynamic';

// ---- Dynamic Map Import (Fixes SSR Error) ----
const TravelMap = dynamic(() => import('./TravelMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
      <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
      <span>Loading Map...</span>
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

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity print:hidden" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto print:overflow-visible print:inset-auto print:absolute print:top-0 print:left-0 print:w-full print:h-full">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-0 print:block print:min-h-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:rounded-lg h-[90vh] flex flex-col print:h-auto print:shadow-none print:my-0 print:w-full print:max-w-none print:rounded-none">
                
                {/* --- MAGIC PRINT FIX: Force hide everything else --- */}
                <style jsx global>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #print-root, #print-root * {
                      visibility: visible;
                    }
                    #print-root {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      margin: 0;
                      padding: 0;
                    }
                    /* Hide scrollbars during print */
                    body {
                      overflow: hidden; 
                    }
                  }
                `}</style>

                {/* Header (No Print) */}
                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-b border-slate-200 print:hidden shrink-0">
                  <div className="flex gap-2">
                    <button type="button" className={BTN_PRIMARY} onClick={handlePrint}>Print / Save PDF</button>
                    <button type="button" className={BTN_SECONDARY} onClick={onClose}>Close</button>
                  </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-0 print:overflow-visible" id="print-root">
                  <div className="max-w-3xl mx-auto space-y-8 print:max-w-none">
                    
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-8">
                       <h1 className="text-3xl font-bold text-slate-900">Travel History Report</h1>
                       <p className="text-sm text-slate-500 mt-1">Generated {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>

                    {/* MAP VISUALIZATION */}
                    <div className="mb-8 break-inside-avoid print:break-inside-avoid h-[400px] w-full rounded border border-slate-300 overflow-hidden relative z-0">
                      <TravelMap events={events} />
                    </div>

                    {/* TEXT SUMMARY */}
                    <div>
                       <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2 print:border-none">
                         <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">Detailed Summary</h2>
                         <button 
                           type="button" 
                           onClick={handleCopy}
                           className="text-xs font-medium text-slate-500 hover:text-[hsl(var(--brand))] flex items-center gap-1.5 transition print:hidden"
                         >
                           {copied ? <span className="text-green-600">Copied!</span> : <span>Copy to clipboard</span>}
                           <Clipboard className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       <div className="prose prose-sm max-w-none prose-slate text-slate-900" dangerouslySetInnerHTML={{ __html: summaryHtml }} />
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
