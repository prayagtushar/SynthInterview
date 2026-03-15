"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Globe,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  Layers,
  Hexagon,
} from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const useCases = [
  {
    id: 1,
    title: "Engineering Screening",
    sector: "TALENT OPS",
    description:
      "Precision-engineered screening for elite teams. Transform your pipeline into a high-fidelity data stream.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    benefits: ["Adaptive Levels", "Skill-Matrix"],
    accent: "bg-blue-500/10",
  },
  {
    id: 2,
    title: "Global Distribution",
    sector: "REMOTE HIRE",
    description:
      "Eliminate time-zone friction with 24/7 autonomous assessment. Hire anywhere, verify everywhere with absolute parity.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
          className="opacity-40"
        />
        <path d="M2 12h20" className="opacity-40" />
        <path d="m16 8-4 4 4 4" />
        <path d="m8 8 4 4-4 4" />
      </svg>
    ),
    benefits: ["Zero-Latency", "Universal Bench"],
    accent: "bg-emerald-500/10",
  },
  {
    id: 3,
    title: "Scale Recruiting",
    sector: "CAMPUS",
    description:
      "Identify high-potential talent at industrial scale. Our engine evaluates core DSA fundamentals with human-level nuance.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" className="opacity-40" />
        <path d="M12 11v4" strokeDasharray="2 2" />
      </svg>
    ),
    benefits: ["Mass Eval", "Fast-Track ID"],
    accent: "bg-amber-500/10",
  },
  {
    id: 4,
    title: "Internal Mobility",
    sector: "RETENTION",
    description:
      "Deep-dive into senior-level architectural decision making. Verify trade-offs during internal transition cycles.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <path d="M6 10v4" strokeDasharray="2 2" />
        <path d="M18 10v4" strokeDasharray="2 2" />
      </svg>
    ),
    benefits: ["Trade-off Analytics", "System Thinking"],
    accent: "bg-purple-500/10",
  },
];

export default function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="section-container bg-[#030303] border-t border-white/5 py-32 md:py-48 overflow-hidden"
    >
      <div className="section-inner relative z-10 px-6 sm:px-10 max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col items-center"
        >
          <motion.header
            variants={fadeUpVariants}
            className="mb-32 text-center flex flex-col items-center"
          >
            <div className="section-badge mb-8 gap-2.5">
              <Hexagon size={14} className="text-white/40 flex-shrink-0" />
              <span className="leading-none translate-y-[0.5px]">
                Vertical Solutions
              </span>
            </div>
            <h2 className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1]">
              Built for <span className="font-serif-italic">every</span> team.
            </h2>
            <p className="mt-10 text-white/70 max-w-2xl text-lg md:text-xl leading-relaxed mx-auto group-hover:text-white transition-colors">
              From fast-moving startups to global enterprises—Synth adapts to
              your unique hiring needs.
            </p>
          </motion.header>

          <div className="grid gap-6 md:grid-cols-2 w-full">
            {useCases.map((useCase) => (
              <motion.div
                key={useCase.id}
                variants={fadeUpVariants}
                className="group relative"
              >
                <div className="p-10 lg:p-14 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/20 transition-all duration-700 relative overflow-hidden h-full flex flex-col shadow-xl">
                  {/* Subtle Blueprint Pattern Background */}
                  <div
                    className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(#fff 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />

                  <div className="absolute top-10 right-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-white/50 transition-all">
                    {useCase.sector}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div
                      className={`w-16 h-16 rounded-[1.5rem] ${useCase.accent} border border-white/10 flex items-center justify-center text-white mb-10 shadow-lg p-4 transition-all duration-700 group-hover:scale-110 group-hover:border-white/30 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}
                    >
                      {useCase.icon}
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                      {useCase.title}
                    </h3>

                    <p className="text-white/60 text-base md:text-lg leading-relaxed mb-10 max-w-md group-hover:text-white/80 transition-colors">
                      {useCase.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-auto">
                      {useCase.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="px-5 py-2 rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-all"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
