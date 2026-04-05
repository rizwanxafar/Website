'use client';

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import CountrySelect from "./CountrySelect";
import WarningBox from "@/components/WarningBox";

export default function Page() {

  const handleExit = () => {
    try {
      sessionStorage.removeItem("riskFormV1");
    } catch (e) {
      // Ignore errors if storage is blocked
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link
            href="/"
            onClick={handleExit}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-50">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              VHF Risk Assessment
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-10 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              VHF Risk Assessment
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-2xl">
              Rapid screening and risk stratification for{" "}
              <span className="text-slate-700 font-medium">Viral Haemorrhagic Fevers</span>{" "}
              in returning travellers.
            </p>
          </div>

          <WarningBox />

          <div className="border-t border-slate-200 pt-8">
            <CountrySelect />
          </div>
        </div>
      </main>
    </div>
  );
}
