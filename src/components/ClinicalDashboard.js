"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Plane, FileText, GraduationCap, ArrowUpRight,
  LayoutGrid, ShieldAlert, Stethoscope, Globe, BookOpen,
  Menu, ChevronRight
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

export default function ClinicalDashboard({ intelData }) {
  // We removed 'source' and 'systemStatus' props as requested for a cleaner look
  
  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 selection:bg-slate-700 selection:text-white overflow-x-hidden font-sans">
      
      {/* --- PROFESSIONAL NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <Activity className="w-5 h-5 text-slate-200" />
            </div>
            <span className="text-lg font-semibold text-slate-100 tracking-tight">
              ID-Northwest
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/dashboard" active>Dashboard</NavLink>
            <NavLink href="/algorithms">Algorithms</NavLink>
            <NavLink href="/guidelines">Guidelines</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </div>

          {/* Mobile Menu Icon */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="relative pt-28 pb-24 px-6 max-w-7xl mx-auto">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-10"
        >

          {/* 1. HEADER SECTION */}
          <motion.div variants={fadeInUp} className="border-b border-slate-800 pb-8">
            <h1 className="text-3xl font-semibold text-slate-100 mb-2">
              Clinical Decision Support
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Access high-precision algorithms, local guidelines, and real-time epidemiological data.
            </p>
          </motion.div>

          {/* 2. CLINICAL CALCULATORS (Formerly Active Tools) */}
          <motion.div variants={fadeInUp}>
            <SectionHeader title="Clinical Calculators" icon={Stethoscope} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <ToolCard 
                href="/algorithms/travel/risk-assessment-returning-traveller"
                variant="critical"
                icon={ShieldAlert}
                title="VHF Risk Assessment"
                subtitle="Returning Traveller Protocol"
              />
              <ToolCard 
                href="/algorithms/travel/travel-history-generator"
                variant="standard"
                icon={Plane}
                title="Travel History Generator"
                subtitle="Automated History Taking"
              />
            </div>
          </motion.div>

          {/* 3. EPIDEMIOLOGY FEED (Formerly Intel) */}
          <motion.div variants={fadeInUp}>
             <SectionHeader title="Epidemiology Feed" icon={Globe} />
             <div className="w-full">
               <EpidemiologyFeed items={intelData} />
            </div>
          </motion.div>

          {/* 4. REFERENCE LINKS */}
          <motion.div variants={fadeInUp}>
            <SectionHeader title="External Reference" icon={ArrowUpRight} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <CompactCard title="NaTHNaC" subtitle="Travel Health Pro" icon={Plane} href="https://travelhealthpro.org.uk" />
              <CompactCard title="CDC Travel Notices" subtitle="Global Alerts" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" />
              <CompactCard title="ProMED-mail" subtitle="Program for Monitoring Emerging Diseases" icon={Activity} href="https://promedmail.org/" />
            </div>
          </motion.div>

          {/* 5. KNOWLEDGE BASE (Formerly Resources) */}
          <motion.div variants={fadeInUp}>
            <SectionHeader title="Knowledge Base" icon={BookOpen} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <CompactCard href="/algorithms" icon={LayoutGrid} title="Algorithms" subtitle="Interactive Flowcharts" />
              <CompactCard href="/guidelines" icon={FileText} title="Guidelines" subtitle="Clinical Protocols" />
              <CompactCard href="/teaching" icon={GraduationCap} title="Education" subtitle="Training Materials" />
            </div>
          </motion.div>

          {/* 6. FOOTER */}
          <motion.div variants={fadeInUp} className="pt-12 border-t border-slate-800 flex justify-between items-center text-sm text-slate-500">
            <span>© 2024 Infectious Diseases Northwest</span>
            <a href="mailto:infectionnw@gmail.com" className="hover:text-slate-300 transition-colors">
              Contact Support
            </a>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

// --- SUB-COMPONENTS ---

function NavLink({ href, children, active }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors ${
        active ? "text-white" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-slate-500" />
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}

// --- EPIDEMIOLOGY FEED (Professional List Style) ---
function EpidemiologyFeed({ items }) {
  const hasData = items && items.length > 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 overflow-hidden flex flex-col h-[500px]">
       {/* Feed Header */}
       <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60 flex justify-between items-center">
         <span className="text-sm font-medium text-slate-300">World Health Organization (DON)</span>
         <span className="text-xs text-slate-500">Live Feed</span>
       </div>
       
       <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent divide-y divide-slate-700/50">
         {hasData ? items.map((item, i) => (
           <a 
             key={i} 
             href={item.link}
             target="_blank"
             rel="noopener noreferrer" 
             className="block p-6 hover:bg-slate-800/60 transition-colors group"
           >
             <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                   <h3 className="text-base font-medium text-slate-200 group-hover:text-blue-400 transition-colors mb-2">
                     {item.title}
                   </h3>
                   {item.description && (
                     <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                       {item.description}
                     </p>
                   )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0 pt-1">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap mb-2">
                    {item.date}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
             </div>
           </a>
         )) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
             <Globe className="w-8 h-8 mb-3 opacity-50" />
             <p className="text-sm">Feed Unavailable</p>
           </div>
         )}
       </div>
    </div>
  );
}

// --- COMPACT RESOURCE CARD ---
function CompactCard({ href, icon: Icon, title, subtitle }) {
  const isExternal = href.startsWith('http');

  return (
    <Link 
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-4 p-5 rounded-lg border border-slate-700 bg-slate-800/40 
                 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 h-full"
    >
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-500 group-hover:text-slate-400 mt-1">
          {subtitle}
        </p>
      </div>
      
      {isExternal && (
        <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
      )}
    </Link>
  );
}

// --- FEATURED TOOL CARD (Professional) ---
function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  const styles = {
    critical: {
      accent: "border-l-red-500", // Left border accent instead of full glow
      iconColor: "text-red-500",
      bgHover: "hover:bg-slate-800/80"
    },
    standard: {
      accent: "border-l-blue-500",
      iconColor: "text-blue-500",
      bgHover: "hover:bg-slate-800/80"
    }
  };

  const s = styles[variant];

  return (
    <Link 
      href={href}
      className={`group relative h-full min-h-[140px] rounded-lg border border-slate-700 bg-slate-800/40 border-l-4 ${s.accent}
                 ${s.bgHover} transition-all duration-200 flex flex-col justify-between p-6`}
    >
      <div className="flex justify-between items-start">
        <Icon className={`w-6 h-6 ${s.iconColor}`} />
        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-400 group-hover:text-slate-300">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
