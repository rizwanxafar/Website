import { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { format } from 'date-fns';
import { Printer, Clipboard, X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// ---- Dynamic Map Import ----
const TravelMap = dynamic(() => import('./TravelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      <span>Loading map...</span>
    </div>
  )
});

const BTN_PRIMARY =
  "flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold transition-opacity";

const BTN_SECONDARY =
  "flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-sm font-medium transition-colors";

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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" />
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
              {/* MODAL PANEL */}
              <DialogPanel className="relative transform overflow-hidden rounded-xl bg-white border border-slate-200 text-left shadow-2xl transition-all w-full max-w-5xl h-[85vh] flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:border-none print:bg-white print:overflow-visible print:block">

                {/* --- CSS RESET FOR PRINTING --- */}
                <style jsx global>{`
                  @media print {
                    /* 1. HIDE EVERYTHING by default */
                    body * {
                      visibility: hidden;
                    }

                    /* 2. Un-hide the Print Root and its children */
                    #print-root, #print-root * {
                      visibility: visible;
                    }

                    /* 3. Position Print Root at absolute top-left */
                    #print-root {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      margin: 0;
                      padding: 20px !important;
                      background: white;
                      color: black;
                    }

                    /* 4. Kill layout constraints */
                    html, body, .fixed, .absolute, .relative {
                      overflow: visible !important;
                      height: auto !important;
                      position: static !important;
                    }

                    /* 5. Hide User Interface elements specifically */
                    header, footer, nav, button, .print\\:hidden {
                      display: none !important;
                    }
                  }
                `}</style>

                {/* HEADER (Controls) */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 text-brand">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Report Preview</h3>
                      <p className="text-xs text-slate-500">Ready to print or copy</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={BTN_PRIMARY} onClick={handlePrint}>
                      <Printer className="w-4 h-4" /> Print PDF
                    </button>
                    <button type="button" className={BTN_SECONDARY} onClick={onClose}>
                      <X className="w-4 h-4" /> Close
                    </button>
                  </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">

                  {/* THE PAPER (White Sheet) */}
                  <div id="print-root" className="bg-white text-slate-900 max-w-3xl mx-auto shadow-lg ring-1 ring-slate-200 rounded-lg p-12 min-h-[1000px] print:shadow-none print:ring-0 print:rounded-none print:p-0 print:min-h-0 print:static">

                    {/* Report Header */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                       <div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Travel History Report</h1>
                         <p className="text-sm text-slate-500 mt-2">Generated: {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
                       </div>
                       <div className="text-right">
                         <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">ID-Northwest</div>
                         <div className="text-xs text-slate-400">Clinical Decision Support</div>
                       </div>
                    </div>

                    {/* MAP VISUALIZATION */}
                    <div className="mb-8 break-inside-avoid print:break-inside-avoid h-[400px] w-full rounded-lg border border-slate-200 overflow-hidden relative z-0 bg-slate-50">
                      <TravelMap events={events} />
                    </div>

                    {/* TEXT SUMMARY */}
                    <div>
                       <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2 print:border-none">
                         <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Itinerary & Exposure Summary</h2>
                         <button
                           type="button"
                           onClick={handleCopy}
                           className="text-xs font-semibold text-brand hover:opacity-80 flex items-center gap-1.5 transition-opacity print:hidden"
                         >
                           {copied ? <span>Copied!</span> : <span>Copy Text</span>}
                           <Clipboard className="w-3.5 h-3.5" />
                         </button>
                       </div>

                       <div
                         className="prose prose-sm max-w-none prose-slate text-slate-900 prose-headings:font-semibold prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-p:leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: summaryHtml }}
                       />
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                      Generated via ID-Northwest Clinical Portal. Do not store without patient consent.
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
