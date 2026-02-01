// src/app/page.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Plane,
  FileText,
  GraduationCap,
  ArrowUpRight,
  Terminal,
  ShieldAlert,
  Globe,
  ExternalLink,
  Wifi,
  AlertCircle
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
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // --- CLIENT-SIDE DATA FETCHING (RAW XML STRATEGY) ---
  useEffect(() => {
    async function fetchNews() {
      try {
        // 1. Target URL
        const FEED_URL = "https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml";
        
        // 2. Use 'AllOrigins' proxy to fetch RAW XML string (Bypasses CORS & format errors)
        const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(FEED_URL)}`;

        const res = await fetch(PROXY_URL);
        if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
        
        const data = await res.json();
        const xmlString = data.contents; // AllOrigins puts the body in 'contents'

        // 3. Parse XML Natively in Browser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        // Check for parse errors
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) throw new Error("XML Parse failed");

        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5);

        const cleanedItems = items.map(item => {
          // Robust extraction that handles CDATA or standard text
          const title = item.querySelector("title")?.textContent || "Update";
          const link = item.querySelector("link")?.textContent || "#";
          const pubDate = item.querySelector("pubDate")?.textContent;

          return {
            title: title.replace("<![CDATA[", "").replace("]]>", "").trim(), // Cleanup
            date: pubDate 
              ? new Date(pubDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Unknown',
            link: link.trim()
          };
        });

        setNewsItems(cleanedItems);
      } catch (e) {
        console.error("Feed Error Details:", e); // Check Console if this fails again
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <main className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black overflow-x-hidden font-sans">
      
      {/* --- PROFESSIONAL HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-900 bg-black/80 backdrop-blur-md">
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

          {/* 3. GLOBAL SURVEILLANCE (ROBUST CLIENT-SIDE WIDGET) */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Global Surveillance // WHO-DON
              </span>
              <div className="h-px flex-1 bg-neutral-900" />
            </div>
            
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/10 overflow-hidden min-h-[120px]">
               {loading ? (
                 // LOADING STATE
                 <div className="p-8 flex flex-col items-center justify-center text-neutral-600 gap-3">
                    <Wifi className="w-5 h-5 animate-pulse opacity-50" />
                    <span className="font-mono text-xs tracking-widest animate-pulse">ESTABLISHING UPLINK...</span>
                 </div>
               ) : newsItems.length > 0 ? (
                 // SUCCESS STATE
                 <div className="divide-y divide-neutral-800/50">
                   {newsItems.map((item, idx) => (
                     <a 
                       key={idx} 
                       href={item.link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="group flex items-start gap-4 p-4 hover:bg-neutral-800/30 transition-colors"
                     >
                       <span className="font-mono text-xs text-neutral-500 whitespace-nowrap pt-1 min-w-[80px]">
                         {item.date}
                       </span>
                       <div className="flex-1">
                         <h4 className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors leading-snug">
                           {item.title}
                         </h4>
                       </div>
                       <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-all" />
                     </a>
                   ))}
                 </div>
               ) : (
                 // ERROR STATE (Now with details)
                 <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                   <div className="flex items-center gap-2 text-red-500/50">
                     <AlertCircle className="w-5 h-5" />
                     <span className="font-mono text-xs tracking-wider">CONNECTION FAILED</span>
                   </div>
                   <p className="text-xs text-neutral-600 font-mono">
                     {errorMsg || "Unable to parse feed data."}
                   </p>
                   <a 
                     href="https://www.who.int/emergencies/disease-outbreak-news" 
                     target="_blank"
                     className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 underline decoration-dotted underline-offset-4"
                   >
                     OPEN MANUAL LINK
                   </a>
                 </div>
               )}
            </div>
          </motion.div>

          {/* 4. RESOURCES */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
                Resources
              </span>
              <div className="h-px flex-1 bg-neutral-900" />
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

// --- REUSABLE COMPONENTS ---

function ToolCard({ href, variant = "standard", icon: Icon, title, subtitle }) {
  const styles = {
    critical: {
      border: "border-red-900/30",
      bg: "bg-neutral-900/20",
      hoverBg: "hover:bg-red-950/10",
      hoverBorder: "hover:border-red-500/50",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      iconBorder: "border-red-500/20",
      arrowHover: "group-hover:text-red-500",
      textHover: "group-hover:text-red-100",
      subtext: "text-red-200/50",
      gradient: "from-red-950/20"
    },
    standard: {
      border: "border-neutral-800",
      bg: "bg-neutral-900/20",
      hoverBg: "hover:bg-emerald-950/10",
      hoverBorder: "hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      iconBorder: "border-emerald-500/20",
      arrowHover: "group-hover:text-emerald-500",
      textHover: "group-hover:text-emerald-100",
      subtext: "text-emerald-200/50",
      gradient: "from-emerald-950/20"
    }
  };

  const s = styles[variant];

  return (
    <Link 
      href={href}
      className={`group relative h-48 md:h-64 rounded-2xl border ${s.border} ${s.bg} 
                 ${s.hoverBg} ${s.hoverBorder} transition-all duration-300 overflow-hidden`}
    >
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <span className={`p-3 rounded-lg ${s.iconBg} ${s.iconColor} border ${s.iconBorder}`}>
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
      <div className={`absolute inset-0 bg-gradient-to-t ${s.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </Link>
  );
}

function ResourceCard({ href, icon: Icon, title, description }) {
  return (
    <Link 
      href={href}
      className="group p-6 rounded-xl border border-neutral-800 bg-black hover:border-neutral-600 transition-all duration-300"
    >
      <div className="mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="text-lg font-medium text-white mb-2">{title}</h4>
      <p className="text-sm text-neutral-500 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
