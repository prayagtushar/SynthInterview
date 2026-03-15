"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Terminal, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="fixed top-8 left-1/2 z-50 w-[95%] max-w-5xl"
    >
      <div className="glass rounded-full px-8 py-3 flex justify-between items-center shadow-2xl border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-[15deg] transition-all duration-500 shadow-xl overflow-hidden rounded-xl border border-white/10">
            <img
              src="/logo.svg"
              alt="SynthInterview Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-black text-2xl text-white italic tracking-tighter">
            SYNTH
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
          <a
            href="#features"
            className="hover:text-white transition-all duration-300 relative group"
          >
            Logic
          </a>
          <a
            href="#workflow"
            className="hover:text-white transition-all duration-300 relative group"
          >
            Cycle
          </a>
          <a
            href="#use-cases"
            className="hover:text-white transition-all duration-300 relative group"
          >
            Solutions
          </a>
          <a
            href="#faq"
            className="hover:text-white transition-all duration-300 relative group"
          >
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/session"
            className="flex items-center gap-2 text-white/60 hover:text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all bg-white/5 border border-white/5 hover:border-white/20"
          >
            <Terminal size={14} />
            Sandbox
          </Link>
          <Link
            href="/recruiter"
            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#fff] transition-all duration-300 shadow-[0_15px_30px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_-5px_rgba(255,255,255,0.4)]"
          >
            <LayoutDashboard size={14} />
            Console
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
