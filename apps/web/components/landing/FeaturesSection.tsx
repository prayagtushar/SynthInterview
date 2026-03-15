"use client";

import React from "react";
import {
  Code,
  Zap,
  ShieldCheck,
  BarChart2,
  Maximize2,
  ChevronRight,
  Cpu,
  Fingerprint,
  Radio,
  Scan,
  Database
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function FeaturesSection() {
  return (
    <section id="features" className="section-container border-t border-white/5 bg-[#030303] py-32 md:py-48 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.012] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="section-inner relative z-10 px-6 sm:px-10 max-w-7xl"
      >
        <motion.header variants={fadeUpVariants} className="mb-32 text-center flex flex-col items-center">
          <div className="section-badge mb-8 gap-2.5">
             <Cpu size={14} className="text-white/40 flex-shrink-0" />
             <span className="leading-none translate-y-[0.5px]">Core Capabilities</span>
          </div>
          <h2 className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1]">
            How our AI <span className="font-serif-italic">interviews</span> <br /> the best engineers.
          </h2>
          <p className="mt-8 text-white/40 max-w-2xl text-lg md:text-xl leading-relaxed mx-auto">
            Advanced AI evaluation and live coding environments built into one seamless platform.
          </p>
        </motion.header>

        <div className="grid gap-8 md:grid-cols-12 md:grid-rows-6 w-full">
          {/* Main Feature: AI Voice Agent */}
          <motion.div
            variants={fadeUpVariants}
            className="md:col-span-12 lg:col-span-12 lg:row-span-3 rounded-[2.5rem] p-10 lg:p-14 border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-700 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000 group-hover:scale-110 pointer-events-none">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-[500px] h-[500px]">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
               </svg>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1 space-y-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white shadow-lg group-hover:text-emerald-500 transition-all duration-500 p-4">
                     <Radio size={28} />
                   </div>
                   <div className="px-5 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 italic">Active Feed</span>
                   </div>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                    Interactive <br /> Voice AI
                  </h3>
                  <p className="text-white/70 text-lg md:text-xl leading-relaxed max-w-lg group-hover:text-white transition-colors">
                    The AI talks to candidates in real-time, asking deep technical questions and following up based on their answers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                   {["0.05s LATENCY", "REAL-TIME ASR", "VOICE SYNTH V2"].map(tag => (
                      <span key={tag} className="px-5 py-2 rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{tag}</span>
                   ))}
                </div>
              </div>
              
              <div className="w-full md:w-[300px] aspect-square relative flex items-center justify-center bg-white/[0.01] rounded-[2rem] border border-white/[0.02]">
                 <div className="absolute inset-0 border border-white/[0.05] rounded-full animate-[spin_30s_linear_infinite]" />
                 <div className="absolute inset-6 border border-white/[0.02] rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                 <div className="flex items-end gap-2.5 h-20">
                    {[1,2,3,4,5,6,7,8].map(i => (
                       <motion.div 
                          key={i} 
                          animate={{ height: ["20%", "100%", "40%", "90%", "20%"] }} 
                          transition={{ duration: 1 + (i * 0.1), repeat: Infinity, ease: "easeInOut" }} 
                          className="w-1.5 bg-white/20 rounded-full" 
                       />
                    ))}
                 </div>
                 <div className="absolute bottom-6 text-[8px] font-black text-white/10 tracking-[0.4em] uppercase">Processing Units</div>
              </div>
            </div>
          </motion.div>

          {/* Feature: Integrity */}
          <motion.div
            variants={fadeUpVariants}
            className="md:col-span-12 lg:col-span-6 lg:row-span-3 rounded-[2.5rem] p-10 border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-700 group shadow-lg flex flex-col justify-between"
          >
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
               <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>
            <div className="flex justify-between items-start relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-8 group-hover:text-amber-500 transition-all duration-500 p-3.5">
                  <Fingerprint size={24} />
               </div>
               <div className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">BIO-VERIFIED</div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Smart Proctoring</h3>
              <p className="text-white/60 text-base md:text-lg leading-relaxed group-hover:text-white/80 transition-colors">
                 Continuous fraud detection that monitors video, screen, and browser activity to ensure interview integrity.
              </p>
            </div>
          </motion.div>

          {/* Feature: Scoring */}
          <motion.div
            variants={fadeUpVariants}
            className="md:col-span-12 lg:col-span-6 lg:row-span-3 rounded-[2.5rem] p-10 border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-700 group shadow-lg flex flex-col justify-between"
          >
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
               <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
               <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-px bg-white/10 mb-8 w-full" />
                  ))}
               </div>
            </div>
            <div className="flex justify-between items-start relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-8 group-hover:text-blue-500 transition-all duration-500 p-3.5">
                  <Database size={24} />
               </div>
               <div className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">6-D MATRIX</div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Detailed Reports</h3>
              <p className="text-white/60 text-base md:text-lg leading-relaxed group-hover:text-white/80 transition-colors">
                 Get an instant breakdown of candidate skills, code logic, and communication depth with clear, objective scores.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
