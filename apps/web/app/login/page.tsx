"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, KeyRound, ArrowRight, AlertCircle, UserCheck } from "lucide-react";
import { useAuth } from "../../lib/context/AuthContext";

function LoginContent() {
  const { role, loading, isDemoMode, signInWithGoogle, activateDemoCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedEmail = searchParams.get("email");
  const [demoCode, setDemoCode] = useState("");
  const [demoError, setDemoError] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (role === "admin") router.replace("/admin");
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

  const handleDemoCode = () => {
    const ok = activateDemoCode(demoCode);
    if (!ok) {
      setDemoError(true);
      setTimeout(() => setDemoError(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-10 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              AI Technical Interviews
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Recruiter Portal
          </h1>
          <p className="text-zinc-500 text-sm">Sign in with your authorized Google account</p>
        </div>

        {/* Invite welcome banner */}
        {invitedEmail && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 bg-emerald-600/10 border border-emerald-600/30 rounded-xl px-4 py-3"
          >
            <UserCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">Recruiter access activated</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sign in with <span className="text-zinc-200">{invitedEmail}</span> to access the portal.
              </p>
            </div>
          </motion.div>
        )}

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-8">
          {/* Google Sign In */}
          <div className="space-y-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-semibold py-4 rounded-xl transition-all disabled:opacity-60"
            >
              {signingIn ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                /* Google icon */
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {signingIn ? "Signing in..." : "Sign in with Google"}
            </button>
            <p className="text-xs text-zinc-600 text-center">
              For recruiters and admins only
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-medium">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Demo Code */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <KeyRound className="w-3.5 h-3.5" />
              Demo Access
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter demo code"
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDemoCode()}
                className={`flex-1 bg-zinc-950 border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 ${
                  demoError
                    ? "border-red-500/60 text-red-300"
                    : "border-zinc-700 focus:border-emerald-600/60"
                }`}
              />
              <button
                onClick={handleDemoCode}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {demoError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Invalid demo code
              </p>
            )}
            <p className="text-xs text-zinc-600">
              For hackathon judges — enter the demo code from the presentation
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
