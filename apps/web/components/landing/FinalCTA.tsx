"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Terminal, Activity } from "lucide-react";
import Link from "next/link";

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

export default function FinalCTA() {
  return (
    <section className="section-container bg-[#030303] border-t border-white/5 py-32 md:py-48 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="section-inner relative z-10 px-6 sm:px-10 max-w-7xl"
      >
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col items-center text-center"
        >
          <div className="section-badge mb-8 gap-2.5">
            <Activity size={14} className="text-white/40 flex-shrink-0" />
            <span className="leading-none translate-y-[0.5px]">Next Steps</span>
          </div>
          <h2 className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1] mb-12">
            Ready to <span className="font-serif-italic">upgrade</span> <br />{" "}
            your hiring process?
          </h2>
          <p className="mt-8 text-white/70 max-w-2xl text-lg md:text-xl leading-relaxed mx-auto mb-24">
            Join the new standard of technical hiring. Start using our
            AI-powered interview engine today.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col sm:flex-row gap-8 justify-center w-full max-w-5xl mx-auto"
        >
          <Link
            href="/session"
            className="flex-1 flex flex-col items-start gap-8 p-10 lg:p-12 rounded-[2.5rem] border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 group shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white/[0.08] transition-all duration-500 mb-2 shadow-lg p-3.5">
              <Terminal size={24} />
            </div>
            <div className="space-y-3 mt-4">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white transition-colors">
                Try Sandbox
              </h3>
              <p className="text-white/50 text-base md:text-lg font-medium leading-relaxed group-hover:text-white/70 transition-colors">
                Experience the autonomous dialogue as a candidate.
              </p>
            </div>
            <div className="mt-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 group-hover:text-white/60 transition-colors">
              Launch Interface{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </Link>

          <Link
            href="/recruiter"
            className="flex-1 flex flex-col items-start gap-8 p-10 lg:p-12 rounded-[2.5rem] border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20 transition-all duration-500 group shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white/[0.08] transition-all duration-500 mb-2 shadow-lg p-3.5">
              <LayoutDashboard size={24} />
            </div>
            <div className="space-y-3 mt-4">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white transition-colors">
                Recruiter Console
              </h3>
              <p className="text-white/50 text-base md:text-lg font-medium leading-relaxed group-hover:text-white/70 transition-colors">
                Manage sessions and analyze deep-technical scorecards.
              </p>
            </div>
            <div className="mt-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 group-hover:text-white/60 transition-colors">
              Enter Workspace{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
