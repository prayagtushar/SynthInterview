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
  Orbit
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
  { label: string; count: number; time: number; color: string; bg: string; border: string; glow: string }
> = {
  Easy: { label: "Easy", count: 3, time: 45, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]" },
  Medium: { label: "Medium", count: 2, time: 45, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
  Hard: { label: "Hard", count: 1, time: 60, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]" },
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
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed">("idle");
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
    <main className="bg-[#030303] min-h-screen relative overflow-hidden text-zinc-100 selection:bg-white/30 selection:text-white">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-violet-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black/95" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/[0.02] backdrop-blur-2xl border border-white/5 py-3 px-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-300 text-black shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight uppercase">
              SYNTH
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 text-[11px] font-bold text-white/50 rounded-xl border border-white/5 bg-white/[0.02] uppercase tracking-[0.2em] backdrop-blur-md">
              Command Center
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-40 pb-24 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-8 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <Orbit size={12} className="animate-[spin_4s_linear_infinite]" /> AI Assessment Engine Active
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Provision <span className="text-white/40 italic font-serif">Talent</span> Now.
            </h1>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
              Deploy autonomous AI-driven technical assessments for your candidates in seconds.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Card */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative group/card"
            >
              <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
              <div className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                
                <AnimatePresence mode="wait">
                  {!sessionData ? (
                    <motion.form 
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit} 
                      className="space-y-12 relative z-10"
                    >
                      {/* Candidate Email */}
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                          <Mail size={14} /> Candidate Identity
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/input:text-white transition-colors duration-300">
                            <Zap size={18} />
                          </div>
                          <input
                            type="email"
                            required
                            value={candidateEmail}
                            onChange={(e) => setCandidateEmail(e.target.value)}
                            placeholder="candidate@email.com"
                            className="w-full h-14 bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 pl-14 pr-6 rounded-2xl text-[15px] outline-none transition-all placeholder:text-white/20 font-medium text-white shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Difficulty Selection */}
                      <div className="space-y-6">
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] ml-1 block">Complexity Matrix</label>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                          {Object.keys(DIFFICULTY_META).map((d) => {
                            const info = DIFFICULTY_META[d];
                            const isActive = difficulty === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDifficulty(d)}
                                className={`relative py-5 px-6 rounded-2xl border transition-all duration-300 text-left overflow-hidden group/btn ${
                                  isActive
                                    ? `${info.border} ${info.bg} ${info.glow}`
                                    : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                                }`}
                              >
                                {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-current opacity-50" style={{ color: info.color.split('-')[1] }} />}
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 transition-colors ${isActive ? info.color : "text-white/30"}`}>Tier</p>
                                <p className={`font-bold text-xl transition-colors ${isActive ? "text-white" : "text-white/70"}`}>{d}</p>
                                {isActive && (
                                  <motion.div layoutId="diff-active" className="absolute right-5 top-1/2 -translate-y-1/2">
                                    <CheckCircle2 size={24} className={info.color} />
                                  </motion.div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Topic Selection */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-6 shadow-inner relative overflow-hidden group/domains">
                        <div className="absolute opacity-0 group-hover/domains:opacity-100 transition-opacity duration-700 pointer-events-none -inset-px rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <div className="flex items-center gap-3 relative z-10">
                          <Code2 className="text-white/40" size={18} />
                          <h3 className="text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]">Knowledge Domains</h3>
                        </div>
                        <div className="flex flex-wrap gap-2.5 relative z-10">
                          {DSA_CATEGORIES.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => toggleTopic(topic)}
                              className={`px-4 py-2 text-[11px] font-bold rounded-full transition-all border duration-300 ${
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

                      <button
                        type="submit"
                        disabled={isLoading || !candidateEmail}
                        className="group relative w-full h-14 bg-white text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-[13px] uppercase tracking-widest overflow-hidden"
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
                      className="space-y-12 relative z-10"
                    >
                      <div className="flex flex-col items-center text-center space-y-5">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
                          <div className="absolute inset-0 rounded-2xl border border-emerald-400/30 animate-ping opacity-20" />
                          <ShieldCheck size={40} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Systems Ready</h2>
                          <p className="text-white/50 text-sm font-medium">Session Identifier: <span className="font-mono text-emerald-400/80 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded ml-1">{sessionData.sessionId}</span></p>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/10 p-8 rounded-2xl space-y-8 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Terminal size={100} />
                        </div>
                        <div className="space-y-3 relative z-10">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Secure Transport Link</label>
                          <div className="flex gap-3">
                            <input
                              readOnly
                              value={`${window.location.origin}/session?id=${sessionData.sessionId}`}
                              className="flex-1 bg-black/50 border border-white/10 px-5 h-14 rounded-xl text-sm font-mono text-white/60 outline-none shadow-inner"
                            />
                            <button
                              onClick={copyLink}
                              className="px-6 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white rounded-xl transition-all active:scale-95 duration-200"
                            >
                              {copySuccess ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Copy size={20} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                          <button
                            onClick={sendEmailInvite}
                            disabled={isSendingEmail}
                            className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold h-14 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                          >
                            {isSendingEmail ? (
                              <RefreshCcw size={18} className="animate-spin" />
                            ) : (
                              <>
                                <Mail size={16} /> Dispatch Formal Invite
                              </>
                            )}
                          </button>
                          <button
                            onClick={resetForm}
                            className="px-10 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white font-bold h-14 rounded-xl transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest"
                          >
                            New Session
                          </button>
                        </div>

                        {emailStatus === "sent" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] pt-2 relative z-10"
                          >
                            <CheckCircle2 size={14} /> Link Dispatched to Operations
                          </motion.div>
                        )}
                        {emailStatus === "failed" && (
                          <div className="text-red-400 text-center font-bold text-[10px] uppercase tracking-[0.2em] pt-2 relative z-10">
                            {emailError || "Protocol Error: Transport Failed"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Configuration Summary */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
              
              <div className="flex items-center gap-3 mb-10">
                <Terminal size={20} className="text-white/50" />
                <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Telemetry</h2>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Selected Level</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${meta.color} bg-white/[0.05] px-2.5 py-1 rounded border border-white/[0.05]`}>{difficulty}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Load</p>
                      <p className="text-3xl font-bold text-white tracking-tight">{meta.count}</p>
                    </div>
                    <div className="space-y-1.5 border-l border-white/5 pl-4">
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Window</p>
                      <p className="text-3xl font-bold text-white tracking-tight">{meta.time}<span className="text-sm text-white/30 font-medium ml-1">m</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-5 shadow-inner">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block">Core Services</span>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                        <span className="text-[10px] font-bold text-white/60 tracking-wider">SYNTH_CORE</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 border border-emerald-400/20 bg-emerald-500/10 px-2 rounded tracking-widest uppercase">Secured</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <span className="text-[10px] font-bold text-white/60 tracking-wider">PROCTOR_NET</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 border border-emerald-400/20 bg-emerald-500/10 px-2 rounded tracking-widest uppercase">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 bg-white/[0.02] border border-indigo-500/20 rounded-2xl space-y-3 relative overflow-hidden group/insight">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover/insight:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-2 text-indigo-300 relative z-10">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Agent Directive</span>
                </div>
                <p className="text-[12px] text-white/50 leading-relaxed font-medium relative z-10">
                  {difficulty === "Hard" 
                    ? "Expecting deep architectural analysis. Optimization constraints strictly enforced."
                    : difficulty === "Easy"
                    ? "Focusing on fundamental implementation and code hygiene."
                    : "Balanced mode: monitoring data structure usage and edge case resilience."}
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] hover:border-white/20 rounded-2xl p-6 flex items-center justify-between group cursor-help transition-all duration-300 shadow-[0_16px_32px_-16px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-3">
                <BarChart2 size={18} className="text-white/40 group-hover:text-white/80 transition-colors" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] group-hover:text-white/90 transition-colors">Access Analytics Hub</span>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </motion.div>
          </div>
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
