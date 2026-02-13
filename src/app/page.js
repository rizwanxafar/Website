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
    // CHANGED: Background to bg-slate-900 (High contrast, no pure black)
    <main className="min-h-screen bg-slate-900 text-slate-200 selection:bg-slate-700 selection:text-white overflow-x-hidden font-sans">
      
      {/* --- HEADER --- */}
      {/* CHANGED: Surface to slate-900/90, Border to slate-700 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-slate-400" />
            <span className="font-mono text-sm font-medium tracking-widest text-slate-300 uppercase">
              ID-Northwest
            </span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-12"
        >

          {/* 1. WELCOME SECTION */}
          <motion.div variants={fadeInUp} className="max-w-4xl">
            {/* CHANGED: Text colors for better contrast on slate-900 */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-400 mb-6">
              Welcome to <span className="text-slate-100">Infectious Diseases</span> Portal
            </h1>
            {/* CHANGED: font-normal to font-medium for legibility on old monitors */}
            <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-medium">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS (Hero Cards) */}
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
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Radar className="w-5 h-5" />
                WHO DISEASE OUTBREAK NEWS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            </div>

            <div className="w-full">
               <LiveIntelCard items={intelData} source={source} />
            </div>
          </motion.div>

          {/* 4. IMPORTANT LINKS */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                IMPORTANT LINKS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <CompactCard title="NaTHNaC" icon={Plane} href="https://travelhealthpro.org.uk" />
              <CompactCard title="CDC Travel" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <CompactCard title="ProMED-mail" icon={Siren} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. RESOURCES */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-5 h-5" />
                Resources
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <CompactCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive flowcharts." />
              <CompactCard href="/guidelines" icon={FileText} title="Guidelines" description="Static reference docs." />
              <CompactCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching materials." />
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

// --- INTELLIGENCE CARD ---

function LiveIntelCard({ items, source }) {
  const hasData = items && items.length > 0;
  const isLive = source === 'LIVE';
  
  // CHANGED: Removed colored backgrounds/tints. Using Borders & Icons only.
  const theme = isLive ? {
    border: 'border-emerald-500/50', // Stronger border
    hover: 'hover:bg-slate-700/50',
    date: 'text-emerald-500',
    icon: 'text-emerald-500',
    scrollbar: 'scrollbar-thumb-emerald-900/50 hover:scrollbar-thumb-emerald-700/50'
  } : {
    border: 'border-amber-500/50',
    hover: 'hover:bg-slate-700/50',
    date: 'text-amber-500',
    icon: 'text-amber-500',
    scrollbar: 'scrollbar-thumb-amber-900/50 hover:scrollbar-thumb-amber-700/50'
  };

  return (
    // CHANGED: Unified Surface (slate-800/40) + Border (slate-700 unless active)
    <div className={`rounded-xl border backdrop-blur-sm overflow-hidden flex flex-col transition-colors duration-500 h-full min-h-[500px] max-h-[600px] shadow-sm
      ${hasData ? theme.border : 'border-slate-700'}
      bg-slate-800/40
    `}>
       {/* Minimal Header */}
       <div className={`p-3 border-b flex items-center justify-between flex-shrink-0 z-10 h-8 border-slate-700 bg-slate-900/50`}>
       </div>
       
       <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent ${theme.scrollbar} flex flex-col divide-y divide-slate-700/50`}>
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
                   {/* CHANGED: Text slate-200 */}
                   <p className="text-base font-semibold text-slate-200 group-hover:text-white leading-snug">
                     {item.title}
                   </p>
                   {item.description && (
                     /* CHANGED: Text slate-400 */
                     <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-2 line-clamp-2 leading-relaxed font-medium">
                       {item.description}
                     </p>
                   )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-mono font-bold uppercase tracking-widest ${theme.date}`}>
                    {item.date}
                  </span>
                  <ArrowUpRight className={`w-4 h-4 ${theme.icon} mt-1`} />
                </div>
             </div>
           </a>
         )) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 h-full">
             <Database className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-sm font-mono">DATA STREAM OFFLINE</p>
           </div>
         )}
       </div>
    </div>
  );
}

// --- COMPACT CARD ---
function CompactCard({ href, icon: Icon, title, description }) {
  const isExternal = href.startsWith('http');

  return (
    <Link 
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      // CHANGED: Surface to slate-800/40, Border to slate-700, Added h-full
      className="group relative flex items-center gap-4 p-4 rounded-lg border border-slate-700 bg-slate-800/40 backdrop-blur-sm 
                 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 overflow-hidden h-full"
    >
      {/* Icon - Fixed Size Box */}
      {/* CHANGED: Icon box to slate-900 border slate-700 */}
      <div className="relative z-10 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-700 text-slate-400 group-hover:text-white group-hover:border-slate-500 transition-all">
        <Icon className="w-5 h-5" />
      </div>

      {/* Text Content */}
      <div className="relative z-10 flex-1 min-w-0">
        <h4 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors truncate">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-slate-400 group-hover:text-slate-300 truncate font-medium mt-0.5">
            {description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ArrowUpRight className="relative z-10 w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
    </Link>
  );
}

// --- FEATURED TOOL CARD (Hero) ---
function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  // CHANGED: Removed Glows and BG colors. Only Borders & Icons indicate status now.
  const styles = {
    critical: {
      border: "border-red-500/50", // Stronger border
      hoverBorder: "hover:border-red-400",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      iconBorder: "border-red-500/20",
      subtext: "text-red-300/80", // Clearer red text
    },
    standard: {
      border: "border-slate-600",
      hoverBorder: "hover:border-slate-400",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      iconBorder: "border-emerald-500/20",
      subtext: "text-emerald-300/80",
    }
  };

  const s = styles[variant];

  return (
    <Link 
      href={href}
      // CHANGED: Unified Surface slate-800/40. No neon gradients.
      className={`group relative h-full min-h-[160px] rounded-xl border ${s.border} bg-slate-800/40 backdrop-blur-sm
                 hover:bg-slate-700/50 ${s.hoverBorder} transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className="relative p-6 flex flex-col justify-between h-full z-20">
        <div className="flex justify-between items-start mb-4">
          <span className={`p-3 rounded-lg ${s.iconBg} ${s.iconColor} border ${s.iconBorder}`}>
            <Icon className="w-6 h-6" />
          </span>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className={`text-sm ${s.subtext} font-mono font-medium uppercase tracking-wider`}>
            {subtitle}
          </p>
        </div>
      </div>
      {/* Removed the glow gradient div entirely */}
    </Link>
  );
}
