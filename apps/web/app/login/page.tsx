"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, KeyRound, AlertCircle, UserCheck, LogIn } from "lucide-react";
import { useAuth } from "../../lib/context/AuthContext";
import Link from "next/link";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

function LoginContent() {
  const { role, loading, isDemoMode, signInWithGoogle, activateDemoCode } =
    useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedEmail = searchParams.get("email");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (role === "admin") router.replace("/");
    else if (role === "recruiter") router.replace("/");
    else if (isDemoMode) router.replace("/recruiter");
    else if (role === "candidate") router.replace("/");
  }, [loading, role, isDemoMode, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setSigningIn(false);
    }
  };

  const handleAccessCode = () => {
    const ok = activateDemoCode(accessCode);
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="bg-[#030303] min-h-screen flex flex-col relative overflow-hidden text-zinc-100 selection:bg-white/30 selection:text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-violet-600/15 rounded-full blur-[150px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse"
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
            Sign In
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-28 relative z-10">
        <div className="w-full max-w-lg flex flex-col gap-5">
          {/* Page Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex flex-col items-center text-center pb-4"
          >
            <div className="section-badge gap-2 mb-5">
              <LogIn size={14} /> Welcome Back
            </div>
            <h1 className="section-title text-gradient mb-2">Sign In</h1>
            <p className="text-white/50 text-base max-w-xs leading-relaxed font-medium">
              Technical assessments, elevated.
            </p>
          </motion.div>

          {/* Invite banner */}
          <AnimatePresence>
            {invitedEmail && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl px-6 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-0.5">
                    Invite Approved
                  </p>
                  <p className="text-sm text-emerald-500/80 truncate font-medium">
                    {invitedEmail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="group relative w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="relative z-10">
              {signingIn ? "Authenticating..." : "Continue with Google"}
            </span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] select-none">
              or
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* Secure Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                Access Code
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-white transition-colors duration-300">
                  <KeyRound size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Enter specific clearance code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAccessCode()}
                  className={`w-full h-12 bg-white/[0.03] border ${error ? "border-red-500/50 focus:border-red-400 focus:ring-red-400/20" : "border-white/10 focus:border-white/30 focus:ring-white/10"} hover:border-white/20 focus:ring-4 pl-12 pr-4 rounded-xl text-sm text-white outline-none transition-all placeholder:text-zinc-600 font-medium`}
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-1 flex items-center gap-1.5 text-[11px] font-bold text-red-400 uppercase tracking-wide"
                  >
                    <AlertCircle size={12} /> Invalid access code
                  </motion.div>
                )}
              </div>
            </div>

            <button
              onClick={handleAccessCode}
              className="group relative w-full h-12 bg-zinc-900 overflow-hidden border border-white/5 hover:border-white/20 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] text-[13px] uppercase tracking-wider"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Sign In{" "}
                <LogIn
                  size={14}
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                />
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
