"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
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

import Link from "next/link";

export default function HeroOverlay() {
  return (
    <div className="hero-overlay relative overflow-hidden">
      <div className="hero-glow" />

      <motion.div
        className="hero-content relative z-10"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <motion.div
          variants={fadeUpVariants}
          className="hero-badge flex items-center gap-2"
        >
          <Sparkles size={14} className="text-white/80" />
          <span>AI-Powered Technical Interviews</span>
        </motion.div>

        <motion.h1 variants={fadeUpVariants} className="hero-title">
          Conduct <span className="highlight-serif">perfect</span> coding
          interviews.
        </motion.h1>

        <motion.p variants={fadeUpVariants} className="hero-tagline">
          SynthInterview uses AI to monitor code, ask adaptive follow-ups, and
          analyze signals in real time—delivering{" "}
          <span className="text-white">human-level insight</span>
          at software-level speed.
        </motion.p>

        <motion.div variants={fadeUpVariants} className="hero-cta-group">
          <Link
            href="/session"
            className="hero-cta hero-cta-primary btn-glow group"
          >
            Start a Session
            <ArrowRight
              size={18}
              className="ml-1 transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link href="/recruiter" className="hero-cta hero-cta-secondary">
            Recruiter Portal
          </Link>
        </motion.div>

        {/* Mockup Placeholder */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 60 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 1,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                delay: 0.4,
              },
            },
          }}
          className="mt-20 w-full max-w-5xl relative"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="rounded-2xl border border-white/5 bg-white/2 p-4 shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
            <div className="aspect-video rounded-xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center border border-white/5 overflow-hidden shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
              <div className="text-white/10 text-9xl font-black italic select-none">
                SYNTH
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
