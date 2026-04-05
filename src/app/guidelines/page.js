"use client";

import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import NavBar from "@/components/NavBar";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Guidelines
          </h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            Local guidelines and reference documents are currently being indexed for the portal.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand hover:opacity-90 px-5 py-2.5 rounded-lg transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
