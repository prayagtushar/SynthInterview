"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export type Role = "candidate" | "recruiter" | "admin" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  activateDemoCode: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_SESSION_KEY = "synth_demo_mode";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check demo mode persisted in sessionStorage
    if (typeof window !== "undefined") {
      const demo = sessionStorage.getItem(DEMO_SESSION_KEY);
      if (demo === "true") {
        setIsDemoMode(true);
        setRole("recruiter");
        setLoading(false);
        return;
      }
    }

    // Handle redirect fallback (for browsers that blocked the popup)
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser?.email) {
        setRole(null);
        setLoading(false);
        return;
      }

      const email = firebaseUser.email;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

      if (adminEmail && email === adminEmail) {
        setRole("admin");
        setLoading(false);
        return;
      }

      try {
        const roleSnap = await getDoc(doc(db, "roles", email));
        setRole(roleSnap.exists() && roleSnap.data()?.role === "recruiter" ? "recruiter" : "candidate");
      } catch {
        setRole("candidate");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      // Fall back to redirect if popup is blocked
      if (err?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
    }
    setIsDemoMode(false);
    setRole(null);
    await firebaseSignOut(auth);
  };

  const activateDemoCode = (code: string): boolean => {
    const demoCode = process.env.NEXT_PUBLIC_DEMO_CODE ?? "SYNTH2025";
    if (code.trim().toUpperCase() === demoCode.toUpperCase()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(DEMO_SESSION_KEY, "true");
      }
      setIsDemoMode(true);
      setRole("recruiter");
      setLoading(false);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, isDemoMode, signInWithGoogle, signOut, activateDemoCode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
