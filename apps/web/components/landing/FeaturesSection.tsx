"use client";

import React from "react";
import {
  Monitor,
  MessageSquare,
  ShieldAlert,
  FileText,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";
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

const FEATURES = [
  {
    icon: <Monitor />,
    title: "Real-time Signal Analysis",
    desc: "Our AI monitors keystrokes and editor state in real-time, detecting subtle signals that traditional tools miss.",
  },
  {
    icon: <MessageSquare />,
    title: "Adaptive Dialogue",
    desc: "Intelligent follow-ups based on the candidate’s specific solution path, simulating a world-class senior interviewer.",
  },
  {
    icon: <ShieldAlert />,
    title: "Integrity Monitoring",
    desc: "Behavioral analysis and screen-share monitoring ensure the session remains secure and fair for all parties.",
  },
  {
    icon: <FileText />,
    title: "Instant Scorecard",
    desc: "Get a deep-dive technical report and recording immediately after the session ends. No more waiting.",
  },
];

const STEPS = [
  {
    id: "01",
    title: "Connect Live",
    desc: "Sync your Gemini Live API key and candidate info.",
  },
  {
    id: "02",
    title: "Session Start",
    desc: "The AI takes over with voice, screen-share, and code.",
  },
  {
    id: "03",
    title: "Deep Insights",
    desc: "Review the instant technical scorecard and data.",
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
              Stop wasting expensive engineering hours on screening. Our AI
              handles the heavy lifting with human-level nuance.
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
              <PlayCircle size={100} className="text-white/20" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="features-section">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariants}
          className="features-inner"
        >
          <div className="testimonial-card">
            <p className="testimonial-text">
              "SynthInterview has saved our engineering team over 40 hours a
              week on initial screenings while{" "}
              <span className="text-white">increasing our hire rate</span>. The
              AI's technical depth is truly impressive."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-600" />
              <div className="text-left">
                <div className="font-bold text-white uppercase tracking-widest text-xs">
                  Marcus Chen
                </div>
                <div className="text-gray-500 text-xs">
                  VP of Engineering, CloudScale
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="features-section border-t border-white/5"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="features-inner"
        >
          <motion.header variants={fadeUpVariants} className="features-header">
            <h2 className="features-title">
              Transparent <span className="highlight-serif">pricing</span>.
            </h2>
          </motion.header>

          <div className="pricing-grid">
            <motion.div variants={fadeUpVariants} className="pricing-card">
              <div className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Starter
              </div>
              <div className="text-5xl font-black text-white">Free</div>
              <p className="text-gray-500 text-sm">
                Perfect for small teams and prototyping.
              </p>
              <div className="space-y-4">
                {[
                  "5 Sessions / mo",
                  "Standard AI feedback",
                  "Gemini 1.5 Flash",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <CheckCircle2 size={16} className="text-white/40" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/recruiter"
                className="hero-cta hero-cta-secondary w-full mt-auto text-center"
              >
                Get Started
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUpVariants}
              className="pricing-card featured"
            >
              <div className="text-sm font-bold uppercase tracking-widest text-[#000]/60">
                Scaling
              </div>
              <div className="text-5xl font-black text-black">
                $199<span className="text-lg font-bold">/mo</span>
              </div>
              <p className="text-black/60 text-sm">
                The standard for growing engineering teams.
              </p>
              <div className="space-y-4 font-medium">
                {[
                  "Unlimited Sessions",
                  "Gemini 2.0 Pro",
                  "Custom AI Personas",
                  "Priority API Access",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <CheckCircle2 size={16} className="text-black/80" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/recruiter"
                className="hero-cta hero-cta-primary w-full mt-auto text-center"
              >
                Go Pro
              </Link>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="pricing-card">
              <div className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Enterprise
              </div>
              <div className="text-5xl font-black text-white">Custom</div>
              <p className="text-gray-500 text-sm">
                Dedicated support and custom integrations.
              </p>
              <div className="space-y-4">
                {[
                  "SSO & Security",
                  "SLA Guarantee",
                  "Dedicated AI Training",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <CheckCircle2 size={16} className="text-white/40" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/recruiter"
                className="hero-cta hero-cta-secondary w-full mt-auto text-center"
              >
                Contact Sales
              </Link>
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
