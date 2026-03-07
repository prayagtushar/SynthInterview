"use client";

import React from "react";
import { motion } from "framer-motion";

import Link from "next/link";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="fixed top-6 left-1/2 z-50 w-[90%] max-w-4xl"
    >
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex justify-between items-center shadow-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-full" />
          <span className="font-black text-white italic tracking-tighter">
            SYNTH
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[12px] font-bold uppercase tracking-widest text-white/60">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-white transition-colors">
            Workflow
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/session"
            className="text-white/60 hover:text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            Join Session
          </Link>
          <Link
            href="/recruiter"
            className="bg-white text-black px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            Recruiter Portal
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
