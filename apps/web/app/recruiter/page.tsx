"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

const DIFFICULTY_META: Record<string, { label: string; count: number; time: number; color: string }> = {
  Easy:   { label: "Easy",   count: 3, time: 45, color: "text-emerald-400" },
  Medium: { label: "Medium", count: 2, time: 45, color: "text-amber-400"   },
  Hard:   { label: "Hard",   count: 1, time: 60, color: "text-red-400"     },
};

export default function RecruiterDashboard() {
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
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail, difficulty, topics: selectedTopics }),
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
        }
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
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-zinc-100 flex flex-col items-center p-5 md:p-8 font-sans selection:bg-zinc-700">
      <div className="w-full max-w-2xl space-y-14">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              AI Technical Interviews
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Synth Interview
          </h1>
          <p className="text-zinc-400 text-lg max-w-md">
            Create live DSA coding sessions with an AI senior engineer interviewer.
          </p>
        </header>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!sessionData ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="p-8 md:p-12"
              >
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create New Session</h2>
                    <p className="text-sm text-zinc-400 mt-1">Configure parameters for the candidate</p>
                  </div>
                  <Plus className="w-6 h-6 text-zinc-500" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Candidate Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 block">Candidate Email</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30 rounded-xl px-5 py-4 text-base transition-all outline-none placeholder:text-zinc-600"
                      required
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 block">Difficulty</label>
                    <div className="relative">
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 rounded-xl px-5 py-4 text-base appearance-none cursor-pointer outline-none"
                      >
                        <option value="Easy">Easy — 3 questions · 45 min</option>
                        <option value="Medium">Medium — 2 questions · 45 min</option>
                        <option value="Hard">Hard — 1 question · 60 min (deep dive)</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* DSA Topics Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-300">
                        DSA Focus Areas{" "}
                        <span className="text-zinc-500 font-normal">(optional — leave blank for any)</span>
                      </label>
                      {selectedTopics.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTopics([])}
                          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" /> Clear all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {DSA_CATEGORIES.map((cat) => {
                        const selected = selectedTopics.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleTopic(cat)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                              selected
                                ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-300"
                                : "bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Summary Bar */}
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-2 text-sm text-zinc-400">
                    <span className={`font-semibold ${meta.color}`}>{meta.count} {meta.label} question{meta.count !== 1 ? "s" : ""}</span>
                    {selectedTopics.length > 0 && (
                      <>
                        <span className="text-zinc-600">from:</span>
                        <span className="text-zinc-300">{selectedTopics.join(", ")}</span>
                      </>
                    )}
                    <span className="ml-auto text-zinc-500">· {meta.time} min</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !candidateEmail.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-5 rounded-xl text-base transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Interview Session <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 md:p-12"
              >
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-7 h-7" /> Session Ready
                    </h2>
                    <p className="text-zinc-400 mt-1.5">{candidateEmail}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {sessionData.questionIds?.length ?? 1} question
                      {(sessionData.questionIds?.length ?? 1) !== 1 ? "s" : ""} · {sessionData.timeLimit ?? meta.time} min · {difficulty}
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Magic Link Card */}
                  <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-7 space-y-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Shareable Link
                    </div>
                    <div className="bg-black/60 border border-zinc-800 rounded-lg p-5 font-mono text-sm text-zinc-300 break-all select-all">
                      {window.location.host}/session?id={sessionData.sessionId}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`w-full py-4 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                        copySuccess
                          ? "bg-emerald-600/20 border-emerald-600/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copySuccess ? "✓ Copied to Clipboard" : "Copy Invite Link"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="grid gap-4">
                    <button
                      onClick={sendEmailInvite}
                      disabled={isSendingEmail || emailStatus === "sent"}
                      className={`w-full py-5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 border ${
                        emailStatus === "sent"
                          ? "bg-emerald-900/30 border-emerald-800 text-emerald-300"
                          : emailStatus === "failed"
                            ? "bg-red-950/30 border-red-800 text-red-300"
                            : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                      } disabled:opacity-50`}
                    >
                      {isSendingEmail ? (
                        "Sending..."
                      ) : emailStatus === "sent" ? (
                        "Email Sent ✓"
                      ) : emailStatus === "failed" ? (
                        <>
                          <AlertCircle className="w-5 h-5" /> Retry Email
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" /> Send Email Invite
                        </>
                      )}
                    </button>

                    {emailError && (
                      <p className="text-sm text-red-400 text-center">{emailError}</p>
                    )}

                    <Link
                      href={`/session?id=${sessionData.sessionId}`}
                      className="w-full bg-gradient-to-r from-zinc-100 to-white text-black hover:brightness-110 font-semibold py-5 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/40"
                    >
                      Start / Preview Session <ExternalLink className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={resetForm}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors text-center pt-4"
                    >
                      ← Create Another Session
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <footer className="text-center text-xs text-zinc-600 pt-8 border-t border-zinc-800">
          Synth Interview • Powered by AI • {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
