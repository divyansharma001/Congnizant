import { Outlet } from "react-router-dom";

import { ScrollToTop } from "@/app/ScrollToTop";
import { ConsentBanner } from "@/features/consent/components/ConsentBanner";
import { DebugEventPanel } from "@/features/events/debug/DebugEventPanel";
import { PageViewTracker } from "@/features/events/PageViewTracker";
import { Footer } from "@/shared/ui/Footer";
import { Header } from "@/shared/ui/Header";
import { PageShell } from "@/shared/ui/PageShell";
import { tw } from "@/shared/ui/tw";

/** Reserves space for fixed header (stacked mobile vs single-row md+). */
function HeaderLayoutSpacer() {
  /* Same fill as nav + hero so body gradient never shows in this strip */
  return <div aria-hidden className={`${tw.heroCanvas} h-35 shrink-0 md:h-[5.65rem]`} />;
}

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-200 focus:inline-flex focus:rounded-pill focus:bg-ink focus:px-4 focus:py-3 focus:text-white focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-white/70"
      >
        Skip to main content
      </a>
      <PageViewTracker />
      <Header />
      <HeaderLayoutSpacer />
      <ConsentBanner />
      <PageShell>
        <ScrollToTop />
        <main id="main-content" className={`${tw.page} ${tw.layoutGutterX} scroll-mt-22`}>
          <Outlet />
        </main>
      </PageShell>
      <Footer />
      <DebugEventPanel />
    </div>
  );
}
