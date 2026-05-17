import Link from "next/link";
import NavBar from "@/components/NavBar";
import {
  ShieldAlert,
  Plane,
  ArrowUpRight,
  Activity,
  FileText,
  GraduationCap,
  Siren,
  Radar,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { SAMPLE_INTEL } from "../sampleData";

export default function OptionB() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <MockBadge>Option B · Action hero</MockBadge>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* HERO PREAMBLE */}
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-widest text-brand">
            <Stethoscope className="w-3.5 h-3.5" />
            Infectious Diseases North West
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-[1.1] mb-3">
            What do you need to do?
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Start with a clinical tool. Outbreak intelligence and reference
            material sit below.
          </p>
        </div>

        {/* ACTION HERO — tools as the hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          <BigToolCard
            href="/algorithms/travel/risk-assessment-returning-traveller"
            tag="VHF · CRITICAL PATHWAY"
            tagColor="bg-red-50 text-red-700 border-red-100"
            icon={ShieldAlert}
            accent="from-red-50 to-white"
            ring="ring-red-100"
            title="VHF Risk Assessment"
            body="Step-by-step screening for returned travellers with fever. Risk-stratified output, ready to paste into notes."
            cta="Begin assessment"
            ctaColor="bg-red-600 hover:bg-red-700"
          />
          <BigToolCard
            href="/algorithms/travel/travel-history-generator"
            tag="DOCUMENTATION TOOL"
            tagColor="bg-emerald-50 text-emerald-700 border-emerald-100"
            icon={Plane}
            accent="from-emerald-50 to-white"
            ring="ring-emerald-100"
            title="Travel History Generator"
            body="Build a structured travel history in under a minute — countries, dates, exposures, ready for the clinical record."
            cta="Open generator"
            ctaColor="bg-emerald-600 hover:bg-emerald-700"
          />
        </section>

        {/* SECONDARY ACTION ROW */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Quick access
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Common destinations across the site.
              </p>
            </div>
            <Link
              href="/algorithms"
              className="text-sm font-semibold text-brand inline-flex items-center gap-1"
            >
              All tools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickTile href="/algorithms" icon={Activity} label="Algorithms" />
            <QuickTile href="/guidelines" icon={FileText} label="Guidelines" />
            <QuickTile
              href="/teaching"
              icon={GraduationCap}
              label="Education"
            />
            <QuickTile
              external
              href="https://promedmail.org/"
              icon={Siren}
              label="ProMED"
            />
          </div>
        </section>

        {/* OUTBREAK FEED — horizontal scroll cards */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                <Radar className="w-3.5 h-3.5" />
                Outbreak watch · WHO live feed
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                What’s circulating right now
              </h2>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
              14:02
            </span>
          </div>

          <div className="-mx-4 sm:mx-0 overflow-x-auto custom-scrollbar pb-2">
            <div className="flex gap-4 px-4 sm:px-0 snap-x snap-mandatory">
              {SAMPLE_INTEL.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-start shrink-0 w-[300px] group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <SeverityBadge level={item.severity} />
                    <span className="text-[11px] font-medium text-slate-400">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{item.region}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

function BigToolCard({
  href,
  tag,
  tagColor,
  icon: Icon,
  accent,
  ring,
  title,
  body,
  cta,
  ctaColor,
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-7 rounded-2xl bg-gradient-to-br ${accent} border border-slate-200 ring-1 ${ring} hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100">
          <Icon className="w-6 h-6 text-slate-700" />
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagColor}`}
        >
          {tag}
        </span>
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-md">
        {body}
      </p>
      <span
        className={`inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg text-sm font-semibold text-white ${ctaColor} transition-colors`}
      >
        {cta}
        <ArrowUpRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

function QuickTile({ href, icon: Icon, label, external }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-brand/40 hover:shadow-sm transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">
        {label}
      </span>
      <ArrowUpRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
    </Link>
  );
}

function SeverityBadge({ level }) {
  const map = {
    high: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "High" },
    medium: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "Medium" },
    low: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", label: "Low" },
  };
  const s = map[level] || map.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Footer() {
  return (
    <footer className="pt-10 mt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-slate-500">
      <span>ID North West © {new Date().getFullYear()}</span>
      <span className="text-xs text-slate-400">
        For clinical reference use within NHS North West.
      </span>
      <a
        href="mailto:infectionnw@gmail.com"
        className="text-xs hover:text-slate-700"
      >
        infectionnw@gmail.com
      </a>
    </footer>
  );
}

function MockBadge({ children }) {
  return (
    <div className="sticky top-16 z-40 bg-amber-50/95 backdrop-blur border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-medium text-amber-800">
        <span>{children}</span>
        <Link href="/mocks" className="underline hover:text-amber-900">
          ← All options
        </Link>
      </div>
    </div>
  );
}
