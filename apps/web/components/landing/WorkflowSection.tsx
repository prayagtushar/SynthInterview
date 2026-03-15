"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Workflow,
  Cpu,
  ShieldCheck,
  Code2,
  FileText,
  Activity,
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

const workflowSteps = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" className="opacity-40" />
        <path d="M12 17v4" className="opacity-40" />
        <path d="m9 8 3 3 3-3" />
      </svg>
    ),
    title: "Define Blueprint",
    protocol: "01/CONFIG",
    description:
      "Choose your interview goals. Select difficulty, coding topics, and security settings.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle
          cx="21"
          cy="5"
          r="3"
          fill="currentColor"
          stroke="none"
          className="text-emerald-500 animate-pulse"
        />
      </svg>
    ),
    title: "Live Execution",
    protocol: "02/AGENT",
    description:
      "The AI conducts the interview, adapting to the candidate's code and answers in real-time.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="11" r="3" />
        <path d="m9 14 6-6" className="opacity-40" strokeDasharray="1 1" />
      </svg>
    ),
    title: "Integrity Scan",
    protocol: "03/BIO",
    description:
      "Our security engine monitors for cheating to ensure a fair and honest session for everyone.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-full h-full"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" className="opacity-40" />
        <path d="M8 13h8" className="opacity-40" />
      </svg>
    ),
    title: "6-D Scoring",
    protocol: "04/REPORT",
    description:
      "Get a deep breakdown of skills instantly. Analyze logic, communication, and problem-solving.",
  },
];

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
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
              <Activity size={14} className="text-white/40 flex-shrink-0" />
              <span className="leading-none translate-y-[0.5px]">
                Execution Cycle
              </span>
            </div>
            <h2 className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1]">
              Complete <br />
              <span className="font-serif-italic">end-to-end</span> hiring.
            </h2>
            <p className="mt-10 text-white/70 max-w-2xl text-lg md:text-xl leading-relaxed mx-auto group-hover:text-white transition-colors">
              A professional interview experience designed to scale your
              engineering team with total objectivity.
            </p>
          </motion.header>

          <div className="relative w-full">
            {/* Visual connector line for desktop */}
            <div className="hidden lg:block absolute top-[100px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 w-full relative z-10">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeUpVariants}
                  className="relative group p-10 lg:p-12 rounded-[2rem] border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/20 transition-all duration-700 h-full flex flex-col shadow-lg"
                >
                  <div className="absolute top-10 right-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-white/50 transition-all">
                    {step.protocol}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white/[0.08] transition-all duration-500 mb-10 shadow-lg p-3.5">
                      {step.icon}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      {step.title}
                    </h3>

                    <p className="text-white/60 text-base leading-relaxed mb-10 group-hover:text-white/80 transition-colors duration-500">
                      {step.description}
                    </p>

                    <div className="mt-auto flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 group-hover:text-white/50 transition-all">
                      Protocol Verified{" "}
                      <ArrowRight
                        size={10}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
