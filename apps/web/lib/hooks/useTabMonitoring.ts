import { useRef, useEffect, useCallback } from "react";

interface TabMonitoringProps {
  currentState: string;
  onViolation: (count: number) => void;
  onTimeout: () => void;
}

export function useTabMonitoring({
  currentState,
  onViolation,
  onTimeout,
}: TabMonitoringProps) {
  const tabSwitchCountRef = useRef(0);
  const tabReturnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStateRef = useRef(currentState);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  const TAB_SWITCH_LIMIT = 2;
  const TAB_AWAY_TERMINATE_MS = 6000;
  const TAB_GUARDED_STATES = new Set([
    "PROBLEM_DELIVERY",
    "APPROACH_LISTEN",
    "CODING",
    "HINT_DELIVERY",
    "TESTING",
    "OPTIMIZATION",
  ]);

  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      if (tabReturnTimerRef.current) {
        clearTimeout(tabReturnTimerRef.current);
        tabReturnTimerRef.current = null;
      }
      return;
    }

    if (!TAB_GUARDED_STATES.has(currentStateRef.current)) return;

    tabSwitchCountRef.current += 1;
    onViolation(tabSwitchCountRef.current);

    if (tabSwitchCountRef.current >= TAB_SWITCH_LIMIT) {
      onTimeout();
    } else {
      if (tabReturnTimerRef.current) clearTimeout(tabReturnTimerRef.current);
      tabReturnTimerRef.current = setTimeout(() => {
        tabReturnTimerRef.current = null;
        onTimeout();
      }, TAB_AWAY_TERMINATE_MS);
    }
  }, [onViolation, onTimeout]);

  const stopMonitoring = useCallback(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (tabReturnTimerRef.current) {
      clearTimeout(tabReturnTimerRef.current);
      tabReturnTimerRef.current = null;
    }
    tabSwitchCountRef.current = 0;
  }, [handleVisibilityChange]);

  const startMonitoring = useCallback(() => {
    tabSwitchCountRef.current = 0;
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  return {
    startMonitoring,
    stopMonitoring,
    tabSwitchCount: tabSwitchCountRef.current,
  };
}
