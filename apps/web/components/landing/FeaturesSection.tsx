"use client";

import React from "react";
import {
  Mic,
  Code2,
  ShieldCheck,
  BarChart3,
  Mail,
  AlertTriangle,
  BarChart2,
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

const FEATURES = [
  {
    icon: <Mic />,
    title: "Live AI Voice Interviewer",
    desc: "Powered by Gemini 2.5 Flash Live, the AI conducts the full interview via voice — adapting questions and follow-ups in real time based on how the candidate codes.",
  },
  {
    icon: <Code2 />,
    title: "Multi-Language Editor + Execution",
    desc: "Candidates code in a Monaco editor supporting JS, Python, Java, C++, and Go. Code runs live against structured test cases via sandboxed execution — PASS/FAIL per test case, in real time.",
  },
  {
    icon: <ShieldCheck />,
    title: "Integrity & Proctoring Suite",
    desc: "Tab switch blocking, paste detection, mouse-exit tracking, right-click blocking, and webcam face monitoring all run silently — flagging anomalies directly to the AI and audit log.",
  },
  {
    icon: <BarChart3 />,
    title: "6-Dimension AI Scorecard",
    desc: "The moment the session ends, get scores across Problem Understanding, Algorithm, Code Quality, Communication, Correctness, and Time Management — with AI commentary and hint penalties applied.",
  },
  {
    icon: <Mail />,
    title: "Email Invitations & Session Control",
    desc: "Recruiters configure difficulty and DSA topics, generate a magic link, and send a candidate invite in one click. Full SMTP integration included.",
  },
  {
    icon: <AlertTriangle />,
    title: "Fraud Detection Audit Log",
    desc: "The recruiter dashboard flags terminated sessions with a fraud badge, full incident descriptions, and per-signal counts — tab switches, face anomalies, context losses — for confident, defensible decisions.",
  },
];

const STEPS = [
  {
    id: "01",
    title: "Create & Configure",
    desc: "Recruiter picks difficulty (Easy/Medium/Hard) and DSA topics (Arrays, Trees, DP, etc.), then sends a magic link invite to the candidate via email.",
  },
  {
    id: "02",
    title: "AI Takes the Wheel",
    desc: "Candidate joins the session — the Gemini voice interviewer begins, the Monaco editor opens with test cases, webcam proctoring activates, and integrity signals start streaming.",
  },
  {
    id: "03",
    title: "Review & Decide",
    desc: "The instant 6-dimension scorecard lands in the recruiter dashboard the moment the session ends — with scores, AI commentary, the candidate's final code, and any fraud flags.",
  },
];

export default function FeaturesSection() {
  return (
    <>
      {/* Feature Grid */}
      <section id="features" className="features-section">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="features-inner"
        >
          <motion.header variants={fadeUpVariants} className="features-header">
            <h2 className="features-title">
              The intelligence of a{" "}
              <span className="highlight-serif">senior dev</span>, automated.
            </h2>
            <p className="features-subtitle">
              Every part of a real technical interview — voice, code, execution,
              proctoring, and scoring — automated end-to-end.
            </p>
          </motion.header>

          <div className="features-grid">
            {FEATURES.map((feature, i) => (
              <motion.div
                variants={fadeUpVariants}
                key={i}
                className="feature-card"
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Process Section */}
      <section
        id="workflow"
        className="features-section border-t border-white/5 bg-[#050505]"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          className="features-inner"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <motion.h2
                variants={fadeUpVariants}
                className="features-title text-left"
              >
                The <span className="highlight-serif">workflow</span> built for
                speed.
              </motion.h2>
              <div className="space-y-12 mt-12">
                {STEPS.map((step, i) => (
                  <motion.div
                    variants={fadeUpVariants}
                    key={i}
                    className="flex gap-8 group"
                  >
                    <span className="text-3xl font-black text-white/10 group-hover:text-white/30 transition-colors">
                      {step.id}
                    </span>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                      <p className="text-gray-500 max-w-sm">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              variants={fadeUpVariants}
              className="rounded-3xl border border-white/10 bg-black aspect-square flex items-center justify-center p-8 glow-wrapper"
            >
              <div className="glow-bg" />
              <BarChart2 size={100} className="text-white/20" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <footer className="footer">
        <div className="features-inner">
          <div className="flex justify-between items-center opacity-60">
            <div className="font-black text-white text-xl italic">SYNTH</div>
            <div className="text-xs">
              &copy; 2026 SynthInterview. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
