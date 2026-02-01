// src/app/page.js
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Plane,
  ChevronRight,
  Activity,
  Mail
} from "lucide-react";

// Animation variants for the "Sterile Fade" (Option A)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-lime-500/30 selection:text-lime-200">
      
      {/* Top Decoration Line */}
      <div className="w-full h-1 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 opacity-50" />

      <motion.div
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* --- Header Section --- */}
        <motion.div variants={itemVariants} className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded bg-slate-900 border border-slate-800 text-lime-400">
              <Activity className="h-4 w-4" />
            </span>
            <span className="font-mono text-xs font-medium tracking-widest text-slate-500 uppercase">
              ID Northwest // Clinical Portal
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Infectious Diseases <br />
            <span className="text-slate-500">Resource Centre</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Local guidelines, clinical algorithms, and rapid assessment tools for infectious disease clinicians in the North West.
          </p>
        </motion.div>

        {/* --- Critical Actions (Triage Area) --- */}
        <motion.div variants={itemVariants} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
          
          {/* VHF Risk Assessment - CRITICAL (Red) */}
          <Link
            href="/algorithms/travel/risk-assessment-returning-traveller"
            className="group relative flex items-start gap-4 p-5 rounded-lg border border-red-900/30 bg-red-950/10 
                       hover:bg-red-950/20 hover:border-red-500/50 transition-all duration-200"
          >
            <div className="shrink-0 rounded bg-red-500/10 p-2.5 text-red-400 border border-red-500/20 group-hover:text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-100 group-hover:text-white flex items-center gap-2">
                VHF Risk Assessment
                <ChevronRight className="h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="mt-1 text-sm text-red-200/60 group-hover:text-red-200/80">
                Urgent protocol for returning travellers with fever.
              </p>
            </div>
          </Link>

          {/* Travel Generator - TOOL (Chartreuse/Lime) */}
          <Link
            href="/algorithms/travel/travel-history-generator"
            className="group relative flex items-start gap-4 p-5 rounded-lg border border-lime-900/30 bg-lime-950/5 
                       hover:bg-lime-950/10 hover:border-lime-500/50 transition-all duration-200"
          >
            <div className="shrink-0 rounded bg-lime-500/10 p-2.5 text-lime-400 border border-lime-500/20 group-hover:text-lime-300">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-lime-100 group-hover:text-white flex items-center gap-2">
                Travel History Generator
                <ChevronRight className="h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="mt-1 text-sm text-lime-200/60 group-hover:text-lime-200/80">
                Generate detailed travel history notes for admission.
              </p>
            </div>
          </Link>

        </motion.div>

        {/* --- Main Resources Grid --- */}
        <motion.div variants={itemVariants} className="mt-16 sm:mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="font-mono text-xs text-slate-600 uppercase tracking-widest">Core Modules</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Algorithms */}
            <Link
              href="/algorithms"
              className="group flex flex-col justify-between h-full p-6 rounded-xl bg-slate-900/50 border border-slate-800 
                         hover:border-slate-600 hover:bg-slate-900 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2 rounded bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-600 group-hover:text-slate-500">MOD_01</span>
                </div>
                <h3 className="text-xl font-medium text-slate-100 group-hover:text-white mb-2">Algorithms</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Step-by-step clinical pathways for common ID scenarios and decision making.
                </p>
              </div>
            </Link>

            {/* Guidelines */}
            <Link
              href="/guidelines"
              className="group flex flex-col justify-between h-full p-6 rounded-xl bg-slate-900/50 border border-slate-800 
                         hover:border-slate-600 hover:bg-slate-900 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2 rounded bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-600 group-hover:text-slate-500">MOD_02</span>
                </div>
                <h3 className="text-xl font-medium text-slate-100 group-hover:text-white mb-2">Guidelines</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Local and national guidance documents, antibiotic policies, and references.
                </p>
              </div>
            </Link>

            {/* Education */}
            <Link
              href="/teaching"
              className="group flex flex-col justify-between h-full p-6 rounded-xl bg-slate-900/50 border border-slate-800 
                         hover:border-slate-600 hover:bg-slate-900 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2 rounded bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-600 group-hover:text-slate-500">MOD_03</span>
                </div>
                <h3 className="text-xl font-medium text-slate-100 group-hover:text-white mb-2">Education</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Teaching resources, slide decks, and case discussions for ID clinicians.
                </p>
              </div>
            </Link>

          </div>
        </motion.div>

        {/* --- Footer / Contact --- */}
        <motion.div variants={itemVariants} className="mt-24 border-t border-slate-800/60 pt-8 flex justify-center">
          <a
            href="mailto:infectionnw@gmail.com"
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/50 
                       text-sm text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">infectionnw@gmail.com</span>
          </a>
        </motion.div>

      </motion.div>
    </main>
  );
}
