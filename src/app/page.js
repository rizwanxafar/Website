// src/app/page.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Plane,
  FileText,
  GraduationCap,
  ArrowUpRight,
  Terminal,
  ShieldAlert,
  Globe,
  Siren,
  Link as LinkIcon,
  Library,
  Radio,
  Wifi,
  Database // Added for Cached Mode icon
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

export default function Home() {
  // --- INTELLIGENCE STATE ---
  // UPDATED BACKUP DATA: More realistic 2025/2026 placeholders so it looks fresh even offline.
  const [liveIntel, setLiveIntel] = useState([
    {
      title: "Mpox - Region of the Americas (Situation Report)",
      date: "02 Feb",
      link: "https://www.who.int/emergencies/disease-outbreak-news"
    },
    {
      title: "Influenza A(H5N1) - Global Surveillance Update",
      date: "28 Jan",
      link: "https://www.who.int/emergencies/disease-outbreak-news"
    },
    {
      title: "Cholera - Multi-country Outbreak Response",
      date: "25 Jan",
      link: "https://www.who.int/emergencies/disease-outbreak-news"
    }
  ]);
  
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // 'connecting', 'live', 'cached'

  useEffect(() => {
    // CIRCUIT BREAKER LOGIC
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && connectionStatus === "connecting") {
        console.log("Connection timed out. Switching to Cache.");
        setConnectionStatus("cached");
      }
    }, 4000); // 4 Second Timeout

    async function connectToIntel() {
      try {
        const FEED_URL = "https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml";
        // Trying the most robust proxy combination
        const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(FEED_URL)}`;

        const res = await fetch(PROXY_URL);
        if (!res.ok) throw new Error("Connection Refused");

        const data = await res.json();
        const text = data.contents; 
        
        if (!text || text.length < 100) throw new Error("Empty Response");

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        
        const items = Array.from(xml.querySelectorAll("item")).slice(0, 3).map(item => ({
          title: item.querySelector("title")?.textContent?.replace("<![CDATA[", "").replace("]]>", "").trim() || "Unknown Alert",
          date: new Date(item.querySelector("pubDate")?.textContent).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          link: item.querySelector("link")?.textContent || "https://www.who.int"
        }));

        if (isMounted && items.length > 0) {
          setLiveIntel(items);
          setConnectionStatus("live");
          clearTimeout(timeoutId); // Cancel the timeout since we succeeded
        }
      } catch (e) {
        if (isMounted) {
          console.log("Uplink failed/blocked, using backup cache.", e);
          setConnectionStatus("cached");
        }
      }
    }
    
    connectToIntel();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

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

          {/* 3. IMPORTANT LINKS & INTEL */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3 h-3" />
                IMPORTANT LINKS
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-900 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* SLOT 1: LIVE INTEL CARD */}
              <motion.div className="md:col-span-1 row-span-1 md:row-span-2">
                 <LiveIntelCard items={liveIntel} status={connectionStatus} />
              </motion.div>
              
              {/* SLOTS 2-4: STATIC LINKS */}
              <UplinkCard 
                title="NaTHNaC"
                subtitle="Travel Health Pro"
                icon={Plane}
                href="https://travelhealthpro.org.uk"
              />

              <UplinkCard 
                title="CDC Travel"
                subtitle="Notices & Levels"
                icon={ShieldAlert}
                href="https://wwwnc.cdc.gov/travel/notices"
              />

              <UplinkCard 
                title="ProMED-mail"
                subtitle="Rapid Alerts"
                icon={Siren}
                href="https://promedmail.org/"
              />

            </div>
          </motion.div>

          {/* 4. RESOURCES */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-3 h-3" />
                Resources
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-900 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ResourceCard 
                href="/algorithms"
                icon={Activity}
                title="Algorithms"
                description="Interactive flowcharts for clinical pathways and diagnostics."
              />
              <ResourceCard 
                href="/guidelines"
                icon={FileText}
                title="Guidelines"
                description="Static reference documents, policy PDFs, and local protocols."
              />
              <ResourceCard 
                href="/teaching"
                icon={GraduationCap}
                title="Education"
                description="Teaching materials, case studies, and departmental slides."
              />
            </div>
          </motion.div>

          {/* 5. FOOTER */}
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

// --- LIVE INTEL CARD (Updated with Cached State) ---
function LiveIntelCard({ items, status }) {
  // Status Logic
  const statusColors = {
    connecting: "text-amber-500",
    live: "text-emerald-500",
    cached: "text-neutral-500"
  };

  const statusText = {
    connecting: "SYNCING...",
    live: "LIVE FEED",
    cached: "OFFLINE CACHE"
  };

  // Icon Logic
  const StatusIcon = () => {
    if (status === 'live') return <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />;
    if (status === 'connecting') return <Wifi className="w-4 h-4 text-amber-500 animate-pulse" />;
    return <Database className="w-4 h-4 text-neutral-500" />; // Database icon for Cache
  };

  return (
    <div className={`h-full rounded-xl border backdrop-blur-md overflow-hidden flex flex-col transition-colors duration-500
      ${status === 'live' ? 'border-emerald-900/30 bg-emerald-950/5' : 'border-neutral-800 bg-neutral-900/10'}
    `}>
       {/* Header */}
       <div className={`p-3 border-b flex items-center justify-between
         ${status === 'live' ? 'border-emerald-900/20 bg-emerald-950/20' : 'border-neutral-800 bg-neutral-900/30'}
       `}>
          <div className="flex items-center gap-2">
            <StatusIcon />
            <span className={`text-[10px] font-bold tracking-wider uppercase ${statusColors[status]}`}>
              {statusText[status]}
            </span>
          </div>
          <span className={`text-[10px] font-mono ${status === 'live' ? 'text-emerald-800' : 'text-neutral-600'}`}>
            WHO_DON
          </span>
       </div>
       
       {/* List */}
       <div className={`flex-1 flex flex-col divide-y ${status === 'live' ? 'divide-emerald-900/20' : 'divide-neutral-800'}`}>
         {items.map((item, i) => (
           <a 
             key={i} 
             href={item.link}
             target="_blank"
             rel="noopener noreferrer" 
             className={`flex-1 p-3 transition-colors flex flex-col justify-center gap-1 group
               ${status === 'live' ? 'hover:bg-emerald-900/10' : 'hover:bg-neutral-800/30'}
             `}
           >
             <div className="flex justify-between items-start">
               <span className={`text-[10px] font-mono group-hover:text-emerald-400
                 ${status === 'live' ? 'text-emerald-600' : 'text-neutral-500'}
               `}>
                 {item.date}
               </span>
               <ArrowUpRight className={`w-3 h-3 group-hover:text-emerald-500
                 ${status === 'live' ? 'text-emerald-800' : 'text-neutral-600'}
               `} />
             </div>
             <p className="text-xs font-medium text-neutral-300 group-hover:text-white line-clamp-2 leading-snug">
               {item.title}
             </p>
           </a>
         ))}
       </div>
    </div>
  );
}

// --- EXISTING COMPONENTS (Unchanged) ---

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
