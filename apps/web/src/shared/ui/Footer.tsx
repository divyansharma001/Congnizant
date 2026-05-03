import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { useTrackEvent } from "@/features/events/useTrackEvent";
import { tw } from "@/shared/ui/tw";

/** RGBA WebP in `public/footer-product-mark.webp` — floating commerce mark (ref feather). */
const FOOTER_MARK_IMG = "/footer-product-mark.webp";

function SocialPinterest({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8-.11-.78-.2-1.97.04-2.82.22-.95 1.4-6.02 1.4-6.02s-.36-.72-.36-1.79c0-1.68.97-2.93 2.19-2.93 1.03 0 1.53.78 1.53 1.71 0 1.04-.66 2.6-1 4.05-.28 1.21.6 2.2 1.78 2.2 2.14 0 3.78-2.25 3.78-5.5 0-2.88-2.07-4.9-5.02-4.9-3.42 0-5.43 2.56-5.43 5.2 0 1.03.4 2.13.9 2.73.1.12.11.22.08.34-.09.36-.29 1.15-.33 1.31-.05.22-.17.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.77 2.74-7.23 7.9-7.23 4.15 0 7.38 2.96 7.38 6.91 0 4.12-2.6 7.43-6.21 7.43-1.23 0-2.39-.64-2.78-1.4l-.76 2.89c-.27 1.06-1 2.4-1.49 3.21 1.12.35 2.31.54 3.55.54 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

function SocialInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SocialFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      />
    </svg>
  );
}

const footerLink =
  "text-[0.8125rem] font-normal leading-[2] text-ink/88 transition-opacity hover:opacity-60";

const linkColumns: { links: { label: string; to: string }[] }[] = [
  {
    links: [
      { label: "About HyperPersona", to: "/" },
      { label: "Store", to: "/catalog" },
      { label: "Gift card", to: "/catalog" },
    ],
  },
  {
    links: [
      { label: "Contact us", to: "/search" },
      { label: "Privacy policy", to: "/consent" },
      { label: "Terms and conditions", to: "/consent" },
      { label: "Legal notice", to: "/profile" },
    ],
  },
  {
    links: [
      { label: "Our guides", to: "/catalog" },
      { label: "Choosing your bedding", to: "/catalog" },
      { label: "Our expertise", to: "/profile" },
    ],
  },
];

/**
 * Editorial footer — Sonnette-style: mark, serif headline, email line, socials,
 * three quiet link columns, mega wordmark clipped at bottom edge.
 */
export function Footer() {
  const track = useTrackEvent();

  function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!email) return;
    track({
      customer_id: "demo-customer-1",
      event_type: "newsletter_interest",
      payload: { email, source: "footer" },
      consent_scope: ["analytics", "personalization"],
    });
    event.currentTarget.reset();
  }

  return (
    <footer
      className={`${tw.heroCanvas} ${tw.editorialBreakout} mt-auto border-t border-outline/20`}
      role="contentinfo"
    >
      <div className={`${tw.layoutFrame} pb-0 pt-14 sm:pt-16 lg:pt-16`}>
        {/* Upper band — centered like reference */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 drop-shadow-[0_14px_32px_rgba(34,28,23,0.09)] sm:mb-10" aria-hidden>
            <img
              src={FOOTER_MARK_IMG}
              alt=""
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="mx-auto h-19 w-auto max-w-[min(10rem,65vw)] object-contain opacity-[0.9] sm:h-32"
            />
          </div>

          <h2 className={`${tw.displayNewsletterHeading} max-w-lg px-2 text-[clamp(2rem,3vw,1.95rem)]`}>
            Your home will love following us.
          </h2>

          <form onSubmit={onNewsletterSubmit} className="mt-9 w-full max-w-md sm:mt-10" aria-label="Newsletter signup">
            <label className="sr-only" htmlFor="footer-email">
              Email address
            </label>
            <div className="flex items-end gap-2 border-b border-ink/22 pb-2 transition-colors focus-within:border-ink/48">
              <input
                id="footer-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 border-0 bg-transparent py-1 text-left text-[0.875rem] text-ink outline-none placeholder:text-muted/50"
              />
              <button
                type="submit"
                className="shrink-0 cursor-pointer rounded-sm px-1 py-1 text-lg text-ink/80 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Submit email"
              >
                →
              </button>
            </div>
          </form>

          {/* <div className="mt-11 flex items-center justify-center gap-5 sm:mt-12">
            <a
              href="https://www.pinterest.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="flex size-10 items-center justify-center rounded-full border border-outline/55 text-ink/65 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label="Pinterest (opens in new tab)"
            >
              <SocialPinterest className="opacity-90" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="flex size-10 items-center justify-center rounded-full border border-outline/55 text-ink/65 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label="Instagram (opens in new tab)"
            >
              <SocialInstagram className="opacity-90" />
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="flex size-10 items-center justify-center rounded-full border border-outline/55 text-ink/65 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label="Facebook (opens in new tab)"
            >
              <SocialFacebook className="opacity-90" />
            </a>
          </div> */}
        </div>

        {/* Link columns — ref: three blocks, sentence case, generous line height */}
        <nav
          className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-12 text-center sm:mt-24 sm:grid-cols-3 sm:gap-10 sm:text-left"
          aria-label="Footer links"
        >
          {linkColumns.map((col, colIndex) => (
            <ul key={colIndex} className="list-none space-y-0 p-0">
              {col.links.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>

      {/* Mega wordmark — intentional slight clip at bottom (ref sonnette) */}
      <div className="relative mt-20 w-full overflow-hidden pb-0 sm:mt-24">
        <div className="relative mx-auto h-[clamp(3.35rem,10.5vw,5.75rem)] max-w-[100vw] sm:h-[clamp(3.85rem,9.5vw,6.25rem)]">
          <p
            className={`${tw.displayWordmarkFooter} absolute bottom-0 left-1/2 w-[108%] max-w-none -translate-x-1/2 translate-y-[26%] text-center text-[clamp(3.5rem,17vw,11.5rem)] leading-[0.72] sm:translate-y-[28%]`}
            aria-hidden
          >
            hyperpersona
          </p>
        </div>
        <span className="sr-only">HyperPersona</span>
      </div>
    </footer>
  );
}
