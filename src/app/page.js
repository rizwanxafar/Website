// src/app/page.js
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Plane,
  FileText,
  Book,
  GraduationCap,
  ArrowUpRight,
  Terminal,
  ShieldAlert
} from "lucide-react";

// --- Animation Config (Sterile/Precision) ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black overflow-x-hidden font-sans">
      
      {/* --- SYSTEM STATUS BAR (Replaces Navbar) --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-900 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-neutral-500" />
            <span className="font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase">
              ID-Northwest // OS_v2.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              System Online
            </span>
          </div>
        </div>
      </header>

      {/* --- CINEMATIC CONTAINER --- */}
      <div className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-16"
        >

          {/* 1. HERO TEXT */}
          <motion.div variants={fadeInUp} className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
              Clinical <span className="text-neutral-600">Decision Support</span>
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed font-light">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS (The "Hot" Zone) */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TOOL A: VHF Assessment (Alert Red) */}
            <Link 
              href="/algorithms/travel/risk-assessment-returning-traveller"
              className="group relative h-48 md:h-64 rounded-2xl border border-red-900/30 bg-neutral-900/20 
                         hover:bg-red-950/10 hover:border-red-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                    <ShieldAlert className="w-6 h-6" />
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-neutral-700 group-hover:text-red-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-red-100 transition-colors">VHF Risk Assessment</h3>
                  <p className="text-sm text-red-200/50 font-mono uppercase tracking-wider">Immediate Protocol</p>
                </div>
              </div>
              {/* Subtle Red Glow Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>

            {/* TOOL B: Travel History (Utility Emerald) */}
            <Link 
              href="/algorithms/travel/travel-history-generator"
              className="group relative h-48 md:h-64 rounded-2xl border border-neutral-800 bg-neutral-900/20 
                         hover:bg-emerald-950/10 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Plane className="w-6 h-6" />
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-neutral-700 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-emerald-100 transition-colors">Travel Generator</h3>
                  <p className="text-sm text-emerald-200/50 font-mono uppercase tracking-wider">Admission Tool</p>
                </div>
              </div>
              {/* Subtle Emerald Glow Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>

          </motion.div>

          {/* 3. KNOWLEDGE BASE (The "Cool" Zone) */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-neutral-600 uppercase tracking-widest">Library // Read-Only</span>
              <div className="h-px flex-1 bg-neutral-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Algorithms */}
              <Link 
                href="/algorithms"
                className="group p-6 rounded-xl border border-neutral-800 bg-black hover:border-neutral-600 transition-all duration-300"
              >
                <div className="mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Algorithms</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Interactive flowcharts for clinical pathways and diagnostics.
                </p>
              </Link>

              {/* Card 2: Guidelines */}
              <Link 
                href="/guidelines"
                className="group p-6 rounded-xl border border-neutral-800 bg-black hover:border-neutral-600 transition-all duration-300"
              >
                <div className="mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Guidelines</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Static reference documents, policy PDFs, and local protocols.
                </p>
              </Link>

              {/* Card 3: Education */}
              <Link 
                href="/teaching"
                className="group p-6 rounded-xl border border-neutral-800 bg-black hover:border-neutral-600 transition-all duration-300"
              >
                <div className="mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Education</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Teaching materials, case studies, and departmental slides.
                </p>
              </Link>

            </div>
          </motion.div>

          {/* 4. FOOTER */}
          <motion.div variants={fadeInUp} className="pt-12 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600 font-mono">
            <span>ID-NW © 2024</span>
            <a href="mailto:infectionnw@gmail.com" className="hover:text-white transition-colors">
              CONTACT_ADMIN
            </a>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}
