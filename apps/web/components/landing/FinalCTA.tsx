"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserCheck, Terminal } from "lucide-react";
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
    <section className="features-section border-t border-white/5">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="features-inner max-w-4xl text-center flex flex-column items-center gap-12"
      >
        <motion.header variants={fadeUpVariants} className="mb-4">
          <h2 className="features-title">
            Ready to <span className="highlight-serif">transcend</span>{" "}
            traditional interviews?
          </h2>
          <p className="features-subtitle mx-auto">
            Choose your entry point and experience the future of engineering
            assessments today.
          </p>
        </motion.header>

        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col sm:flex-row gap-6 w-full justify-center"
        >
          <Link
            href="/session"
            className="hero-cta hero-cta-primary btn-glow group flex-1 py-6 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2">
              <Terminal size={24} className="text-black" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">Join a Session</span>
              <span className="text-xs opacity-60 font-medium uppercase tracking-widest">
                {" "}
                Candidate View{" "}
              </span>
            </div>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1 mt-2"
            />
          </Link>

          <Link
            href="/recruiter"
            className="hero-cta hero-cta-secondary group flex-1 py-6 flex flex-col items-center gap-4 text-center border-white/10"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <UserCheck size={24} className="text-white/80" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">Recruiter Portal</span>
              <span className="text-xs opacity-50 font-medium uppercase tracking-widest">
                {" "}
                Dashboard View{" "}
              </span>
            </div>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1 mt-2"
            />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
