import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Warn 5 minutes before timeout (at 25 min)

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

/**
 * useSessionTimeout — Auto-logout hook for GDPR compliance.
 *
 * Monitors user activity and:
 * - Shows a warning toast after 25 minutes of inactivity
 * - Calls `onLogout` after 30 minutes of inactivity
 *
 * @param onLogout - Callback to execute on timeout (e.g. clear auth, redirect to login)
 * @param timeoutMs - Timeout in milliseconds (default: 30 minutes / 1800000ms)
 */
export function useSessionTimeout(
  onLogout: () => void,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningShownRef = useRef(false);

  const warningMs = timeoutMs - WARNING_BEFORE_MS;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      toast.warning(
        "You will be logged out in 5 minutes due to inactivity. Move your mouse or press any key to stay logged in.",
        {
          duration: 30000, // Show for 30 seconds
          id: "session-timeout-warning",
        }
      );
    }
  }, []);

  const handleLogout = useCallback(() => {
    toast.dismiss("session-timeout-warning");
    toast.error("You have been logged out due to inactivity.", {
      duration: 10000,
      id: "session-timeout-logout",
    });
    onLogout();
  }, [onLogout]);

  const resetTimers = useCallback(() => {
    clearTimers();
    warningShownRef.current = false;

    // Dismiss any existing warning toast
    toast.dismiss("session-timeout-warning");

    // Set warning timer (at 25 minutes)
    if (warningMs > 0) {
      warningRef.current = setTimeout(showWarning, warningMs);
    }

    // Set logout timer (at 30 minutes)
    timeoutRef.current = setTimeout(handleLogout, timeoutMs);
  }, [clearTimers, showWarning, handleLogout, timeoutMs, warningMs]);

  useEffect(() => {
    // Start timers on mount
    resetTimers();

    // Listen for activity events
    const handleActivity = () => {
      resetTimers();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Also reset on visibility change (user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetTimers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [resetTimers, clearTimers]);
}

export default useSessionTimeout;
