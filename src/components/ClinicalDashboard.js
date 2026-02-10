"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Plane, FileText, GraduationCap, ArrowUpRight,
  Terminal, ShieldAlert, Siren, Link as LinkIcon,
  Library, Radio, Database, Radar
} from "lucide-react";

// --- ANIMATION CONFIG ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function ClinicalDashboard({ intelData, source }) {
  return (
    // CHANGE 1: Deep Slate Background (bg-slate-950) for better contrast on NHS screens
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden font-sans">
      
      {/* --- PROFESSIONAL HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-slate-400" />
            {/* Increased font weight for legibility */}
            <span className="font-mono text-sm font-medium tracking-widest text-slate-300 uppercase">
              ID-Northwest
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-emerald-500 tracking-wider">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-16"
        >

          {/* 1. WELCOME SECTION */}
          <motion.div variants={fadeInUp} className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Welcome to <span className="text-emerald-500">Infectious Diseases</span> Portal
            </h1>
            {/* Increased text size and weight for readability */}
            <p className="text-xl text-slate-300 max-w-3xl leading-relaxed font-normal">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS */}
          {/* Added 'items-stretch' to make cards uniform height */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <ToolCard 
              href="/algorithms/travel/risk-assessment-returning-traveller"
              variant="critical"
              icon={ShieldAlert}
              title="VHF Risk Assessment"
              subtitle="VHF risk assessment for returned traveller"
            />
            <ToolCard 
              href="/algorithms/travel/travel-history-generator"
              variant="standard"
              icon={Plane}
              title="Travel History Generator"
              subtitle="Create accurate travel history"
            />
          </motion.div>

          {/* 3. INTELLIGENCE DASHBOARD */}
          <motion.div variants={fadeInUp}>
             <div className="flex items-center gap-4 mb-6">
              {/* UPDATED WORDING per request */}
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Radar className="w-5 h-5" />
                WHO DISEASE OUTBREAK NEWS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            {/* FULL WIDTH CONTAINER */}
            <div className="w-full">
               <LiveIntelCard items={intelData} source={source} />
            </div>
          </motion.div>

          {/* 4. IMPORTANT LINKS */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                IMPORTANT LINKS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UplinkCard title="NaTHNaC" subtitle="Travel Health Pro" icon={Plane} href="https://travelhealthpro.org.uk" />
              <UplinkCard title="CDC Travel" subtitle="Notices & Levels" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <UplinkCard title="ProMED-mail" subtitle="Rapid Alerts" icon={Siren} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. RESOURCES */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-5 h-5" />
                Resources
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            {/* Added 'items-stretch' for uniform card heights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <ResourceCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive flowcharts for clinical pathways and diagnostics." />
              <ResourceCard href="/guidelines" icon={FileText} title="Guidelines" description="Static reference documents, policy PDFs, and local protocols." />
              <ResourceCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching materials, case studies, and departmental slides." />
            </div>
          </motion.div>

          {/* 6. FOOTER */}
          <motion.div variants={fadeInUp} className="pt-12 border-t border-slate-800 flex justify-between items-center text-sm text-slate-500 font-mono">
            <span>ID-NW © 2024</span>
            <a href="mailto:infectionnw@gmail.com" className="hover:text-slate-300 transition-colors">
              CONTACT ADMIN
            </a>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

// --- INTELLIGENCE CARD (Refined for Clarity) ---

function LiveIntelCard({ items, source }) {
  const hasData = items && items.length > 0;
  const isLive = source === 'LIVE';
  
  // Theme Logic - Switched to Slate/Emerald mix
  const theme = isLive ? {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/10', // Slightly darker for contrast
    headerBorder: 'border-emerald-900/30',
    headerBg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    hover: 'hover:bg-emerald-900/20',
    date: 'text-emerald-500 group-hover:text-emerald-300',
    icon: 'text-emerald-700 group-hover:text-emerald-400',
    scrollbar: 'scrollbar-thumb-emerald-900/50 hover:scrollbar-thumb-emerald-700/50'
  } : {
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/10',
    headerBorder: 'border-amber-900/30',
    headerBg: 'bg-amber-950/20',
    text: 'text-amber-500',
    hover: 'hover:bg-amber-900/20',
    date: 'text-amber-600 group-hover:text-amber-400',
    icon: 'text-amber-800 group-hover:text-amber-500',
    scrollbar: 'scrollbar-thumb-amber-900/50 hover:scrollbar-thumb-amber-700/50'
  };

  return (
    <div className={`rounded-xl border backdrop-blur-sm overflow-hidden flex flex-col transition-colors duration-500 h-full min-h-[500px] max-h-[600px] shadow-2xl
      ${hasData ? theme.border : 'border-slate-800'}
      ${hasData ? theme.bg : 'bg-slate-900/30'}
    `}>
       {/* Removed "Last Updated" and "WHO DON" text as requested */}
       <div className={`p-3 border-b flex items-center justify-between flex-shrink-0 z-10
         ${hasData ? theme.headerBorder : 'border-slate-800'}
         ${hasData ? theme.headerBg : 'bg-slate-900/50'}
       `}>
          <div className="flex items-center gap-2">
            {isLive ? (
              <Radio className={`w-4 h-4 ${theme.text} animate-pulse`} />
            ) : (
              <Database className={`w-4 h-4 ${theme.text}`} />
            )}
            {/* REMOVED: The redundant "WHO DISEASE OUTBREAK NEWS" text here */}
          </div>
       </div>
       
       <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent ${theme.scrollbar} flex flex-col divide-y ${hasData ? (isLive ? 'divide-emerald-900/20' : 'divide-amber-900/20') : 'divide-slate-800'}`}>
         {hasData ? items.map((item, i) => (
           <a 
             key={i} 
             href={item.link}
             target="_blank"
             rel="noopener noreferrer" 
             className={`flex-shrink-0 p-5 transition-colors flex flex-col justify-center gap-2 group ${theme.hover}`}
           >
             <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                   {/* Increased Title Weight */}
                   <p className="text-base font-semibold text-slate-100 group-hover:text-white leading-snug">
                     {item.title}
                   </p>
                   {/* Increased Description Contrast & Size */}
                   {item.description && (
                     <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                       {item.description}
                     </p>
                   )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-mono font-medium uppercase tracking-widest ${theme.date}`}>
                    {item.date}
                  </span>
                  <ArrowUpRight className={`w-4 h-4 ${theme.icon} mt-1`} />
                </div>
             </div>
           </a>
         )) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-6 h-full">
             <Database className="w-8 h-8 mb-2 opacity-20" />
             <p className="text-sm font-mono">DATA STREAM OFFLINE</p>
           </div>
         )}
       </div>
    </div>
  );
}

// --- STANDARD COMPONENTS (Uniform & High Contrast) ---

function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  const styles = {
    critical: {
      border: "border-red-500/30",
      bg: "bg-red-950/10",
      hoverBg: "hover:bg-red-900/20",
      hoverBorder: "hover:border-red-500/50",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      iconBorder: "border-red-500/20",
      arrowHover: "group-hover:text-red-400",
      textHover: "group-hover:text-red-100",
      subtext: "text-red-200/60",
      glow: "from-red-500/10"
    },
    standard: {
      border: "border-slate-700",
      bg: "bg-slate-900/50",
      hoverBg: "hover:bg-slate-800",
      hoverBorder: "hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      iconBorder: "border-emerald-500/20",
      arrowHover: "group-hover:text-emerald-400",
      textHover: "group-hover:text-white",
      subtext: "text-emerald-100/60",
      glow: "from-emerald-500/10"
    }
  };

  const s = styles[variant];

  return (
    <Link 
      href={href}
      // Added h-full to ensure uniform height in grid
      className={`group relative h-full min-h-[180px] rounded-xl border ${s.border} ${s.bg} backdrop-blur-sm
                 ${s.hoverBg} ${s.hoverBorder} transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />
      
      {/* Used flex-1 to push content properly */}
      <div className="relative p-6 flex flex-col justify-between h-full z-20">
        <div className="flex justify-between items-start mb-4">
          <span className={`p-3 rounded-lg ${s.iconBg} ${s.iconColor} border ${s.iconBorder}`}>
            <Icon className="w-6 h-6" />
          </span>
          <ArrowUpRight className={`w-5 h-5 text-slate-500 ${s.arrowHover} transition-colors`} />
        </div>
        <div>
          <h3 className={`text-xl font-bold text-slate-100 mb-2 ${s.textHover} transition-colors`}>
            {title}
          </h3>
          <p className={`text-sm ${s.subtext} font-mono font-medium uppercase tracking-wider`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-t ${s.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </Link>
  );
}

function UplinkCard({ title, subtitle, icon: Icon, href }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Added h-full for uniform height
      className="group relative p-4 h-full rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm
                 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 flex items-center gap-4 overflow-hidden"
    >
      <div className="relative z-10 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-300 group-hover:text-white truncate transition-colors">
          {title}
        </h4>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-mono font-medium truncate">
          {subtitle}
        </p>
      </div>
      <ArrowUpRight className="relative z-10 w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
    </a>
  );
}

function ResourceCard({ href, icon: Icon, title, description }) {
  return (
    <Link 
      href={href}
      // Added h-full and flex flex-col for uniform height
      className="group relative p-6 h-full rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm 
                 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
      <div className="relative z-10 mb-6 text-slate-500 group-hover:text-white transition-colors">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="relative z-10 text-lg font-bold text-slate-200 group-hover:text-white mb-2 transition-colors">
        {title}
      </h4>
      {/* Increased description legibility */}
      <p className="relative z-10 text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors flex-1 font-normal">
        {description}
      </p>
    </Link>
  );
}
