"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Zap,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Code2,
  Terminal,
  BarChart2,
  RefreshCcw,
  Orbit,
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
  {
    label: string;
    count: number;
    time: number;
    color: string;
    bg: string;
    border: string;
    glow: string;
  }
> = {
  Easy: {
    label: "Easy",
    count: 3,
    time: 45,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  Medium: {
    label: "Medium",
    count: 2,
    time: 45,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  Hard: {
    label: "Hard",
    count: 1,
    time: 60,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
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

function RecruiterDashboard() {
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
    <main className="bg-[#030303] min-h-screen flex flex-col relative overflow-hidden text-zinc-100 selection:bg-white/30 selection:text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-violet-600/15 rounded-full blur-[150px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[150px] animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black/95" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center bg-white/[0.02] backdrop-blur-2xl border border-white/5 py-3 px-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-300 text-black shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight uppercase">
              SYNTH
            </span>
          </Link>
          <div className="px-4 py-1.5 text-xs font-bold text-white/40 rounded-full border border-white/5 bg-white/[0.02] uppercase tracking-widest">
            Recruiter Console
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-28 relative z-10">
        <div className="w-full max-w-2xl flex flex-col gap-5">
          {/* Page Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex flex-col items-center text-center pb-4"
          >
            <div className="section-badge gap-2 mb-5">
              <Orbit size={14} className="animate-[spin_4s_linear_infinite]" />{" "}
              AI Assessment Engine
            </div>
            <h1 className="section-title text-gradient mb-2">
              Recruiter Console
            </h1>
            <p className="text-white/50 text-base max-w-xs leading-relaxed font-medium">
              Deploy autonomous AI-driven assessments for your candidates in
              seconds.
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="relative group/card"
          >
            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
            <div className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] px-14 py-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <AnimatePresence mode="wait">
                {!sessionData ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-10 relative z-10"
                  >
                    {/* Candidate Email */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Mail size={12} /> Candidate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="candidate@company.com"
                        className="w-full h-12 bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-white/30 focus:ring-4 focus:ring-white/5 px-5 rounded-2xl text-sm outline-none transition-all placeholder:text-white/20 font-medium text-white"
                      />
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 block">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.keys(DIFFICULTY_META).map((d) => {
                          const info = DIFFICULTY_META[d];
                          const isActive = difficulty === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDifficulty(d)}
                              className={`relative py-4 px-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                                isActive
                                  ? `${info.border} ${info.bg} ${info.glow}`
                                  : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                              }`}
                            >
                              <p
                                className={`font-bold text-base transition-colors ${isActive ? "text-white" : "text-white/60"}`}
                              >
                                {d}
                              </p>
                              {isActive && (
                                <motion.div
                                  layoutId="diff-active"
                                  className="absolute right-4 top-1/2 -translate-y-1/2"
                                >
                                  <CheckCircle2
                                    size={20}
                                    className={info.color}
                                  />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Topic Selection */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-5 shadow-inner">
                      <div className="flex items-center gap-3">
                        <Code2 className="text-white/40" size={16} />
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                          Knowledge Domains
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {DSA_CATEGORIES.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all border duration-300 ${
                              selectedTopics.includes(topic)
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                : "bg-white/[0.03] border-white/5 text-white/50 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Session Preview strip */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-0.5">
                            Questions
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {meta.count}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div>
                          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-0.5">
                            Duration
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {meta.time}
                            <span className="text-sm text-white/30 font-medium ml-1">
                              min
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                          Engine Ready
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !candidateEmail}
                      className="group relative w-full h-14 bg-white text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-xs uppercase tracking-widest overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <RefreshCcw size={18} className="animate-spin" />
                        ) : (
                          <>
                            Deploy Assessment <ChevronRight size={18} />
                          </>
                        )}
                      </span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-10 relative z-10"
                  >
                    <div className="flex flex-col items-center text-center space-y-5">
                      <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
                        <div className="absolute inset-0 rounded-2xl border border-emerald-400/30 animate-ping opacity-20" />
                        <ShieldCheck size={40} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                          Session Ready
                        </h2>
                        <p className="text-white/50 text-sm font-medium">
                          ID:{" "}
                          <span className="font-mono text-emerald-400/80 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded ml-1">
                            {sessionData.sessionId}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 block">
                        Candidate Link
                      </label>
                      <div className="flex flex-col gap-3">
                        <input
                          readOnly
                          value={`${window.location.origin}/session?id=${sessionData.sessionId}`}
                          className="w-full bg-black/50 border border-white/10 px-5 h-12 rounded-2xl text-sm font-mono text-white/60 outline-none shadow-inner"
                        />
                        <button
                          onClick={copyLink}
                          className="w-full h-12 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                        >
                          {copySuccess ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-400"
                            />
                          ) : (
                            <Copy size={16} />
                          )}
                          {copySuccess ? "Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={sendEmailInvite}
                        disabled={isSendingEmail}
                        className="w-full bg-white hover:bg-zinc-100 text-black font-bold h-14 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      >
                        {isSendingEmail ? (
                          <RefreshCcw size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Mail size={16} /> Send Email Invite
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetForm}
                        className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-bold h-12 rounded-2xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                      >
                        New Session
                      </button>
                    </div>

                    <AnimatePresence>
                      {emailStatus === "sent" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 text-emerald-400 bg-emerald-500/[0.06] border border-emerald-500/20 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
                        >
                          <CheckCircle2 size={14} className="shrink-0" /> Invite
                          dispatched successfully
                        </motion.div>
                      )}
                      {emailStatus === "failed" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 text-red-400 bg-red-500/[0.06] border border-red-500/20 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
                        >
                          <AlertCircle size={14} className="shrink-0" />{" "}
                          {emailError || "Failed to send — check API server"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Agent Directive card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="bg-white/[0.02] border border-indigo-500/20 rounded-2xl px-8 py-6 flex items-start gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles
              size={16}
              className="text-indigo-300 mt-0.5 shrink-0 animate-pulse relative z-10"
            />
            <div className="relative z-10">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1.5">
                Agent Directive
              </p>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {difficulty === "Hard"
                  ? "Expecting deep architectural analysis. Optimization constraints strictly enforced."
                  : difficulty === "Easy"
                    ? "Focusing on fundamental implementation and code hygiene."
                    : "Balanced mode: monitoring data structure usage and edge case resilience."}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function RecruiterPage() {
  return (
    <AuthGuard requiredRole="recruiter">
      <RecruiterDashboard />
    </AuthGuard>
  );
}
