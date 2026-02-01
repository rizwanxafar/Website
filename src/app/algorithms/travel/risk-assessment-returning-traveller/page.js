'use client';

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import CountrySelect from "./CountrySelect";
import WarningBox from "@/components/WarningBox";

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans selection:bg-red-900/30 selection:text-red-200">

      {/* SYSTEM HEADER (Matches Travel History Layout) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-red-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-neutral-500 hover:text-red-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span className="font-mono text-xs tracking-widest text-red-600/80 uppercase hidden sm:inline-block">
                VHF_RISK_ASSESSMENT
              </span>
            </div>
          </div>
          
          {/* Right side kept empty/clean as requested */}
          <div></div>
        </div>
      </header>

      {/* MAIN CONTENT (Matches Travel History Spacing & Width) */}
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Title Section */}
            <div className="space-y-4">
               <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                VHF Risk Assessment<span className="text-red-600">.</span>
               </h1>
               <p className="text-lg text-neutral-500 leading-relaxed max-w-2xl">
                Rapid screening and risk stratification for <span className="text-neutral-300">Viral Haemorrhagic Fevers</span> in returning travellers.
               </p>
            </div>

            {/* Components Container */}
            <div className="space-y-8">
               <div className="rounded-xl overflow-hidden">
                 <WarningBox />
               </div>
               
               <div className="pt-4 border-t border-neutral-800">
                 <CountrySelect />
               </div>
            </div>
        </div>
      </main>
    </div>
  );
}
