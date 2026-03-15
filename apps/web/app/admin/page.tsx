"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";
import {
  Zap,
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../lib/context/AuthContext";

interface Recruiter {
  email: string;
  addedAt: Date;
}

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed">("idle");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    setLoadingRecruiters(true);
    try {
      const snap = await getDocs(collection(db, "roles"));
      const list: Recruiter[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.role === "recruiter") {
          list.push({
            email: d.id,
            addedAt:
              data.addedAt instanceof Timestamp
                ? data.addedAt.toDate()
                : new Date(),
          });
        }
      });
      setRecruiters(list);
    } catch (err) {
      console.error("Failed to load recruiters:", err);
      setRecruiters([]);
    } finally {
      setLoadingRecruiters(false);
    }
  };

  const sendInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setEmailStatus("idle");
    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await setDoc(doc(db, "invites", token), {
        email: email.trim().toLowerCase(),
        expiresAt: Timestamp.fromDate(expiresAt),
        used: false,
        createdAt: serverTimestamp(),
      });

      const link = `${window.location.origin}/invite?token=${token}`;

      const res = await fetch(`${API_BASE}/send-recruiter-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), inviteLink: link }),
      });
      const data = await res.json();
      setEmailStatus(data.success ? "sent" : "failed");
    } catch (err) {
      console.error(err);
      setEmailStatus("failed");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-zinc-100 p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Admin Panel
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Synth Interview</h1>
            <p className="text-zinc-500 text-sm">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/recruiter")}
              className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Recruiter Portal
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </header>

        {/* Generate Invite */}
        <section className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-7 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> Invite Recruiter
          </h2>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Recruiter Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="recruiter@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailStatus("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-600/60 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600"
              />
              <button
                onClick={sendInvite}
                disabled={sending || !email.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-sm"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Invite
              </button>
            </div>
          </div>

          {emailStatus === "sent" && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Invite sent to {email}
            </motion.p>
          )}
          {emailStatus === "failed" && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" /> Failed to send email. Check API server.
            </motion.p>
          )}
        </section>

        {/* Active Recruiters */}
        <section className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Active Recruiters
              <span className="text-zinc-600 font-normal text-base">
                ({recruiters.length})
              </span>
            </h2>
            <button
              onClick={loadRecruiters}
              disabled={loadingRecruiters}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
            >
              {loadingRecruiters ? "Loading..." : "Refresh"}
            </button>
          </div>
          {recruiters.length === 0 ? (
            <p className="text-zinc-600 text-sm">No recruiters added yet.</p>
          ) : (
            <ul className="space-y-2">
              {recruiters.map((r) => (
                <li
                  key={r.email}
                  className="flex items-center justify-between px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl"
                >
                  <div>
                    <p className="text-sm text-zinc-200">{r.email}</p>
                    <p className="text-xs text-zinc-600">
                      Added {r.addedAt.toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  );
}
