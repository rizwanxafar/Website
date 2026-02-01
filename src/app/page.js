// src/app/page.js
import Link from "next/link";
import {
  Activity,
  Plane,
  FileText,
  GraduationCap,
  ArrowUpRight,
  Terminal,
  ShieldAlert,
  Globe,
  ExternalLink
} from "lucide-react";

// --- SERVER SIDE DATA FETCHING ---
async function getGlobalSurveillance() {
  try {
    // STRATEGY: Use rss2json as a bridge to bypass WHO firewalls and strict XML parsing.
    // This converts the XML feed directly into a clean JSON object.
    const FEED_URL = "https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml";
    const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;

    const res = await fetch(API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Feed API responded with ${res.status}`);
    }

    const data = await res.json();

    // If the proxy fails or feed is empty
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Map the cleaner JSON response
    return data.items.slice(0, 5).map(item => ({
      title: item.title,
      // rss2json returns dates like "2024-01-01 12:00:00", we format it
      date: new Date(item.pubDate).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      link: item.link
    }));

  } catch (e) {
    console.error("Global Surveillance Error:", e);
    return []; // Fail gracefully
  }
}

export default async function Home() {
  const newsItems = await getGlobalSurveillance();

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
        
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* 1. WELCOME SECTION */}
          <div className="max-w-4xl">
             {/* Color Logic: Grey base, White highlight */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-600 mb-6">
              Welcome to <span className="text-white">Infectious Diseases</span> Portal
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed font-light">
              High-precision algorithms and local guidelines for Infectious Diseases. 
              Designed for rapid deployment in clinical settings.
            </p>
          </div>

          {/* 2. ACTIVE TOOLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* 3. GLOBAL SURVEILLANCE (NEW WIDGET) */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Global Surveillance // WHO-DON
              </span>
              <div className="h-px flex-1 bg-neutral-900" />
            </div>
            
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/10 overflow-hidden">
               {newsItems.length > 0 ? (
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
                 <div className="p-8 text-center text-neutral-600 text-sm font-mono">
                   {/* If this still appears, the API is temporarily down or rate-limited */}
                   // SYSTEM_OFFLINE: UNABLE TO FETCH FEED (CHECK CONNECTION)
                 </div>
               )}
            </div>
          </div>

          {/* 4. RESOURCES */}
          <div>
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
          </div>

          {/* 5. FOOTER */}
          <div className="pt-12 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600 font-mono">
            <span>ID-NW © 2024</span>
            <a href="mailto:infectionnw@gmail.com" className="hover:text-white transition-colors">
              CONTACT ADMIN
            </a>
          </div>

        </div>
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
