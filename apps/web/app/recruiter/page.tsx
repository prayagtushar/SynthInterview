"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Zap,
  Clock,
  Code2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Send,
  Plus,
  ChevronRight,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RecruiterDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed">(
    "idle",
  );
  const [emailError, setEmailError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    candidateEmail: "",
    difficulty: "Medium",
    topics: "React, Node.js, Algorithms",
    timeLimit: "45",
  });

  const [sessionData, setSessionData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateEmail: config.candidateEmail,
          difficulty: config.difficulty,
          topics: config.topics.split(",").map((t) => t.trim()),
          timeLimit: parseInt(config.timeLimit) || 45,
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();
      setSessionData(data);
      setEmailStatus("idle");
      setEmailError(null);
    } catch (err) {
      console.error(err);
      // You can add toast here later
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
            Create live coding & AI-driven interview sessions in seconds.
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
                    <h2 className="text-2xl font-bold text-white">
                      Create New Session
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Configure parameters for the candidate
                    </p>
                  </div>
                  <Plus className="w-6 h-6 text-zinc-500" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-9">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 block">
                      Candidate Email
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={config.candidateEmail}
                      onChange={(e) =>
                        setConfig({ ...config, candidateEmail: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30 rounded-xl px-5 py-4 text-base transition-all outline-none placeholder:text-zinc-600"
                      required
                    />
                  </div>

                  {/* Difficulty + Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 block">
                        Difficulty
                      </label>
                      <div className="relative">
                        <select
                          value={config.difficulty}
                          onChange={(e) =>
                            setConfig({ ...config, difficulty: e.target.value })
                          }
                          className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 rounded-xl px-5 py-4 text-base appearance-none cursor-pointer outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 block">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="120"
                        value={config.timeLimit}
                        onChange={(e) =>
                          setConfig({ ...config, timeLimit: e.target.value })
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 rounded-xl px-5 py-4 text-base outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 block">
                      Topics / Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="React, TypeScript, System Design, SQL"
                      value={config.topics}
                      onChange={(e) =>
                        setConfig({ ...config, topics: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 rounded-xl px-5 py-4 text-base transition-all outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !config.candidateEmail.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-5 rounded-xl text-base transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-3 mt-4"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Interview Session{" "}
                        <ArrowRight className="w-5 h-5" />
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
                    <p className="text-zinc-400 mt-1.5">
                      {config.candidateEmail}
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
                      className={`w-full py-4 rounded-xl text-sm font-semibold transition-all border ${
                        copySuccess
                          ? "bg-emerald-600/20 border-emerald-600/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                      }`}
                    >
                      {copySuccess
                        ? "✓ Copied to Clipboard"
                        : "Copy Invite Link"}
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
                      <p className="text-sm text-red-400 text-center">
                        {emailError}
                      </p>
                    )}

                    <Link
                      href={`/session?id=${sessionData.sessionId}`}
                      className="w-full bg-gradient-to-r from-zinc-100 to-white text-black hover:brightness-110 font-semibold py-5 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/40"
                    >
                      Start / Preview Session{" "}
                      <ExternalLink className="w-5 h-5" />
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

        {/* Tiny footer */}
        <footer className="text-center text-xs text-zinc-600 pt-8 border-t border-zinc-800">
          Synth Interview • Powered by AI • {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
