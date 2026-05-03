import { useEffect, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { useTrackEvent } from "@/features/events/useTrackEvent";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

/** Fixed below nav, top-right on md+ (toast) — avoids covering hero center / catalog titles */
const toastShell =
  "fixed left-3 right-3 top-[8.875rem] z-40 mx-auto w-auto max-w-md overflow-visible sm:left-auto sm:right-5 sm:mx-0 sm:max-w-sm md:top-[5.85rem]";

const pop =
  "isolate w-full rounded-[1.25rem] border border-outline/25 bg-white/88 px-4 py-3.5 shadow-[0_20px_56px_rgba(62,40,27,0.07)] backdrop-blur-md sm:px-5 sm:py-4";

/** Past this offset = toast dismissed; back at or above top = toast visible again. */
const SCROLL_DISMISS_PX = 4;

const toastMotionTransition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.78,
} as const;

const toastMotionVariants = {
  /** Shown on load — anchored in the fixed slot. */
  idle: { x: 0, opacity: 1, scale: 1 },
  /** User scrolled: exits toward the right and collapses out of view. */
  dismissed: { x: 140, opacity: 0, scale: 0.96 },
};

/** React-only — avoids pulling hooks from framer-motion’s React resolution under Vite. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function ConsentToastShell({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [scrolledPast, setScrolledPast] = useState(() => {
    if (typeof window === "undefined") return false;
    const y = window.scrollY || document.documentElement.scrollTop;
    return y > SCROLL_DISMISS_PX;
  });

  useLayoutEffect(() => {
    const sync = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setScrolledPast(y > SCROLL_DISMISS_PX);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  const instant = prefersReducedMotion;

  return (
    <motion.div
      className={toastShell}
      role="status"
      aria-live="polite"
      initial={false}
      animate={scrolledPast ? "dismissed" : "idle"}
      variants={toastMotionVariants}
      transition={
        instant
          ? { duration: 0.14, ease: "easeInOut" }
          : toastMotionTransition
      }
      style={{ pointerEvents: scrolledPast ? "none" : "auto" }}
    >
      {children}
    </motion.div>
  );
}

export function ConsentBanner() {
  const queryClient = useQueryClient();
  const track = useTrackEvent();
  const consentQuery = useQuery({
    queryKey: ["consent"],
    queryFn: apiClient.getConsent,
  });

  const updateConsent = useMutation({
    mutationFn: (scopes: string[]) => apiClient.updateConsent(scopes),
    onSuccess: (next) => {
      queryClient.setQueryData(["consent"], next);
    },
  });

  if (!consentQuery.data) {
    return null;
  }

  const hasPersonalization = consentQuery.data.scopes.includes("personalization");

  if (hasPersonalization) {
    return (
      <ConsentToastShell>
        <div className={`${pop} ring-1 ring-success/15`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-pretty text-xs font-medium leading-snug tracking-[0.01em] text-ink/92 sm:text-[0.8125rem] sm:leading-relaxed">
              Personalization is active ranking and search may use consented activity.
            </span>
            <Link
              to="/consent"
              className={`${tw.buttonGhost} ${tw.buttonSmall} shrink-0 self-start border-ink/25 sm:self-auto`}
            >
              Review controls
            </Link>
          </div>
        </div>
      </ConsentToastShell>
    );
  }

  return (
    <ConsentToastShell>
      <div className={pop}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-pretty text-xs leading-snug text-ink sm:text-sm sm:leading-relaxed">
            Personalization is off, so you are seeing generic ranking and recommendation rails.
          </span>
          <button
            type="button"
            className={`${tw.button} ${tw.buttonSmall} shrink-0 self-start sm:self-auto`}
            onClick={() => {
              updateConsent.mutate(["analytics", "personalization"]);
              track({
                customer_id: "demo-customer-1",
                event_type: "consent_updated",
                payload: { scopes: ["analytics", "personalization"] },
                consent_scope: ["analytics", "personalization"],
              });
            }}
          >
            Enable demo consent
          </button>
        </div>
      </div>
    </ConsentToastShell>
  );
}
