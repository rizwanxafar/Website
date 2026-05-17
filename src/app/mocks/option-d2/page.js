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
  Search,
  Command,
  Sparkles,
} from "lucide-react";
import { SAMPLE_INTEL } from "../sampleData";

// ---------- Hand-painted-style molecular illustrations (SVG) ----------
// Goodsell-inspired: flat painted colour, lots of small repeated units,
// warm scientific palette. Fully inline so the mock has no asset deps.

function VirusIllustration({ size = 360, className = "" }) {
  // Random-looking but deterministic spike positions
  const spikes = Array.from({ length: 22 }).map((_, i) => {
    const angle = (i / 22) * Math.PI * 2 + (i % 2 === 0 ? 0.07 : -0.05);
    return { angle, r1: 96, r2: 130 + (i % 4) * 3 };
  });
  return (
    <svg
      viewBox="0 0 360 360"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="d2-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#F5E8D4" />
          <stop offset="100%" stopColor="#E9D5B2" />
        </radialGradient>
        <radialGradient id="d2-capsid" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#F5C58A" />
          <stop offset="55%" stopColor="#D88A47" />
          <stop offset="100%" stopColor="#8B4A1F" />
        </radialGradient>
        <radialGradient id="d2-rna" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#3A6E62" />
          <stop offset="100%" stopColor="#1F4038" />
        </radialGradient>
        <filter id="d2-paint">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* atmosphere */}
      <rect width="360" height="360" fill="url(#d2-bg)" />

      {/* floating antibody Y-shapes — companions, not threats */}
      <Antibody x={48} y={52} angle={25} fill="#7BA48F" />
      <Antibody x={300} y={70} angle={-15} fill="#7BA48F" />
      <Antibody x={62} y={300} angle={-30} fill="#7BA48F" />
      <Antibody x={300} y={295} angle={40} fill="#7BA48F" />

      {/* spikes (drawn behind capsid for the back-half, in front for the front) */}
      <g>
        {spikes.map((s, i) => {
          const x1 = 180 + Math.cos(s.angle) * s.r1;
          const y1 = 180 + Math.sin(s.angle) * s.r1;
          const x2 = 180 + Math.cos(s.angle) * s.r2;
          const y2 = 180 + Math.sin(s.angle) * s.r2;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A8541E" strokeWidth="6" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="9" fill="#E07C3A" stroke="#8B4A1F" strokeWidth="1.5" />
              <circle cx={x2 - 2} cy={y2 - 2} r="3" fill="#F5C58A" opacity="0.9" />
            </g>
          );
        })}
      </g>

      {/* capsid */}
      <circle cx="180" cy="180" r="100" fill="url(#d2-capsid)" stroke="#5A2F12" strokeWidth="2" />

      {/* surface stippling — small flat painted units */}
      <g opacity="0.55" filter="url(#d2-paint)">
        {Array.from({ length: 50 }).map((_, i) => {
          const a = (i / 50) * Math.PI * 2;
          const rr = 30 + (i % 5) * 12;
          const cx = 180 + Math.cos(a + i * 0.3) * rr;
          const cy = 180 + Math.sin(a + i * 0.3) * rr;
          return <circle key={i} cx={cx} cy={cy} r="5" fill={i % 3 === 0 ? "#5A2F12" : "#A8541E"} />;
        })}
      </g>

      {/* inner RNA blob suggestion */}
      <g opacity="0.6">
        <circle cx="180" cy="180" r="42" fill="url(#d2-rna)" />
        <path
          d="M 152 188 Q 170 160 188 180 T 215 178"
          stroke="#C8E6DC"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* paint texture overlay */}
      <rect width="360" height="360" filter="url(#d2-paint)" />
    </svg>
  );
}

function Antibody({ x, y, angle = 0, fill = "#7BA48F" }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d="M 0 -22 L 0 0"
        stroke={fill}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 0 0 L -14 14 M 0 0 L 14 14"
        stroke={fill}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="-14" cy="14" r="5" fill={fill} />
      <circle cx="14" cy="14" r="5" fill={fill} />
      <circle cx="0" cy="-22" r="4" fill={fill} />
    </g>
  );
}

// Tiny inline motifs for section headers
function AntibodyMotif({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 6 L16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 16 L8 24 M16 16 L24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8" cy="24" r="3" fill="currentColor" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <circle cx="16" cy="6" r="2.5" fill="currentColor" />
    </svg>
  );
}

function GlobeMotif({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="16" cy="16" rx="5" ry="11" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M5 16 H 27" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="20" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LeafMotif({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M6 26 C 6 12, 18 6, 26 6 C 26 18, 20 26, 6 26 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M6 26 L 22 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PathogenChip({ kind = "virus" }) {
  // little circular motif for outbreak cards
  const palettes = {
    virus: { bg: "#FCE7C8", fg: "#8B4A1F", accent: "#E07C3A" },
    bacterium: { bg: "#DBEAE0", fg: "#2F5C3D", accent: "#6BAA7E" },
    parasite: { bg: "#E2DAF3", fg: "#4B3A78", accent: "#8C70CC" },
  };
  const p = palettes[kind] || palettes.virus;
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={p.bg} />
      {kind === "virus" && (
        <>
          <circle cx="20" cy="20" r="9" fill={p.accent} stroke={p.fg} strokeWidth="1.5" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = 20 + Math.cos(a) * 9;
            const y1 = 20 + Math.sin(a) * 9;
            const x2 = 20 + Math.cos(a) * 15;
            const y2 = 20 + Math.sin(a) * 15;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.fg} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx={x2} cy={y2} r="2" fill={p.fg} />
              </g>
            );
          })}
        </>
      )}
      {kind === "bacterium" && (
        <>
          <rect x="10" y="16" width="20" height="8" rx="4" fill={p.accent} stroke={p.fg} strokeWidth="1.5" />
          <circle cx="14" cy="20" r="1.5" fill={p.fg} />
          <circle cx="20" cy="20" r="1.5" fill={p.fg} />
          <circle cx="26" cy="20" r="1.5" fill={p.fg} />
        </>
      )}
      {kind === "parasite" && (
        <>
          <path
            d="M 12 20 Q 16 10 22 14 Q 30 18 24 26 Q 18 30 12 20 Z"
            fill={p.accent}
            stroke={p.fg}
            strokeWidth="1.5"
          />
          <circle cx="22" cy="17" r="1.5" fill={p.fg} />
        </>
      )}
    </svg>
  );
}

// ---------- Page ----------
export default function OptionD2() {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <NavBar />
      <MockBadge>Option D2 · Molecular illustration</MockBadge>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-20">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-amber-200/60 text-xs font-medium text-amber-800 mb-7 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Illustrated pathogen library · live WHO feed
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[0.98] mb-6"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              The small things
              <br />
              that change <em className="text-[#A8541E]">everything</em>,
              <br />
              made approachable.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
              Algorithms, risk assessments and outbreak intelligence — paired
              with hand-drawn pathogen illustrations to make a complex field
              easier to navigate.
            </p>

            <div className="max-w-lg">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(168,84,30,0.18)] hover:border-amber-300 transition-colors">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  placeholder="Search algorithms, pathogens, guidelines…"
                  className="flex-1 bg-transparent text-sm placeholder:text-slate-400 outline-none"
                />
                <span className="hidden md:inline-flex items-center gap-0.5 text-[11px] text-slate-400 border border-slate-200 rounded-md px-1.5 py-0.5">
                  <Command className="w-3 h-3" />K
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <VirusIllustration size={420} className="drop-shadow-[0_20px_40px_rgba(168,84,30,0.18)]" />
          </div>
        </section>

        {/* FEATURED TOOLS */}
        <section className="mb-20">
          <SectionHeader
            kicker="01"
            motif={<AntibodyMotif className="w-4 h-4 text-[#A8541E]" />}
            title="Featured tools"
            subtitle="Two pathways that handle most calls."
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              href="/algorithms/travel/risk-assessment-returning-traveller"
              tag="Pathway"
              icon={ShieldAlert}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              title="VHF Risk Assessment"
              body="Step-by-step screening for returned travellers with fever. Risk-stratified output ready for the clinical record."
            />
            <FeatureCard
              href="/algorithms/travel/travel-history-generator"
              tag="Documentation"
              icon={Plane}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              title="Travel History Generator"
              body="A structured travel history in under a minute — countries, dates, exposures, risk factors."
            />
          </div>
        </section>

        {/* PATHOGEN LIBRARY teaser */}
        <section className="mb-20">
          <SectionHeader
            kicker="02"
            motif={<AntibodyMotif className="w-4 h-4 text-[#A8541E]" />}
            title="Pathogen library"
            subtitle="Each entry illustrated, with clinical notes and references."
            cta={{ href: "#", label: "Open library" }}
          />
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "SARS-CoV-2", group: "Coronavirus", kind: "virus" },
              { name: "M. tuberculosis", group: "Mycobacterium", kind: "bacterium" },
              { name: "P. falciparum", group: "Apicomplexan", kind: "parasite" },
              { name: "Influenza A H5N1", group: "Orthomyxovirus", kind: "virus" },
            ].map((p) => (
              <Link
                key={p.name}
                href="#"
                className="group flex flex-col items-center p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all text-center"
              >
                <PathogenChip kind={p.kind} />
                <p className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-[#A8541E] transition-colors">
                  {p.name}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-0.5">
                  {p.group}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* OUTBREAK INTEL — with pathogen chips */}
        <section className="mb-20">
          <SectionHeader
            kicker="03"
            motif={<GlobeMotif className="w-4 h-4 text-[#A8541E]" />}
            title="Outbreak intelligence"
            subtitle="Latest from the WHO Disease Outbreak News feed."
            cta={{ href: "#", label: "View all" }}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {SAMPLE_INTEL.slice(0, 4).map((item, i) => {
              const kind = ["virus", "virus", "virus", "parasite"][i % 4];
              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="flex gap-4">
                    <PathogenChip kind={kind} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
                        <SeverityPill level={item.severity} />
                        <span>{item.region}</span>
                        <span className="text-slate-300">·</span>
                        <span>{item.date}</span>
                      </div>
                      <h3
                        className="text-lg font-bold tracking-tight text-slate-900 leading-snug mb-1.5 group-hover:text-[#A8541E] transition-colors"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* REFERENCE */}
        <section className="mb-16">
          <SectionHeader
            kicker="04"
            motif={<LeafMotif className="w-4 h-4 text-[#A8541E]" />}
            title="Reference"
            subtitle="Internal collections and trusted external sources."
          />
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
            <RefRow href="/algorithms" icon={Activity} title="Algorithms" body="Interactive clinical pathways." />
            <RefRow href="/guidelines" icon={FileText} title="Guidelines" body="Local reference documents." />
            <RefRow href="/teaching" icon={GraduationCap} title="Education" body="Teaching and case studies." />
            <RefRow external href="https://travelhealthpro.org.uk" icon={Plane} title="NaTHNaC" body="Travel health advisory." />
            <RefRow external href="https://wwwnc.cdc.gov/travel/notices" icon={ShieldAlert} title="CDC Travel" body="US travel notices." />
            <RefRow external href="https://promedmail.org/" icon={Siren} title="ProMED-mail" body="Global ID monitor." />
          </div>
        </section>

        <footer className="pt-10 border-t border-amber-200/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-500">
          <span>ID North West © {new Date().getFullYear()}</span>
          <span className="text-slate-400">
            For clinical reference use within NHS North West.
          </span>
          <a href="mailto:infectionnw@gmail.com" className="hover:text-slate-700">
            infectionnw@gmail.com
          </a>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ kicker, title, subtitle, cta, motif }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-amber-200/60 pb-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {motif}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {kicker}
          </span>
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {title}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="text-sm font-semibold text-[#A8541E] inline-flex items-center gap-1 whitespace-nowrap pb-1"
        >
          {cta.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function FeatureCard({ href, tag, icon: Icon, iconBg, iconColor, title, body }) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-5">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {tag}
        </span>
      </div>
      <h3
        className="text-xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-[#A8541E] transition-colors"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">{body}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#A8541E]">
        Open
        <ArrowUpRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

function RefRow({ href, icon: Icon, title, body, external }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#A8541E] transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{body}</p>
      </div>
    </Link>
  );
}

function SeverityPill({ level }) {
  const map = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  };
  return (
    <span className={`w-1.5 h-1.5 rounded-full ${map[level] || "bg-slate-400"}`} />
  );
}

function MockBadge({ children }) {
  return (
    <div className="sticky top-16 z-40 bg-amber-50/95 backdrop-blur border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-medium text-amber-800">
        <span>{children}</span>
        <Link href="/mocks" className="underline hover:text-amber-900">
          ← All options
        </Link>
      </div>
    </div>
  );
}
