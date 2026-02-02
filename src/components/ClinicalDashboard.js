"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Plane, FileText, GraduationCap, ArrowUpRight,
  Terminal, ShieldAlert, Globe, Siren, Link as LinkIcon,
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

export default function ClinicalDashboard({ intelData, source, lastSync }) {
  return (
    <main className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black overflow-x-hidden font-sans">
      
      {/* --- PROFESSIONAL HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-neutral-500" />
            <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
              ID-Northwest
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-500 tracking-wider">SYSTEM ONLINE</span>
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
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-600 mb-6">
              Welcome to <span className="text-white">Infectious Diseases</span> Portal
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed font-light">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Radar className="w-3 h-3" />
                GLOBAL SURVEILLANCE // OUTBREAK NEWS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-900 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2">
                 <LiveIntelCard items={intelData} source={source} lastSync={lastSync} />
               </div>
               
               <div className="hidden md:flex border border-white/5 bg-white/5 rounded-xl backdrop-blur-md p-6 flex-col justify-center items-center text-center group hover:border-white/10 transition-colors">
                  <Globe className="w-8 h-8 text-neutral-600 mb-3 opacity-50 group-hover:text-neutral-400 group-hover:opacity-100 transition-all" />
                  <h4 className="text-sm font-medium text-neutral-400">Global Map</h4>
                  <p className="text-xs text-neutral-600 font-mono mt-1">MODULE_OFFLINE</p>
               </div>
            </div>
          </motion.div>

          {/* 4. IMPORTANT LINKS */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3 h-3" />
                IMPORTANT LINKS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-900 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <UplinkCard title="WHO DONs" subtitle="Disease Outbreak News" icon={Globe} href="https://www.who.int/emergencies/disease-outbreak-news" />
              <UplinkCard title="NaTHNaC" subtitle="Travel Health Pro" icon={Plane} href="https://travelhealthpro.org.uk" />
              <UplinkCard title="CDC Travel" subtitle="Notices & Levels" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <UplinkCard title="ProMED-mail" subtitle="Rapid Alerts" icon={Siren} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. RESOURCES */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-3 h-3" />
                Resources
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-900 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ResourceCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive flowcharts for clinical pathways and diagnostics." />
              <ResourceCard href="/guidelines" icon={FileText} title="Guidelines" description="Static reference documents, policy PDFs, and local protocols." />
              <ResourceCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching materials, case studies, and departmental slides." />
            </div>
          </motion.div>

          {/* 6. FOOTER */}
          <motion.div variants={fadeInUp} className="pt-12 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600 font-mono">
            <span>ID-NW © 2024</span>
            <a href="mailto:infectionnw@gmail.com" className="hover:text-white transition-colors">
              CONTACT ADMIN
            </a>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

// --- INTELLIGENCE CARD (Visualizes LIVE vs BACKUP) ---

function LiveIntelCard({ items, source, lastSync }) {
  const hasData = items && items.length > 0;
  const isLive = source === 'LIVE';
  
  // Theme Logic
  const theme = isLive ? {
    border: 'border-emerald-900/30',
    bg: 'bg-emerald-950/5',
    headerBorder: 'border-emerald-900/20',
    headerBg: 'bg-emerald-950/20',
    text: 'text-emerald-500',
    hover: 'hover:bg-emerald-900/10',
    date: 'text-emerald-600 group-hover:text-emerald-400',
    icon: 'text-emerald-800 group-hover:text-emerald-500'
  } : {
    border: 'border-amber-900/30',
    bg: 'bg-amber-950/5',
    headerBorder: 'border-amber-900/20',
    headerBg: 'bg-amber-950/20',
    text: 'text-amber-500',
    hover: 'hover:bg-amber-900/10',
    date: 'text-amber-600 group-hover:text-amber-400',
    icon: 'text-amber-800 group-hover:text-amber-500'
  };

  return (
    <div className={`rounded-xl border backdrop-blur-md overflow-hidden flex flex-col transition-colors duration-500 h-full min-h-[320px]
      ${hasData ? theme.border : 'border-neutral-800'}
      ${hasData ? theme.bg : 'bg-neutral-900/10'}
    `}>
       <div className={`p-4 border-b flex items-center justify-between
         ${hasData ? theme.headerBorder : 'border-neutral-800'}
         ${hasData ? theme.headerBg : 'bg-neutral-900/30'}
       `}>
          <div className="flex items-center gap-2">
            {isLive ? (
              <Radio className={`w-4 h-4 ${theme.text} animate-pulse`} />
            ) : (
              <Database className={`w-4 h-4 ${theme.text}`} />
            )}
            <span className={`text-[10px] font-bold tracking-wider uppercase ${theme.text}`}>
              {isLive ? 'LIVE INTEL FEED' : 'ARCHIVE DATA (BACKUP)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            SYNC: {lastSync}
          </span>
       </div>
       
       <div className={`flex-1 flex flex-col divide-y ${hasData ? (isLive ? 'divide-emerald-900/20' : 'divide-amber-900/20') : 'divide-neutral-800'}`}>
         {hasData ? items.map((item, i) => (
           <a 
             key={i} 
             href={item.link}
             target="_blank"
             rel="noopener noreferrer" 
             className={`flex-1 p-4 transition-colors flex flex-col justify-center gap-1 group ${theme.hover}`}
           >
             <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-neutral-200 group-hover:text-white line-clamp-1 leading-snug">
                  {item.title}
                </p>
                <ArrowUpRight className={`w-3 h-3 flex-shrink-0 ml-2 ${theme.icon}`} />
             </div>
             <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.date}`}>
                {item.date}
             </span>
           </a>
         )) : (
           <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 p-6">
             <Database className="w-8 h-8 mb-2 opacity-20" />
             <p className="text-xs font-mono">DATA STREAM OFFLINE</p>
           </div>
         )}
       </div>
    </div>
  );
}

// --- STANDARD COMPONENTS (Unchanged) ---
function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  const styles = {
    critical: {
      border: "border-red-900/30",
      bg: "bg-red-950/5",
      hoverBg: "hover:bg-red-950/20",
      hoverBorder: "hover:border-red-500/50",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      iconBorder: "border-red-500/20",
      arrowHover: "group-hover:text-red-500",
      textHover: "group-hover:text-red-100",
      subtext: "text-red-200/50",
      glow: "from-red-500/10"
    },
    standard: {
      border: "border-white/10",
      bg: "bg-white/5",
      hoverBg: "hover:bg-white/10",
      hoverBorder: "hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      iconBorder: "border-emerald-500/20",
      arrowHover: "group-hover:text-emerald-500",
      textHover: "group-hover:text-emerald-100",
      subtext: "text-emerald-200/50",
      glow: "from-emerald-500/10"
    }
  };

  const s = styles[variant];

  return (
    <Link 
      href={href}
      className={`group relative h-48 md:h-64 rounded-2xl border ${s.border} ${s.bg} backdrop-blur-md
                 ${s.hoverBg} ${s.hoverBorder} transition-all duration-500 overflow-hidden`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <span className={`p-3 rounded-lg ${s.iconBg} ${s.iconColor} border ${s.iconBorder} backdrop-blur-sm`}>
            <Icon className="w-6 h-6" />
          </span>
          <ArrowUpRight className={`w-5 h-5 text-neutral-700 ${s.arrowHover} transition-colors`} />
        </div>
        <div>
          <h3 className={`text-2xl font-semibold text-white mb-2 ${s.textHover} transition-colors`}>
            {title}
          </h3>
          <p className={`text-sm ${s.subtext} font-mono uppercase tracking-wider`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="absolute inset-0 z-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
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
      className="group relative p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md
                 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-4 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30" />
      <div className="relative z-10 p-2 rounded-lg bg-black/40 border border-white/5 text-neutral-400 group-hover:text-white group-hover:border-white/20 transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <h4 className="text-sm font-medium text-neutral-300 group-hover:text-white truncate transition-colors">
          {title}
        </h4>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono truncate">
          {subtitle}
        </p>
      </div>
      <ArrowUpRight className="relative z-10 w-3 h-3 text-neutral-600 group-hover:text-white transition-colors" />
      <div className="absolute inset-0 z-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
    </a>
  );
}

function ResourceCard({ href, icon: Icon, title, description }) {
  return (
    <Link 
      href={href}
      className="group relative p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md 
                 hover:bg-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      <div className="relative z-10 mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="relative z-10 text-lg font-medium text-white mb-2">{title}</h4>
      <p className="relative z-10 text-sm text-neutral-500 leading-relaxed group-hover:text-neutral-400 transition-colors">
        {description}
      </p>
      <div className="absolute inset-0 z-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
    </Link>
  );
}
