"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

function InviteHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid security token — no signature found.");
      return;
    }
    redeemInvite(token);
  }, [token]);

  const redeemInvite = async (token: string) => {
    try {
      const inviteRef = doc(db, "invites", token);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setStatus("error");
        setMessage("This security token is invalid or has been revoked.");
        return;
      }

      const invite = inviteSnap.data();

      if (invite.used) {
        setStatus("error");
        setMessage("This security token has already been consumed.");
        return;
      }

      const expiresAt =
        invite.expiresAt instanceof Timestamp
          ? invite.expiresAt.toDate()
          : new Date(invite.expiresAt);

      if (expiresAt < new Date()) {
        setStatus("error");
        setMessage("This security token has expired. Request a new clearance.");
        return;
      }

      // Grant recruiter role
      await setDoc(doc(db, "roles", invite.email), {
        role: "recruiter",
        addedAt: serverTimestamp(),
      });

      // Consume the invite
      await updateDoc(inviteRef, { used: true });

      setRecruiterEmail(invite.email);
      setStatus("success");

      setTimeout(
        () =>
          router.replace(`/login?email=${encodeURIComponent(invite.email)}`),
        3500,
      );
    } catch {
      setStatus("error");
      setMessage("System handshake failed. Please contact headquarters.");
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] relative overflow-hidden flex items-center justify-center p-4">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[430px] z-10 text-center"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-black shadow-lg mb-4">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
            Synth Clearance
          </h1>
          <p className="text-zinc-500 text-sm">
            Verifying your security credentials
          </p>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
          {status === "loading" && (
            <div className="space-y-8 py-4">
              <div className="relative flex justify-center">
                <Loader2 className="w-12 h-12 text-zinc-700 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Validating Signature
                </p>
                <div className="w-24 h-[1px] bg-zinc-800 mx-auto overflow-hidden rounded-full">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                    className="w-full h-full bg-zinc-400"
                  />
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-8 py-4 px-2">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto rounded-full">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Access Approved
                </h2>
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 text-center">
                    Identity Authorized
                  </p>
                  <p className="font-mono text-xs text-zinc-300 break-all">
                    {recruiterEmail}
                  </p>
                </div>
                <p className="text-[11px] text-emerald-500/50 font-bold uppercase tracking-[0.1em] animate-pulse">
                  Redirecting to Command Center...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-8 py-4 px-2">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto rounded-full">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Access Denied
                </h2>
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl">
                  <p className="text-[13px] text-zinc-500 leading-relaxed font-medium">
                    {message}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:bg-zinc-100 text-sm active:scale-[0.98]"
                >
                  Return to Base
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-800">
          Security Instance &bull; {new Date().getFullYear()} Synth
        </div>
      </motion.div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <InviteHandler />
    </Suspense>
  );
}
