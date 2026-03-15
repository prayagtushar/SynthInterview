"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Mail,
  Zap,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  Code2,
  Terminal,
  BarChart2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DSA_CATEGORIES = [
  "Arrays",
  "LinkedList",
  "Trees",
  "Graphs",
  "HashMap",
  "Strings",
  "DP",
  "Stack",
  "Binary Search",
  "Two Pointers",
  "Sliding Window",
];

const DIFFICULTY_META: Record<
  string,
  { label: string; count: number; time: number; color: string }
> = {
  Easy: { label: "Easy", count: 3, time: 45, color: "text-emerald-400" },
  Medium: { label: "Medium", count: 2, time: 45, color: "text-amber-400" },
  Hard: { label: "Hard", count: 1, time: 60, color: "text-red-400" },
};

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

export default function RecruiterDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed">(
    "idle",
  );
  const [emailError, setEmailError] = useState<string | null>(null);

  const [candidateEmail, setCandidateEmail] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [sessionData, setSessionData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const meta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.Medium;

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateEmail,
          difficulty,
          topics: selectedTopics,
        }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      const data = await response.json();
      setSessionData(data);
      setEmailStatus("idle");
      setEmailError(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (!sessionData) return;
    const link = `${window.location.origin}/session?id=${sessionData.sessionId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2200);
  };

  const sendEmailInvite = async () => {
    if (!sessionData) return;
    setIsSendingEmail(true);
    setEmailStatus("idle");
    setEmailError(null);
    try {
      const res = await fetch(
        `${API_BASE}/sessions/${sessionData.sessionId}/send-invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appUrl: window.location.origin }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setEmailStatus("sent");
      } else {
        throw new Error(data.message || "Failed");
      }
    } catch (err: any) {
      setEmailError(err.message || "Could not send invite");
      setEmailStatus("failed");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetForm = () => {
    setSessionData(null);
    setEmailStatus("idle");
    setEmailError(null);
    setCopySuccess(false);
  };

  return (
    <main className="bg-[#030303] min-h-screen relative overflow-hidden">
      {/* Brighter Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/[0.05] rounded-none blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.04] rounded-none blur-[120px] -ml-64 -mb-64" />

      {/* Simplified Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-10 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform duration-500 overflow-hidden border border-white/10">
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
        <div className="flex items-center gap-6">
          <div className="px-6 py-3 border border-white/20 text-[11px] font-black uppercase tracking-[0.3em] text-white bg-white/5">
            Recruiter Portal
          </div>
        </div>
      </nav>

      <section className="section-container pt-48 pb-24">
        <div className="section-inner px-10">
          <motion.header
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="section-header max-w-4xl mb-24"
          >
            <div className="section-badge border-white/20 text-white/90 bg-white/5 uppercase tracking-[0.4em] px-6 py-2">
              Command Center
            </div>
            <h1 className="section-title text-gradient !text-7xl mb-8">
              Technical <span className="font-serif-italic">hiring</span>,
              automated.
            </h1>
            <p className="section-subtitle !text-white/60 max-w-2xl text-xl leading-relaxed">
              Configure and launch AI-powered DSA interview sessions for your
              candidates in seconds.
            </p>
          </motion.header>

          <div className="grid lg:grid-cols-12 gap-16 w-full items-start">
            {/* Left Column: Form Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="lg:col-span-12 xl:col-span-7"
            >
              <div className="glass rounded-none p-16 relative overflow-hidden group border-white/10 bg-white/[0.04] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <AnimatePresence mode="wait">
                  {!sessionData ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-12"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-8">
                        <h2 className="text-4xl font-black text-white tracking-tight">
                          Create Session
                        </h2>
                        <Zap className="text-white/40" size={32} />
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Email Input */}
                        <div className="space-y-5">
                          <label className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60 ml-1">
                            Candidate Email
                          </label>
                          <div className="relative group/input">
                            <Mail
                              className="absolute left-8 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-white transition-colors"
                              size={24}
                            />
                            <input
                              type="email"
                              placeholder="candidate@company.com"
                              value={candidateEmail}
                              onChange={(e) =>
                                setCandidateEmail(e.target.value)
                              }
                              className="w-full bg-black/40 border border-white/20 focus:border-white/50 focus:bg-black/60 rounded-none pl-20 pr-8 py-6 text-white transition-all outline-none placeholder:text-white/20 font-bold text-xl"
                              required
                            />
                          </div>
                        </div>

                        {/* Difficulty Selector */}
                        <div className="space-y-5">
                          <label className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60 ml-1">
                            Interview Intensity
                          </label>
                          <div className="grid grid-cols-3 gap-6">
                            {["Easy", "Medium", "Hard"].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setDifficulty(lvl)}
                                className={`py-6 rounded-none text-[12px] font-black uppercase tracking-widest transition-all border-2 ${
                                  difficulty === lvl
                                    ? "bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                                    : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Topic Toggles */}
                        <div className="space-y-6">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">
                              DSA Focus Areas
                            </label>
                            {selectedTopics.length > 0 && (
                              <button
                                onClick={() => setSelectedTopics([])}
                                type="button"
                                className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors underline decoration-white/20 underline-offset-8"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {DSA_CATEGORIES.map((cat) => {
                              const selected = selectedTopics.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => toggleTopic(cat)}
                                  className={`px-8 py-4 rounded-none text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${
                                    selected
                                      ? "bg-white/20 border-white/50 text-white shadow-xl"
                                      : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                                  }`}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || !candidateEmail.trim()}
                          className="w-full bg-white text-black hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed font-black uppercase tracking-[0.4em] py-8 rounded-none text-[14px] transition-all shadow-[0_30px_70px_-15px_rgba(255,255,255,0.25)] flex items-center justify-center gap-4 active:scale-[0.99] mt-8"
                        >
                          {isLoading ? (
                            <Skeleton className="w-8 h-8 rounded-none bg-black/20" />
                          ) : (
                            <>
                              Initialize Session <ArrowRight size={24} />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-12"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-8">
                        <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                          <CheckCircle2
                            className="text-emerald-400"
                            size={40}
                          />{" "}
                          Session Active
                        </h2>
                        <button
                          onClick={resetForm}
                          className="text-[12px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors bg-white/10 px-8 py-3 border border-white/10"
                        >
                          Back
                        </button>
                      </div>

                      <div className="space-y-12">
                        <div className="bg-white/[0.02] border border-white/10 rounded-none p-16 text-center space-y-8">
                          <div className="text-[12px] font-black uppercase tracking-[0.5em] text-white/40">
                            Magic Access Link
                          </div>
                          <div className="font-mono text-white text-2xl break-all select-all py-10 px-12 bg-black/60 border border-white/10 rounded-none shadow-inner">
                            {window.location.host}/session?id=
                            {sessionData.sessionId}
                          </div>
                          <button
                            onClick={copyLink}
                            className={`px-12 py-5 rounded-none text-[12px] font-black uppercase tracking-widest transition-all border-2 ${
                              copySuccess
                                ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-400"
                                : "bg-white text-black border-white hover:bg-[#f0f0f0]"
                            }`}
                          >
                            <Copy className="inline-block mr-3" size={16} />
                            {copySuccess
                              ? "Link Copied ✓"
                              : "Copy Interview Link"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <button
                            onClick={sendEmailInvite}
                            disabled={isSendingEmail || emailStatus === "sent"}
                            className="flex flex-col items-center justify-center p-12 bg-white/[0.04] border border-white/10 rounded-none hover:bg-white/[0.08] transition-all group"
                          >
                            <div className="w-20 h-20 bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all">
                              {isSendingEmail ? (
                                <Skeleton className="w-8 h-8 rounded-none bg-black/20" />
                              ) : (
                                <Mail size={32} />
                              )}
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-widest text-white tracking-[0.2em]">
                              {emailStatus === "sent"
                                ? "Invite Sent"
                                : "Email Invitation"}
                            </span>
                          </button>

                          <Link
                            href={`/session?id=${sessionData.sessionId}`}
                            className="flex flex-col items-center justify-center p-12 bg-white/[0.04] border border-white/10 rounded-none hover:bg-white/[0.08] transition-all group"
                          >
                            <div className="w-20 h-20 bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all">
                              <Terminal size={32} />
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-widest text-white tracking-[0.2em]">
                              Join Session
                            </span>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right Column: Selected Config Highlight */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="lg:col-span-12 xl:col-span-5 grid gap-12"
            >
              {/* Enhanced Session Config Preview */}
              <div className="glass p-16 rounded-none bg-gradient-to-br from-white/[0.1] to-transparent border border-white/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Terminal size={120} />
                </div>

                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-white/40 mb-16 relative">
                  Session Config
                </h3>

                <div className="space-y-16 relative">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-[11px] font-black uppercase tracking-widest text-white/50">
                        Intensity Level
                      </div>
                      <div
                        className={`text-2xl font-black uppercase tracking-widest ${meta.color}`}
                      >
                        {meta.label}
                      </div>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-none overflow-hidden border border-white/5">
                      <motion.div
                        animate={{
                          width:
                            difficulty === "Easy"
                              ? "33.33%"
                              : difficulty === "Medium"
                                ? "66.66%"
                                : "100%",
                        }}
                        className="h-full bg-white transition-all duration-1000 shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                        Total Scale
                      </div>
                      <div className="text-6xl font-black text-white tracking-tighter">
                        {meta.count}{" "}
                        <span className="text-xl text-white/40 uppercase tracking-[0.2em] font-medium italic">
                          Qs
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                        Time Limit
                      </div>
                      <div className="text-6xl font-black text-white tracking-tighter">
                        {meta.time}{" "}
                        <span className="text-xl text-white/40 uppercase tracking-[0.2em] font-medium italic">
                          Min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                      Security Layers
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { icon: <ShieldCheck size={14} />, text: "Proctored" },
                        { icon: <BarChart2 size={14} />, text: "AI Scored" },
                        { icon: <Code2 size={14} />, text: "Sandboxed" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/5"
                        >
                          {item.icon}
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrity Banner */}
              <div className="rounded-none bg-red-500/[0.05] border border-red-500/30 p-12 flex items-center gap-10 group hover:bg-red-500/[0.1] transition-colors shadow-xl">
                <div className="w-20 h-20 rounded-none bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform border border-red-500/20">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-red-400 uppercase tracking-[0.2em] mb-1">
                    Anti-Cheat Active
                  </h4>
                  <p className="text-sm text-red-400/60 font-medium leading-relaxed max-w-sm">
                    Full integrity suite enabled: Tab switch, face match, and
                    copy-paste detection active.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-24 text-center relative z-10 border-t border-white/5">
        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/20">
          Powered by Synth Interview Engine &bull; Version 2.5.0
        </p>
      </footer>
    </main>
  );
}
