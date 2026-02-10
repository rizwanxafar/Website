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
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden font-sans">
      
      {/* --- HEADER (Cleaned - No Blinker) --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-slate-400" />
            <span className="font-mono text-sm font-medium tracking-widest text-slate-300 uppercase">
              ID-Northwest
            </span>
          </div>
          {/* REMOVED: System Online Blinker */}
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

          {/* 1. WELCOME SECTION (Reverted Colours) */}
          <motion.div variants={fadeInUp} className="max-w-4xl">
            {/* Reverted: Dark Grey 'Welcome' + White 'Infectious Diseases' */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-600 mb-6">
              Welcome to <span className="text-white">Infectious Diseases</span> Portal
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-normal">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS (Uniform Grid) */}
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
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            <div className="w-full">
               <LiveIntelCard items={intelData} source={source} />
            </div>
          </motion.div>

          {/* 4. IMPORTANT LINKS (Strict Uniform Grid) */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                IMPORTANT LINKS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {/* Uses unified StandardCard component */}
              <StandardCard title="NaTHNaC" icon={Plane} href="https://travelhealthpro.org.uk" />
              <StandardCard title="CDC Travel" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <StandardCard title="ProMED-mail" icon={Siren} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. RESOURCES (Strict Uniform Grid - Same Look) */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-5 h-5" />
                Resources
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
               {/* Uses unified StandardCard component (Descriptions optional, but style matches above) */}
              <StandardCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive flowcharts for clinical pathways and diagnostics." />
              <StandardCard href="/guidelines" icon={FileText} title="Guidelines" description="Static reference documents, policy PDFs, and local protocols." />
              <StandardCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching materials, case studies, and departmental slides." />
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

// --- INTELLIGENCE CARD (Cleaned) ---

function LiveIntelCard({ items, source }) {
  const hasData = items && items.length > 0;
  const isLive = source === 'LIVE';
  
  const theme = isLive ? {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/10',
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
       {/* Removed Blinker & Text from Header */}
       <div className={`p-3 border-b flex items-center justify-between flex-shrink-0 z-10 h-8
         ${hasData ? theme.headerBorder : 'border-slate-800'}
         ${hasData ? theme.headerBg : 'bg-slate-900/50'}
       `}>
          {/* Empty div to maintain spacing if needed, or just kept minimal */}
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
                   <p className="text-base font-semibold text-slate-100 group-hover:text-white leading-snug">
                     {item.title}
                   </p>
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

// --- UNIFIED STANDARD CARD (For Links & Resources) ---
// This replaces UplinkCard and ResourceCard to ensure perfect uniformity
function StandardCard({ href, icon: Icon, title, description }) {
  const isExternal = href.startsWith('http');

  return (
    <Link 
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group relative p-6 h-full rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm 
                 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
      
      {/* Icon */}
      <div className="relative z-10 mb-6 text-slate-500 group-hover:text-white transition-colors">
        <Icon className="w-7 h-7" />
      </div>

      {/* Title */}
      <h4 className="relative z-10 text-lg font-bold text-slate-200 group-hover:text-white mb-2 transition-colors">
        {title}
      </h4>

      {/* Description (Only renders if provided, but layout remains consistent) */}
      {description && (
        <p className="relative z-10 text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors flex-1 font-normal">
          {description}
        </p>
      )}

      {/* Hover Arrow Effect */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <ArrowUpRight className="w-5 h-5 text-slate-400" />
      </div>
    </Link>
  );
}

// --- FEATURED TOOL CARD (Kept distinct as they are "Hero" tools) ---
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
      className={`group relative h-full min-h-[180px] rounded-xl border ${s.border} ${s.bg} backdrop-blur-sm
                 ${s.hoverBg} ${s.hoverBorder} transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />
      
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
