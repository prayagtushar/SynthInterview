"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  UserPlus,
  RefreshCcw,
  Trash2,
  ShieldCheck,
  Mail,
  ChevronRight,
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../lib/context/AuthContext";
import Link from "next/link";

interface Recruiter {
  email: string;
  addedAt: Date;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed">("idle");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
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

  const removeRecruiter = async (recruiterEmail: string) => {
    setRemoving(recruiterEmail);
    try {
      await deleteDoc(doc(db, "roles", recruiterEmail));
      setRecruiters((prev) => prev.filter((r) => r.email !== recruiterEmail));
    } catch (err) {
      console.error("Failed to remove recruiter:", err);
    } finally {
      setRemoving(null);
    }
  };

  const sendInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setEmailStatus("idle");
    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      if (data.success) setEmail("");
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
            <span className="font-bold text-lg text-white tracking-tight uppercase">SYNTH</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 text-xs font-bold text-white/40 rounded-full border border-white/5 bg-white/[0.02] uppercase tracking-widest">
              Admin Panel
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors rounded-xl hover:bg-white/5"
            >
              <LogOut size={13} /> Sign Out
            </button>
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
            <ShieldCheck size={14} /> Administrator Access
          </div>
          <h1 className="section-title text-gradient mb-2">
            Admin Panel
          </h1>
          <p className="text-white/50 text-base max-w-xs leading-relaxed font-medium">
            Provision recruiter access and manage the active team.
          </p>
        </motion.div>

        {/* Admin identity strip */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/60 shrink-0">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-0.5">Signed in as</p>
            <p className="text-sm font-semibold text-white/70 truncate">{user?.email}</p>
          </div>
          <Link
            href="/recruiter"
            className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest border border-white/5 hover:border-white/20 rounded-xl transition-all"
          >
            Recruiter Portal <ChevronRight size={12} />
          </Link>
        </motion.div>

        {/* Invite Recruiter Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          className="relative group/card"
        >
          <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
          <div className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Section header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 shrink-0">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Provision Access</h2>
                <p className="text-sm text-white/50 font-medium mt-0.5">Send a 7-day invite link to a new recruiter</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail size={12} /> Recruiter Email
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailStatus("idle");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                    className="w-full h-12 bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-white/30 focus:ring-4 focus:ring-white/5 px-5 rounded-2xl text-sm outline-none transition-all placeholder:text-white/20 font-medium text-white"
                  />
                  <button
                    onClick={sendInvite}
                    disabled={sending || !email.trim()}
                    className="group relative w-full h-14 bg-white text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] disabled:opacity-40 active:scale-[0.98] text-xs uppercase tracking-widest overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {sending ? <RefreshCcw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Send Invite
                    </span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {emailStatus === "sent" && (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-3 text-emerald-400 bg-emerald-500/[0.06] border border-emerald-500/20 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
                  >
                    <CheckCircle2 size={14} className="shrink-0" /> Invite dispatched successfully
                  </motion.div>
                )}
                {emailStatus === "failed" && (
                  <motion.div
                    key="failed"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-3 text-red-400 bg-red-500/[0.06] border border-red-500/20 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
                  >
                    <AlertCircle size={14} className="shrink-0" /> Failed to send — check API server
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Active Recruiters Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          className="relative group/card"
        >
          <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
          <div className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Section header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Active Team
                    <span className="ml-3 text-[11px] font-bold text-white/20 align-middle">
                      {recruiters.length > 0 && `${recruiters.length}`}
                    </span>
                  </h2>
                  <p className="text-sm text-white/50 font-medium mt-0.5">Manage recruiter access permissions</p>
                </div>
              </div>
              <button
                onClick={loadRecruiters}
                disabled={loadingRecruiters}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest border border-white/5 hover:border-white/20 rounded-xl transition-all disabled:opacity-40"
                title="Refresh list"
              >
                <RefreshCcw size={12} className={loadingRecruiters ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {/* List */}
            {loadingRecruiters ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recruiters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-white/5 border-dashed rounded-2xl bg-white/[0.01]">
                <Users size={32} className="text-white/10 mb-4" />
                <p className="text-sm font-medium text-white/30">No recruiters provisioned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {recruiters.map((r) => (
                    <motion.div
                      key={r.email}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] hover:border-white/10 px-6 py-4 rounded-2xl transition-all group"
                    >
                      {/* Avatar + info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white/50 shrink-0">
                          {r.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">{r.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                              Active · Provisioned {r.addedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeRecruiter(r.email)}
                        disabled={removing === r.email}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/30 hover:text-red-400 uppercase tracking-widest border border-transparent hover:border-red-500/20 hover:bg-red-500/[0.06] rounded-xl transition-all disabled:opacity-40 shrink-0"
                      >
                        {removing === r.email ? (
                          <RefreshCcw size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        </div>
      </section>
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
