"use client";

import Link from "next/link";
import { FileText, ArrowLeft, Terminal } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans flex flex-col relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-neutral-500" />
            <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
              ID-Northwest // GUIDELINES
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full border border-white/10 bg-neutral-900/20 backdrop-blur-md rounded-2xl p-8 text-center">
          
          <div className="mx-auto w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Library Syncing</h1>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            Local guidelines and static reference documents are currently being indexed for the portal.
          </p>

          <div className="bg-neutral-950 rounded-lg p-4 mb-8 border border-neutral-800 font-mono text-xs text-left text-neutral-400">
             <p className="mb-1"><span className="text-emerald-500">➜</span> fetch_documents</p>
             <p className="mb-1">... connecting_to_archive [OK]</p>
             <p className="mb-1">... parsing_pdf_metadata [WAITING]</p>
             <p className="text-blue-500">ℹ INFO: INDEX_BUILDING</p>
          </div>

          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-700 px-6 py-3 rounded-lg transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>

        </div>
      </div>
    </main>
  );
}
