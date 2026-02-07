"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Plane, FileText, GraduationCap, ArrowUpRight,
  Terminal, ShieldAlert, Siren, Library, Radio, Database, Radar, ExternalLink
} from "lucide-react";

// --- ANIMATION CONFIG ---
const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.05 } }
};

export default function ClinicalDashboard({ intelData, source, systemStatus, dataDate }) {
  return (
    <main className="min-h-screen bg-[#050505] text-neutral-200 selection:bg-emerald-500/30 selection:text-emerald-200 font-sans overflow-x-hidden">
      
      {/* --- PROFESSIONAL HEADER --- */}
      {/* Reduced blur, sharper borders, darker background */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
              ID-Northwest <span className="text-neutral-600">//</span> CLINICAL OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-500 tracking-wider">
                    NET: ONLINE
                </span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">
                SYS: {systemStatus}
            </span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="relative pt-28 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* SUBTLE BACKGROUND GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative space-y-12"
        >

          {/* 1. WELCOME SECTION (Cleaner Typography) */}
          <motion.div variants={fadeInUp} className="max-w-4xl pt-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
              Infectious Diseases <span className="text-neutral-500">Portal</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
              Clinical decision support, local guidelines, and real-time surveillance for the Northwest region.
            </p>
          </motion.div>

          {/* 2. ACTIVE TOOLS (Sharper Cards) */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolCard 
              href="/algorithms/travel/risk-assessment-returning-traveller"
              variant="critical"
              icon={ShieldAlert}
              title="VHF Risk Assessment"
              subtitle="Rapid Triage Protocol"
            />
            <ToolCard 
              href="/algorithms/travel/travel-history-generator"
              variant="standard"
              icon={Plane}
              title="Travel History Generator"
              subtitle="Admission Documentation"
            />
          </motion.div>

          {/* 3. INTELLIGENCE DASHBOARD (High Fidelity) */}
          <motion.div variants={fadeInUp}>
             <SectionHeader icon={Radar} title="Global Surveillance" />
             <div className="w-full">
               <LiveIntelCard items={intelData} source={source} dataDate={dataDate} />
             </div>
          </motion.div>

          {/* 4. IMPORTANT LINKS (Reduced - Removed WHO DON) */}
          <motion.div variants={fadeInUp}>
            <SectionHeader icon={ExternalLink} title="External Uplinks" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <UplinkCard title="NaTHNaC" subtitle="Travel Health Pro" icon={Plane} href="https://travelhealthpro.org.uk" />
              <UplinkCard title="CDC Travel" subtitle="Notices & Levels" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <UplinkCard title="ProMED-mail" subtitle="Rapid Alerts" icon={Siren} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. RESOURCES */}
          <motion.div variants={fadeInUp}>
             <SectionHeader icon={Library} title="Clinical Resources" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResourceCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive flowcharts for clinical pathways and diagnostics." />
              <ResourceCard href="/guidelines" icon={FileText} title="Guidelines" description="Static reference documents, policy PDFs, and local protocols." />
              <ResourceCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching materials, case studies, and departmental slides." />
            </div>
          </motion.div>

          {/* 6. FOOTER */}
          <motion.div variants={fadeInUp} className="pt-12 border-t border-white/10 flex justify-between items-center text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
            <span>ID-NW © 2026 // SYSTEM V2.4</span>
            <div className="flex gap-4">
                <a href="#" className="hover:text-neutral-400 transition-colors">Privacy</a>
                <a href="mailto:infectionnw@gmail.com" className="hover:text-white transition-colors">
                Contact Admin
                </a>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

// --- SUB-COMPONENTS ---

function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-2">
            <Icon className="w-4 h-4 text-emerald-500" />
            <span className="font-mono text-xs font-medium text-neutral-400 uppercase tracking-widest">
                {title}
            </span>
        </div>
    )
}

function LiveIntelCard({ items, source, dataDate }) {
  const isLive = source === 'LIVE';
  
  return (
    <div className="rounded-sm border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden flex flex-col h-[550px]">
       {/* HEADER */}
       <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {isLive ? <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> : <Database className="w-3 h-3 text-amber-500" />}
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-300">
              WHO DISEASE OUTBREAK NEWS
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            DATA CURRENT AS OF: <span className="text-neutral-300">{dataDate}</span>
          </span>
       </div>
       
       {/* FEED */}
       <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-600">
         {items.map((item, i) => (
           <a 
             key={i} 
             href={item.link}
             target="_blank"
             rel="noopener noreferrer" 
             className="block p-5 border-b border-white/5 hover:bg-white/5 transition-colors group"
           >
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors leading-snug pr-4">
                  {item.title}
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 whitespace-nowrap pt-1">
                    {item.date}
                </span>
             </div>
             <p className="text-xs text-neutral-400 leading-relaxed font-sans max-w-3xl">
                {item.description}
             </p>
           </a>
         ))}
       </div>
       
       <div className="p-2 border-t border-white/10 bg-black/20 text-center">
         <a 
           href="https://www.who.int/emergencies/disease-outbreak-news"
           target="_blank"
           rel="noopener noreferrer"
           className="text-[10px] font-mono text-neutral-500 hover:text-emerald-500 uppercase tracking-widest transition-colors inline-flex items-center gap-2"
         >
           View Source Database <ArrowUpRight className="w-3 h-3" />
         </a>
       </div>
    </div>
  );
}

function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  const isCritical = variant === "critical";
  return (
    <Link 
      href={href}
      className={`group relative h-40 rounded-sm border transition-all duration-300 overflow-hidden
        ${isCritical 
            ? "border-red-900/30 bg-red-950/5 hover:border-red-500/30 hover:bg-red-900/10" 
            : "border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-white/10"
        }`}
    >
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
            <Icon className={`w-5 h-5 ${isCritical ? "text-red-500" : "text-emerald-500"}`} />
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-neutral-200 group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

function UplinkCard({ title, subtitle, icon: Icon, href }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group p-4 rounded-sm border border-white/10 bg-neutral-900/30 hover:bg-white/5 hover:border-emerald-500/30 transition-all flex items-center gap-3"
    >
      <div className="p-2 bg-black border border-white/5 text-neutral-400 group-hover:text-emerald-500 transition-colors rounded-sm">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
            {title}
        </h4>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
            {subtitle}
        </p>
      </div>
    </a>
  );
}

function ResourceCard({ href, icon: Icon, title, description }) {
  return (
    <Link 
      href={href}
      className="group p-6 rounded-sm border border-white/10 bg-neutral-900/20 hover:bg-white/5 hover:border-white/20 transition-all"
    >
      <Icon className="w-5 h-5 text-neutral-500 group-hover:text-white mb-4 transition-colors" />
      <h4 className="text-sm font-medium text-white mb-2">{title}</h4>
      <p className="text-xs text-neutral-500 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
