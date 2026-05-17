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
  Camera,
} from "lucide-react";
import { SAMPLE_INTEL } from "../sampleData";

// ---------- Mock EM illustration (SVG, no external assets) ----------
// Fakes a colourised electron-micrograph: a grain-textured organic
// subject inside a soft vignette. Three palettes so the page can carry
// repeated imagery without monotony.
function EMImage({ palette = "violet", className = "", caption }) {
  const palettes = {
    violet: { base: "#1B1430", subject1: "#C97AC6", subject2: "#5B1F65", glow: "#F6CFE6" },
    teal:   { base: "#0E2226", subject1: "#7DD3C7", subject2: "#114B49", glow: "#DBF3EE" },
    amber:  { base: "#2A1A0E", subject1: "#E8B26B", subject2: "#7A3B14", glow: "#F8E1B7" },
  };
  const p = palettes[palette] || palettes.violet;
  const uid = `em-${palette}`;

  return (
    <figure className={className}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full rounded-2xl"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={p.subject2} stopOpacity="0.6" />
            <stop offset="100%" stopColor={p.base} />
          </radialGradient>
          <radialGradient id={`${uid}-subject`} cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.95" />
            <stop offset="40%" stopColor={p.subject1} stopOpacity="0.85" />
            <stop offset="100%" stopColor={p.subject2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-vignette`} cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={palette.length}
            />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* base */}
        <rect width="400" height="400" fill={`url(#${uid}-bg)`} />

        {/* secondary blobs for organic depth */}
        <g filter={`url(#${uid}-blur)`} opacity="0.55">
          <circle cx="120" cy="290" r="55" fill={p.subject1} opacity="0.35" />
          <circle cx="310" cy="120" r="40" fill={p.subject1} opacity="0.28" />
          <circle cx="330" cy="320" r="28" fill={p.glow} opacity="0.22" />
        </g>

        {/* main subject — soft organic capsid */}
        <g filter={`url(#${uid}-blur)`}>
          <ellipse cx="200" cy="200" rx="140" ry="125" fill={`url(#${uid}-subject)`} />
        </g>

        {/* spike-like surface detail */}
        <g opacity="0.6">
          {Array.from({ length: 26 }).map((_, i) => {
            const angle = (i / 26) * Math.PI * 2;
            const r1 = 118;
            const r2 = 138 + (i % 3) * 4;
            const x1 = 200 + Math.cos(angle) * r1;
            const y1 = 200 + Math.sin(angle) * r1;
            const x2 = 200 + Math.cos(angle) * r2;
            const y2 = 200 + Math.sin(angle) * r2;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.glow} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
                <circle cx={x2} cy={y2} r="3.5" fill={p.glow} opacity="0.85" />
              </g>
            );
          })}
        </g>

        {/* grain */}
        <rect width="400" height="400" filter={`url(#${uid}-grain)`} />

        {/* vignette */}
        <rect width="400" height="400" fill={`url(#${uid}-vignette)`} />
      </svg>
      {caption && (
        <figcaption className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500">
          <Camera className="w-3 h-3" />
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ---------- Page ----------
export default function OptionD1() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <NavBar />
      <MockBadge>Option D1 · Museum / EM imagery</MockBadge>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* HERO — split, image right */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-20">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 mb-7 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Updated 14 May · WHO feed live
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[0.98] mb-6"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              A quiet workspace
              <br />
              for <em className="text-brand">infectious disease</em>
              <br />
              decision-making.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
              Algorithms, risk assessments and curated outbreak intelligence —
              assembled by Infectious Diseases North West.
            </p>

            {/* COMMAND BAR */}
            <div className="max-w-lg">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(15,14,71,0.18)] hover:border-slate-300 transition-colors">
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

          <div className="lg:col-span-5 order-1 lg:order-2">
            <EMImage
              palette="violet"
              caption="Pl. I · SARS-CoV-2 spike, colourised EM (placeholder)"
            />
          </div>
        </section>

        {/* FEATURED TOOLS */}
        <section className="mb-20">
          <SectionHeader
            kicker="01"
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

        {/* FEATURED PLATE — "image of the week" treatment */}
        <section className="mb-20">
          <SectionHeader
            kicker="02"
            title="From the image library"
            subtitle="A featured plate each week from the public-domain medical image archive."
            cta={{ href: "#", label: "Browse archive" }}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <EMImage palette="teal" caption="Pl. II · M. tuberculosis (placeholder)" />
            <EMImage palette="amber" caption="Pl. III · Plasmodium falciparum (placeholder)" />
            <EMImage palette="violet" caption="Pl. IV · Influenza A H5N1 (placeholder)" />
          </div>
        </section>

        {/* OUTBREAK GRID — editorial, with small EM thumbnails */}
        <section className="mb-20">
          <SectionHeader
            kicker="03"
            title="Outbreak intelligence"
            subtitle="Latest from the WHO Disease Outbreak News feed."
            cta={{ href: "#", label: "View all" }}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
            {SAMPLE_INTEL.slice(0, 4).map((item, i) => {
              const palette = ["violet", "teal", "amber", "violet"][i % 4];
              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="flex gap-5">
                    <div className="w-24 h-24 shrink-0">
                      <EMImage palette={palette} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
                        <SeverityPill level={item.severity} />
                        <span>{item.region}</span>
                        <span className="text-slate-300">·</span>
                        <span>{item.date}</span>
                      </div>
                      <h3
                        className="text-lg font-bold tracking-tight text-slate-900 leading-snug mb-1.5 group-hover:text-brand transition-colors"
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

        <footer className="pt-10 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-500">
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

function SectionHeader({ kicker, title, subtitle, cta }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-slate-200 pb-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          {kicker}
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
          className="text-sm font-semibold text-brand inline-flex items-center gap-1 whitespace-nowrap pb-1"
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
      className="group flex flex-col p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
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
        className="text-xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-brand transition-colors"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">{body}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand">
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
      className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">
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
