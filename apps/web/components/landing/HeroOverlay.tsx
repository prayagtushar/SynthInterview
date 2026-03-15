"use client";

import React from "react";
import { ArrowRight, Sparkles, Terminal, UserCheck, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/context/AuthContext";

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

export default function HeroOverlay() {
  const { role, isDemoMode } = useAuth();
  const router = useRouter();
  const isAdmin = role === "admin";
  const hasRecruiterAccess = isDemoMode || role === "recruiter" || role === "admin";

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background architectural elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] rounded-full bg-white/[0.02] blur-[120px] -translate-y-1/2" />
        <div className="grid-bg opacity-30 h-full" />
      </div>

      <div className="hero-overlay relative z-10 pt-48 pb-24 md:pt-64 md:pb-48">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="hero-content mx-auto"
        >
          <motion.div
            variants={fadeUpVariants}
            className="section-badge mb-8 gap-2.5"
          >
            <Sparkles size={14} className="text-white/40 flex-shrink-0" />
            <span className="leading-none translate-y-[0.5px]">
              Next-Gen Assessment Engine
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUpVariants}
            className="hero-title text-gradient !text-4xl md:!text-7xl leading-[1.1] mb-12"
          >
            Hire with <span className="font-serif-italic">absolute</span> <br />{" "}
            technical confidence.
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            className="mt-8 text-white/70 max-w-2xl text-lg md:text-xl leading-relaxed mx-auto mb-16 px-6 group-hover:text-white transition-colors"
          >
            Surgical technical screenings powered by autonomous voice AI. Verify
            engineering depth in real-time, at scale.
          </motion.p>

          <motion.div
            variants={fadeUpVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center w-full px-6"
          >
            <Link
              href="/session"
              className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#fff] transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_50px_-5px_rgba(255,255,255,0.4)] hover:scale-[1.02]"
            >
              <Terminal size={16} />
              Try Sandbox
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="group flex items-center gap-3 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl hover:scale-[1.02]"
              >
                <ShieldCheck
                  size={16}
                  className="text-white/60 group-hover:text-white transition-colors"
                />
                Admin Panel
              </Link>
            ) : hasRecruiterAccess ? (
              <Link
                href="/recruiter"
                className="group flex items-center gap-3 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl hover:scale-[1.02]"
              >
                <UserCheck
                  size={16}
                  className="text-white/60 group-hover:text-white transition-colors"
                />
                Launch Console
              </Link>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="group flex items-center gap-3 bg-white/5 border border-white/10 text-white/50 px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl hover:scale-[1.02]"
              >
                <Lock size={16} className="text-white/40" />
                Recruiter Login
              </button>
            )}
          </motion.div>

          {/* Floating Mockup Component */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-32 w-full max-w-5xl px-6 relative"
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="rounded-[2.5rem] border border-white/10 bg-white/[0.015] backdrop-blur-3xl p-3 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.9)] relative overflow-hidden group"
            >
              {/* Browser-like header */}
              <div className="flex items-center justify-between px-10 py-5 border-b border-white/5">
                <div className="flex gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
                </div>
                <div className="px-5 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80 italic">
                    Secure Session Live
                  </span>
                </div>
              </div>

              {/* Mock Content */}
              <div className="grid grid-cols-12 gap-8 p-10 aspect-[16/9]">
                <div className="col-span-8 rounded-[2rem] bg-white/[0.02] border border-white/5 p-12 flex flex-col gap-8 shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all duration-500">
                      <Terminal size={24} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-48 bg-white/30 rounded-full" />
                      <div className="h-1.5 w-32 bg-white/20 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <div className="h-5 w-full bg-white/[0.03] rounded-2xl" />
                    <div className="h-5 w-[90%] bg-white/[0.03] rounded-2xl" />
                    <div className="h-5 w-[95%] bg-white/[0.03] rounded-2xl" />
                    <div className="h-5 w-[85%] bg-white/[0.03] rounded-2xl" />
                  </div>
                </div>

                <div className="col-span-4 flex flex-col gap-8">
                  <div className="flex-1 rounded-[2rem] bg-white/[0.02] border border-white/5 p-10 flex flex-col items-center justify-center relative overflow-hidden group/sub shadow-inner">
                    <div className="absolute inset-0 border border-white/[0.05] rounded-full animate-[spin_30s_linear_infinite] scale-[1.5]" />
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white transition-all shadow-2xl relative z-10">
                      <UserCheck size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="h-1/3 rounded-[2rem] bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-center gap-4 shadow-inner">
                    <div className="h-2 w-3/4 bg-white/20 rounded-full" />
                    <div className="h-1.5 w-full bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
