"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Plane, FileText, GraduationCap, ArrowUpRight,
  ShieldAlert, Siren, Link as LinkIcon, Library, Radar, Database
} from "lucide-react";
import NavBar from "./NavBar";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ClinicalDashboard({ intelData, source }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-12"
        >
          {/* WELCOME */}
          <motion.div variants={fadeInUp} className="max-w-3xl">
            <p className="text-xs font-semibold text-brand dark:text-brandAlt uppercase tracking-widest mb-3">
              Infectious Diseases · North West
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight mb-4">
              Clinical Decision Support
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Algorithms and tools for Infectious Diseases. Built for clinical use.
            </p>
          </motion.div>

          {/* ACTIVE TOOLS */}
          <motion.div variants={fadeInUp}>
            <SectionHeader icon={Activity} label="Clinical Tools" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ToolCard
                href="/algorithms/travel/risk-assessment-returning-traveller"
                variant="critical"
                icon={ShieldAlert}
                title="VHF Risk Assessment"
                subtitle="Rapid screening and risk stratification for returned travellers"
              />
              <ToolCard
                href="/algorithms/travel/travel-history-generator"
                variant="standard"
                icon={Plane}
                title="Travel History Generator"
                subtitle="Structured travel history for clinical documentation"
              />
            </div>
          </motion.div>

          {/* WHO INTELLIGENCE */}
          <motion.div variants={fadeInUp}>
            <SectionHeader icon={Radar} label="WHO Disease Outbreak News" />
            <div className="mt-4">
              <LiveIntelCard items={intelData} source={source} />
            </div>
          </motion.div>

          {/* IMPORTANT LINKS */}
          <motion.div variants={fadeInUp}>
            <SectionHeader icon={LinkIcon} label="Important Links" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <CompactCard title="NaTHNaC" icon={Plane} href="https://travelhealthpro.org.uk" description="National travel health advisory" />
              <CompactCard title="CDC Travel" icon={ShieldAlert} href="https://wwwnc.cdc.gov/travel/notices" description="US CDC travel health notices" />
              <CompactCard title="ProMED-mail" icon={Siren} href="https://promedmail.org/" description="Global infectious disease monitor" />
            </div>
          </motion.div>

          {/* RESOURCES */}
          <motion.div variants={fadeInUp}>
            <SectionHeader icon={Library} label="Resources" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <CompactCard href="/algorithms" icon={Activity} title="Algorithms" description="Interactive clinical pathways" />
              <CompactCard href="/guidelines" icon={FileText} title="Guidelines" description="Local reference documents" />
              <CompactCard href="/teaching" icon={GraduationCap} title="Education" description="Teaching and case studies" />
            </div>
          </motion.div>

          {/* FOOTER */}
          <motion.div
            variants={fadeInUp}
            className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm text-slate-400"
          >
            <span>ID-Northwest &copy; {new Date().getFullYear()}</span>
            <a
              href="mailto:infectionnw@gmail.com"
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Contact
            </a>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function LiveIntelCard({ items, source }) {
  const hasData = items && items.length > 0;
  const isLive = source === "LIVE";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {isLive ? "Live feed" : "Cached data"}
        </span>
        <span className={`text-xs font-semibold ${isLive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {isLive ? "● Live" : "● Offline"}
        </span>
      </div>

      <div className="max-h-[520px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-700/50">
        {hasData ? (
          items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand dark:group-hover:text-slate-100 leading-snug">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {item.date}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-brand dark:group-hover:text-slate-400 transition-colors" />
              </div>
            </a>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Database className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-sm">Feed unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactCard({ href, icon: Icon, title, description }) {
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-brand/40 dark:hover:border-slate-600 hover:shadow-sm transition-all"
    >
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-brand/10 group-hover:text-brand dark:group-hover:text-slate-200 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand dark:group-hover:text-slate-100 transition-colors">
          {title}
        </p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{description}</p>
        )}
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand dark:group-hover:text-slate-400 shrink-0 transition-colors" />
    </Link>
  );
}

function ToolCard({ href, variant, icon: Icon, title, subtitle }) {
  const styles = {
    critical: {
      border: "border-red-200 dark:border-red-900/50",
      hover: "hover:border-red-300 dark:hover:border-red-800",
      iconBg: "bg-red-50 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-500",
      badge: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
      badgeLabel: "Critical",
      arrow: "text-red-300 dark:text-red-800 group-hover:text-red-500 dark:group-hover:text-red-400",
    },
    standard: {
      border: "border-slate-200 dark:border-slate-700",
      hover: "hover:border-brand/30 dark:hover:border-slate-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-500",
      badge: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600",
      badgeLabel: "Tool",
      arrow: "text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300",
    },
  };

  const s = styles[variant];

  return (
    <Link
      href={href}
      className={`group flex flex-col p-6 rounded-xl border ${s.border} ${s.hover} bg-white dark:bg-slate-800/50 hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${s.iconBg}`}>
          <Icon className={`w-5 h-5 ${s.iconColor}`} />
        </div>
        <ArrowUpRight className={`w-4 h-4 transition-colors ${s.arrow}`} />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-brand dark:group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {subtitle}
      </p>
    </Link>
  );
}
