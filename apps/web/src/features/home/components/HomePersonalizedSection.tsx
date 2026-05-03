import type { ReactNode } from "react";

import { tw } from "@/shared/ui/tw";

const sectionTitle =
  "font-display font-normal tracking-display-tight text-balance text-ink antialiased leading-[1.02] text-[clamp(1.85rem,3.8vw,2.85rem)]";

type HomePersonalizedSectionProps = {
  children: ReactNode;
};

/**
 * Wraps personalized recommendation rails — `storyCanvas` stripe; on home it sits after hero / new
 * collection / popular, with **Profile lab** (`ShopperContextEditorialSection`) pulled **below** this block
 * so the lab lands just before the footer (UI_REFERENCE).
 */
export function HomePersonalizedSection({ children }: HomePersonalizedSectionProps) {
  return (
    <section
      className={`${tw.storyCanvas} ${tw.editorialBreakout} border-b border-[#e5e5e5] py-10 sm:py-12 lg:py-14`}
      aria-labelledby="recommended-heading"
    >
      <div className={tw.layoutFrame}>
        <header className="mb-8 max-w-3xl sm:mb-10">
          <p className={`mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>
            Recommended for you
          </p>
          <h2 id="recommended-heading" className={sectionTitle}>
            <span className="block">Picks shaped by</span>
            <span className="mt-1 block sm:mt-1.5">your signals.</span>
          </h2>
          <p className={`mt-4 max-w-xl text-pretty text-sm leading-relaxed sm:mt-5 sm:text-[0.9375rem] sm:leading-relaxed ${tw.muted}`}>
            Each rail below includes a plain-language reason and confidence when personalization is on. Turn
            personalization off under consent to see how the same surfaces fall back to generic catalog logic.
          </p>
        </header>
        <div className="flex flex-col gap-14 sm:gap-16 lg:gap-20">{children}</div>
      </div>
    </section>
  );
}
