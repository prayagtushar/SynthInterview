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
  Shield,
  Activity,
  UserPlus,
  RefreshCcw,
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../lib/context/AuthContext";
import Link from "next/link";

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
      if (data.success) {
        setEmail("");
      }
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
    <main className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-100 selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-[#18181b] border border-zinc-800 px-8 py-3 rounded-2xl shadow-2xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-black shrink-0 shadow-lg">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Synth <span className="text-zinc-500 font-medium">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="px-5 py-2 hover:bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2 rounded-xl"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 pt-32 pb-24 grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xl">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Administrator</p>
                <p className="text-sm font-bold truncate text-zinc-100">{user?.email}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-zinc-800 space-y-3">
              <Link 
                href="/recruiter"
                className="flex items-center justify-between group p-4 border border-zinc-800 hover:border-zinc-600 transition-all bg-zinc-950 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-zinc-500 group-hover:text-white" />
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Recruiter Portal</span>
                </div>
                <Plus size={16} className="text-zinc-600 group-hover:text-white" />
              </Link>
            </div>
          </div>

          <div className="p-8 border border-zinc-800 bg-[#18181b] rounded-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 px-1">Infrastructure</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400">API ENGINE</span>
                <span className="text-[10px] font-black text-emerald-500/80 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ONLINE
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400">DATABASE</span>
                <span className="text-[10px] font-black text-emerald-500/80 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> STABLE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Invite Recruiter */}
          <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-10 md:p-12 shadow-2xl">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Provision Access</h2>
                  <p className="text-sm text-zinc-500">Invite new recruiters to the platform</p>
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 ml-1">
                    Email address
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="recruiter@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-500 px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-zinc-700"
                    />
                    <button
                      onClick={sendInvite}
                      disabled={sending}
                      className="bg-white hover:bg-zinc-100 text-black px-6 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg flex items-center gap-2"
                    >
                      {sending ? <RefreshCcw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Invite
                    </button>
                  </div>
                </div>

                {emailStatus === "sent" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider"
                  >
                    <CheckCircle2 size={14} /> Invite link dispatched
                  </motion.div>
                )}
                {emailStatus === "failed" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-red-500 bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider"
                  >
                    <AlertCircle size={14} /> Failed to send invite
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          {/* List: Recruiters */}
          <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-10 md:p-12 shadow-2xl">
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Active Team</h2>
                    <p className="text-sm text-zinc-500">Manage recruiter permissions</p>
                  </div>
                </div>
                <button
                  onClick={loadRecruiters}
                  className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
                  title="Refresh list"
                >
                  <RefreshCcw size={16} className={loadingRecruiters ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="pt-2">
                {loadingRecruiters ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-zinc-950/50 border border-zinc-800/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : recruiters.length === 0 ? (
                  <div className="text-center py-20 border border-zinc-800/50 border-dashed rounded-3xl bg-zinc-950/20">
                    <p className="text-sm text-zinc-600 font-medium">No recruiters found in the collective</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recruiters.map((r) => (
                      <motion.div
                        key={r.email}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all flex justify-between items-center group shadow-sm hover:shadow-md"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-100 truncate mb-1">{r.email}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            <CheckCircle2 size={10} className="text-emerald-500/50" />
                            Provisioned {r.addedAt.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="px-3 py-1 border border-zinc-800 bg-zinc-900 text-[9px] font-bold uppercase tracking-widest text-zinc-500 rounded-lg">
                          Active
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  );
}
