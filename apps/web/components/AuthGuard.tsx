"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "../lib/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If set, user must have this role (or admin) to enter */
  requiredRole?: Extract<Role, "recruiter" | "admin">;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, role, loading, isDemoMode } = useAuth();
  const router = useRouter();

  const hasAccess = (() => {
    if (loading) return false;
    if (!isDemoMode && !user) return false;
    if (!requiredRole) return true;
    if (role === "admin") return true;
    if (requiredRole === "recruiter" && (role === "recruiter" || isDemoMode)) return true;
    return false;
  })();

  useEffect(() => {
    if (loading) return;
    if (!hasAccess) {
      // Not authenticated at all → login page
      // Authenticated but wrong role → home (avoid candidate getting looped to /session)
      if (!isDemoMode && !user) router.replace("/login");
      else router.replace("/");
    }
  }, [loading, hasAccess, user, isDemoMode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}
