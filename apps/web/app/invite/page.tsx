"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Zap } from "lucide-react";

function InviteHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link — no token found.");
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
        setMessage("This invite link is invalid or does not exist.");
        return;
      }

      const invite = inviteSnap.data();

      if (invite.used) {
        setStatus("error");
        setMessage("This invite link has already been used.");
        return;
      }

      const expiresAt = invite.expiresAt instanceof Timestamp
        ? invite.expiresAt.toDate()
        : new Date(invite.expiresAt);

      if (expiresAt < new Date()) {
        setStatus("error");
        setMessage("This invite link has expired. Please ask the admin for a new one.");
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
        () => router.replace(`/login?email=${encodeURIComponent(invite.email)}`),
        3000
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact the admin.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8 flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Synth Interview
          </span>
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-10 text-center space-y-5">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
              <p className="text-zinc-400">Validating your invite...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Access Granted</h2>
              <p className="text-zinc-400 text-sm">
                <span className="text-zinc-200 font-medium">{recruiterEmail}</span> has been added as a recruiter.
              </p>
              <p className="text-zinc-600 text-xs">Redirecting you to login...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Invalid Invite</h2>
              <p className="text-zinc-400 text-sm">{message}</p>
              <button
                onClick={() => router.replace("/login")}
                className="mt-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <InviteHandler />
    </Suspense>
  );
}
