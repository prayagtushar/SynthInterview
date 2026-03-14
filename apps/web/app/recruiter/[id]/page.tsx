"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Code2,
  FileText,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ExternalLink,
  Lock,
  Calendar,
  MousePointer2,
  ScanEye,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RecruiterSessionView() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${id}`);
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setSession(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <XCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Session Error</h1>
        <p className="text-slate-400 mt-2">
          {error || "Could not load session data."}
        </p>
        <button
          onClick={() => router.push("/recruiter")}
          className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const report = session.finalReport || {};
  const integrity = report.integrity || {};
  const scorecard = session.scorecard || null;
  const metrics = scorecard?.metrics || [];

  const statusColor =
    session.status === "COMPLETED"
      ? "text-emerald-400"
      : session.status === "TERMINATED"
        ? "text-rose-400"
        : "text-amber-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Navigation */}
        <button
          onClick={() => router.push("/recruiter")}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mb-8"
        >
          <ChevronLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Sessions
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase ${statusColor}`}
              >
                {session.status}
              </span>
              {session.metadata?.violation_severity === "TERMINATE" && (
                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                  <ShieldAlert size={10} /> Fraud Detected
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              {session.candidateEmail}
            </h1>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <Clock size={14} /> Session ID:{" "}
              <span className="font-mono text-slate-400">{id}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Overall Grade
              </p>
              <p className="text-2xl font-black text-indigo-400 leading-none">
                {scorecard?.overallScore || "N/A"}
              </p>
            </div>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Integrity Score
              </p>
              <p
                className={`text-2xl font-black leading-none ${integrity.cheatDetected ? "text-rose-400" : "text-emerald-400"}`}
              >
                {integrity.cheatDetected ? "FAIL" : "PASS"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Integrity & Metrics */}
          <div className="lg:col-span-1 space-y-8">
            {/* Integrity Audit Log */}
            <section className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="text-rose-400" size={20} /> Integrity
                  Audit
                </h2>
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              </div>

              <div className="space-y-4">
                <AuditItem
                  icon={<Lock size={16} />}
                  label="Tab Switches"
                  value={integrity.tabSwitches || 0}
                  warning={integrity.tabSwitches > 0}
                />
                <AuditItem
                  icon={<MousePointer2 size={16} />}
                  label="Mouse Context Changes"
                  value={integrity.mouseLeaves || 0}
                  warning={integrity.mouseLeaves > 2}
                />
                <AuditItem
                  icon={<ScanEye size={16} />}
                  label="Multiple Faces"
                  value={integrity.faceAnomalies || 0}
                  warning={integrity.faceAnomalies > 0}
                />
              </div>

              {integrity.cheatingAttempts && (
                <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-rose-400 mb-2">
                    Primary Incident
                  </p>
                  <p className="text-xs text-rose-200 leading-relaxed italic">
                    "{integrity.cheatingAttempts}"
                  </p>
                </div>
              )}
            </section>

            {/* Scorecard Mechanics */}
            {scorecard && (
              <section className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <FileText className="text-indigo-400" size={20} /> Skills
                  Matrix
                </h2>
                <div className="space-y-5">
                  {metrics.map((m: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">
                          {m.label}
                        </span>
                        <span className="text-white font-bold">
                          {m.score}/10
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.score * 10}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Code & Commentary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Final Submission */}
            <section className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Code2 className="text-indigo-400" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-none">
                      Final Submission
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                      {session.lastTestLanguage || "JavaScript"} Source
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(integrity.finalCode || "");
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                  {integrity.finalCode ||
                    "// No code was submitted or recorded."}
                </pre>
              </div>
            </section>

            {/* AI Feedback */}
            {scorecard?.feedback && (
              <section className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white mb-4">
                  Interviewer Commentary
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {scorecard.feedback}
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AuditItem({
  icon,
  label,
  value,
  warning,
}: {
  icon: any;
  label: string;
  value: any;
  warning: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
        warning
          ? "bg-rose-500/5 border-rose-500/20"
          : "bg-white/5 border-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-lg ${warning ? "text-rose-400" : "text-slate-500"}`}
        >
          {icon}
        </div>
        <span
          className={`text-xs font-medium ${warning ? "text-rose-200" : "text-slate-400"}`}
        >
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-black ${warning ? "text-rose-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
