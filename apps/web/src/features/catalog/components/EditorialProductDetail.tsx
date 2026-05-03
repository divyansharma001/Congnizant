import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { pdpSwatchFilters, pdpSwatches, type SwatchId } from "@/features/catalog/pdpSwatches";
import { useTrackEvent } from "@/features/events/useTrackEvent";
import type { Product } from "@/shared/api/contracts";
import { formatCurrency } from "@/shared/lib/format";
import { tw } from "@/shared/ui/tw";

type EditorialProductDetailProps = {
  product: Product;
  wishlisted: boolean;
  onAddToCart: (quantity: number, variantContext?: Record<string, string>) => void;
  onWishlistToggle: () => void;
};

type DetailTab = "description" | "styling" | "reviews" | "highlights";

/** Same radial mat as `EditorialHero` — UI_REFERENCE: warm ivory / parchment story. */
const pdpCanvas =
  "bg-[radial-gradient(ellipse_82%_78%_at_50%_36%,#fdfbf7_0%,#f5f2ed_48%,#e9e3da_100%)] text-ink";

const imageShell =
  "relative flex h-full min-h-[min(52vh,480px)] w-full flex-col overflow-hidden rounded-xl bg-[#e8e4de]/88 ring-1 ring-outline/10 shadow-[0_20px_60px_rgba(34,28,23,0.06)] lg:min-h-[min(58vh,560px)]";
const imageInner = "flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10";

const tabPill =
  "min-h-10 cursor-pointer rounded-pill border px-4 text-center text-[0.65rem] font-semibold uppercase tracking-ui-wide transition-[background-color,border-color,color,transform] duration-150 motion-reduce:transition-none";
const tabActive = "border-ink bg-ink text-white shadow-[0_10px_28px_rgba(34,28,23,0.12)]";
const tabIdle = "border-outline/55 bg-white/75 text-ink hover:-translate-y-px hover:border-ink/25";

const specRow = "grid gap-1 border-b border-outline/12 py-4 last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-6";
const specDt = `text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${tw.muted}`;
const specDd = "text-sm leading-relaxed text-ink/90 sm:text-[0.9375rem]";

function discountPercent(price: number, compare: number) {
  return Math.round(((compare - price) / compare) * 100);
}

function formatCategoryLabel(categorySlug: string) {
  return categorySlug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** “Styling ideas” is apparel-only; other verticals get category-accurate tabs instead (UI_REFERENCE: no mismatched fashion copy on grocery-style SKUs). */
function showStylingTab(vertical: Product["vertical"]) {
  return vertical === "apparel";
}

export function EditorialProductDetail({
  product,
  wishlisted,
  onAddToCart,
  onWishlistToggle,
}: EditorialProductDetailProps) {
  const track = useTrackEvent();
  const [qty, setQty] = useState(1);
  const [swatch, setSwatch] = useState<SwatchId>("brick");
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<DetailTab>("description");

  const gallery = useMemo(() => {
    const rest = product.images ?? [];
    const merged = [product.image, ...rest];
    return merged.filter((url, i) => merged.indexOf(url) === i);
  }, [product.image, product.images]);

  const hasCatalogColors = (product.colorOptions?.length ?? 0) > 0;
  const hasSizes = (product.sizeOptions?.length ?? 0) > 0;
  const hasStorage = (product.storageOptions?.length ?? 0) > 0;

  const [colorId, setColorId] = useState(product.colorOptions?.[0]?.id ?? "");
  const [sizeId, setSizeId] = useState(product.sizeOptions?.[0]?.id ?? "");
  const [storageId, setStorageId] = useState(product.storageOptions?.[0]?.id ?? "");

  const activeSrc = gallery[activeImage] ?? product.image;
  const useHueFilter = !hasCatalogColors;

  const emitTab = useCallback(
    (next: DetailTab) => {
      setTab(next);
      track({
        customer_id: "demo-customer-1",
        event_type: "pdp_tab_selected",
        payload: { productId: product.id, slug: product.slug, tab: next },
        consent_scope: ["analytics", "personalization"],
      });
    },
    [product.id, product.slug, track],
  );

  const emitVariant = useCallback(
    (optionKind: "color" | "size" | "storage", optionId: string, optionLabel: string) => {
      track({
        customer_id: "demo-customer-1",
        event_type: "pdp_variant_selected",
        payload: { productId: product.id, slug: product.slug, optionKind, optionId, optionLabel },
        consent_scope: ["analytics", "personalization"],
      });
    },
    [product.id, product.slug, track],
  );

  useEffect(() => {
    setColorId(product.colorOptions?.[0]?.id ?? "");
    setSizeId(product.sizeOptions?.[0]?.id ?? "");
    setStorageId(product.storageOptions?.[0]?.id ?? "");
    setActiveImage(0);
    setQty(1);
    setTab("description");

    track({
      customer_id: "demo-customer-1",
      event_type: "product_pdp_viewed",
      payload: {
        productId: product.id,
        slug: product.slug,
        vertical: product.vertical ?? "general",
        freeDelivery: product.freeDelivery === true,
      },
      consent_scope: ["analytics", "personalization"],
    });
    if (product.freeDelivery) {
      track({
        customer_id: "demo-customer-1",
        event_type: "pdp_free_delivery_badge_viewed",
        payload: { productId: product.id, slug: product.slug },
        consent_scope: ["analytics", "personalization"],
      });
    }
  }, [product.freeDelivery, product.id, product.slug, product.vertical, track]);

  const variantContext = useMemo(() => {
    const ctx: Record<string, string> = {};
    if (hasCatalogColors && colorId) ctx.color = colorId;
    if (hasSizes && sizeId) ctx.size = sizeId;
    if (hasStorage && storageId) ctx.storage = storageId;
    if (useHueFilter) ctx.previewSwatch = swatch;
    return ctx;
  }, [colorId, hasCatalogColors, hasSizes, hasStorage, sizeId, storageId, swatch, useHueFilter]);

  const bumpQty = (delta: number) => {
    setQty((q) => {
      const next = Math.min(20, Math.max(1, q + delta));
      if (next !== q) {
        track({
          customer_id: "demo-customer-1",
          event_type: "pdp_quantity_changed",
          payload: { productId: product.id, slug: product.slug, quantity: next },
          consent_scope: ["analytics", "personalization"],
        });
      }
      return next;
    });
  };

  const vertical = product.vertical ?? "general";

  const tabs = useMemo(() => {
    const rows: { id: DetailTab; label: string }[] = [{ id: "description", label: "Description" }];
    if (showStylingTab(product.vertical)) {
      rows.push({ id: "styling", label: "Styling ideas" });
    }
    rows.push({ id: "reviews", label: "Reviews" }, { id: "highlights", label: "Highlights" });
    return rows;
  }, [product.vertical]);

  const specLines = product.specification ?? [];
  const pctOff =
    product.compareAt != null && product.compareAt > product.price
      ? discountPercent(product.price, product.compareAt)
      : null;

  return (
    <section className={`${tw.editorialBreakout} border-b border-outline/15 ${pdpCanvas}`} aria-labelledby="pdp-title">
      <div className={`${tw.layoutFrame} pb-12 pt-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-12`}>
        <nav className={`mb-8 flex flex-wrap gap-x-2 gap-y-1 text-[0.75rem] ${tw.muted}`} aria-label="Breadcrumb">
          <Link to="/" className="underline decoration-ink/25 underline-offset-2 hover:text-ink">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link to="/catalog" className="underline decoration-ink/25 underline-offset-2 hover:text-ink">
            Catalog
          </Link>
          <span aria-hidden>/</span>
          <Link
            to={`/catalog?category=${encodeURIComponent(product.category)}`}
            className="underline decoration-ink/25 underline-offset-2 hover:text-ink"
          >
            {formatCategoryLabel(product.category)}
          </Link>
          <span aria-hidden>/</span>
          <span className="max-w-[min(100%,28rem)] truncate text-ink/80">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:items-stretch lg:gap-x-12 xl:gap-x-16">
          <div className={imageShell}>
            {product.freeDelivery ? (
              <span className="absolute left-4 top-4 z-1 rounded-pill border border-outline/40 bg-ink px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-ui-wide text-white shadow-[0_8px_24px_rgba(34,28,23,0.12)]">
                Free delivery
              </span>
            ) : null}
            <div className={imageInner}>
              <figure className="m-0 w-full max-w-[min(100%,28rem)]">
                <div className="drop-shadow-[0_36px_72px_rgba(34,28,23,0.12)]">
                  <img
                    src={activeSrc}
                    alt={product.name}
                    width={900}
                    height={1012}
                    decoding="async"
                    style={useHueFilter ? { filter: pdpSwatchFilters[swatch] } : undefined}
                    className="mx-auto h-auto max-h-[min(46vh,480px)] w-auto max-w-full object-contain transition-[filter,opacity] duration-500 ease-out will-change-[filter]"
                  />
                </div>
              </figure>
            </div>
            {gallery.length > 1 ? (
              <div
                className="flex shrink-0 gap-2 overflow-x-auto border-t border-outline/10 bg-white/35 px-3 py-3 sm:px-4"
                role="tablist"
                aria-label="Product gallery"
              >
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImage}
                    onClick={() => setActiveImage(i)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-offset-2 ring-offset-[#e8e4de] transition-shadow sm:size-17 ${
                      i === activeImage ? "ring-ink/45 shadow-md" : "ring-outline/30 hover:ring-ink/20"
                    }`}
                  >
                    <img src={src} alt="" className="size-full object-cover" width={120} height={120} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col gap-8 lg:border-l lg:border-outline/12 lg:pl-10 xl:pl-12">
            <header className="min-w-0">
              <p className={`mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>
                {product.brand}
                {product.department ? (
                  <>
                    {" "}
                    · <span className="normal-case">{product.department}</span>
                  </>
                ) : null}
              </p>
              <h1 id="pdp-title" className={`${tw.displayProductTitle} text-[clamp(2rem,4vw,3.25rem)]`}>
                {product.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[clamp(1.2rem,2.2vw,1.65rem)] font-medium tabular-nums tracking-tight text-ink">
                  {formatCurrency(product.price)}
                </p>
                {product.compareAt != null && product.compareAt > product.price ? (
                  <>
                    <span className={`text-base font-normal line-through ${tw.muted}`}>
                      {formatCurrency(product.compareAt)}
                    </span>
                    {pctOff != null ? (
                      <span className="rounded-pill border border-success/35 bg-success/10 px-2.5 py-0.5 text-[0.75rem] font-semibold text-success">
                        {pctOff}% off
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
              <p className={`mt-2 text-[0.8125rem] tracking-[0.02em] ${tw.muted}`}>
                {product.rating.toFixed(1)} rating · {product.reviewCount} reviews ·{" "}
                <span className="capitalize">{product.inventoryStatus.replaceAll("-", " ")}</span>
                <span className="text-ink/50"> · </span>
                <span className="capitalize">{vertical}</span>
              </p>
              <p className={`mt-4 max-w-xl text-pretty text-sm leading-relaxed sm:text-[0.9375rem] ${tw.muted}`}>
                {product.description}
              </p>
              <dl
                className={`mt-6 grid gap-3 border-t border-outline/12 pt-6 text-[0.8125rem] sm:grid-cols-2 sm:gap-x-8 ${tw.muted}`}
              >
                <div>
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-ui-wide text-ink/55">SKU</dt>
                  <dd className="mt-1 font-medium tabular-nums tracking-body text-ink/90">{product.id}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-ui-wide text-ink/55">Category</dt>
                  <dd className="mt-1">
                    <Link
                      to={`/catalog?category=${encodeURIComponent(product.category)}`}
                      className="font-medium text-ink underline decoration-ink/25 underline-offset-[0.2rem] transition-colors hover:text-accent-strong"
                    >
                      {formatCategoryLabel(product.category)}
                    </Link>
                  </dd>
                </div>
              </dl>
              <ul
                className="mt-5 flex flex-col gap-2 border-t border-outline/10 pt-5 text-[0.75rem] leading-snug text-ink/80 sm:flex-row sm:flex-wrap sm:gap-x-8"
                aria-label="Service notes"
              >
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{product.freeDelivery ? "Free delivery on this SKU." : "Standard delivery — fee shown at checkout."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden />
                  <span>Editorial imagery and specs stay in sync with the catalog API.</span>
                </li>
              </ul>
            </header>

            <div className="grid gap-8 rounded-xl border border-outline/18 bg-white/50 p-5 shadow-[0_16px_48px_rgba(34,28,23,0.04)] backdrop-blur-xs sm:p-6 lg:gap-9">
              {hasCatalogColors ? (
                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Color</p>
                  </div>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Color options">
                    {product.colorOptions!.map((opt) => {
                      const selected = opt.id === colorId;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="listitem"
                          onClick={() => {
                            setColorId(opt.id);
                            emitVariant("color", opt.id, opt.label);
                          }}
                          className={`rounded-pill border px-3 py-2 text-left text-[0.8125rem] font-medium transition-transform duration-150 ${
                            selected
                              ? "border-ink bg-ink text-white shadow-[0_8px_22px_rgba(34,28,23,0.12)]"
                              : "border-outline/55 bg-white/75 text-ink hover:-translate-y-px hover:border-ink/25"
                          }`}
                          aria-pressed={selected}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className={`mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Colour</p>
                  <div className="flex flex-wrap items-center gap-2.5" role="list" aria-label="Colour preview">
                    {pdpSwatches.map((s) => {
                      const selected = s.id === swatch;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="listitem"
                          onClick={() => {
                            setSwatch(s.id);
                            emitVariant("color", s.id, s.label);
                          }}
                          className={`size-9 shrink-0 rounded-full border-2 transition-transform duration-150 ${s.bg} ${
                            selected
                              ? "scale-105 border-ink/55 shadow-[0_0_0_1px_rgba(34,28,23,0.12)]"
                              : "border-outline/45 opacity-90 hover:scale-105 hover:border-ink/25"
                          }`}
                          aria-pressed={selected}
                          aria-label={`Preview ${s.label}`}
                        />
                      );
                    })}
                  </div>
                  <p className={`mt-2 text-[0.7rem] ${tw.muted}`}>Preview tint — catalog colors ship on select SKUs.</p>
                </div>
              )}

              {hasSizes ? (
                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Size</p>
                    <span className={`text-[0.65rem] font-medium uppercase tracking-ui-wide ${tw.muted}`}>
                      Size guide (soon)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Size options">
                    {product.sizeOptions!.map((opt) => {
                      const selected = opt.id === sizeId;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSizeId(opt.id);
                            emitVariant("size", opt.id, opt.label);
                          }}
                          className={`min-h-10 min-w-10 rounded-md border px-3 py-2 text-sm font-semibold tabular-nums transition-transform duration-150 ${
                            selected
                              ? "border-ink bg-ink text-white"
                              : "border-outline/55 bg-white/75 text-ink hover:-translate-y-px hover:border-ink/25"
                          }`}
                          aria-pressed={selected}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {hasStorage ? (
                <div>
                  <p className={`mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Storage</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Storage options">
                    {product.storageOptions!.map((opt) => {
                      const selected = opt.id === storageId;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStorageId(opt.id);
                            emitVariant("storage", opt.id, opt.label);
                          }}
                          className={`rounded-pill border px-4 py-2 text-[0.8125rem] font-semibold transition-transform duration-150 ${
                            selected
                              ? "border-ink bg-ink text-white"
                              : "border-outline/55 bg-white/75 text-ink hover:-translate-y-px hover:border-ink/25"
                          }`}
                          aria-pressed={selected}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-auto flex min-h-0 flex-col gap-5 border-t border-outline/15 pt-8">
              <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                <div className={tw.qtyStepper} aria-label="Quantity">
                  <button type="button" className={tw.qtyStepperBtn} onClick={() => bumpQty(-1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span className={tw.qtyStepperValue}>{qty}</span>
                  <button type="button" className={tw.qtyStepperBtn} onClick={() => bumpQty(1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={`${tw.button} ${tw.buttonCommerce} min-w-0 flex-1 sm:max-w-md sm:flex-initial`}
                  onClick={() => onAddToCart(qty, variantContext)}
                >
                  Add to bag — {formatCurrency(product.price * qty)}
                </button>
              </div>

              <nav
                className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4"
                aria-label="More actions"
              >
                <button type="button" className={tw.linkCommerceUnderline} onClick={onWishlistToggle}>
                  {wishlisted ? "Remove from saved" : "Save for later"}
                </button>
                <Link to="/checkout" className={tw.linkCommerceUnderline}>
                  Checkout →
                </Link>
                <Link to="/catalog" className={tw.linkCommerceUnderline}>
                  Back to catalog →
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Tabbed details — apparel includes “Styling ideas”; other verticals omit it to avoid fashion-only copy on home/tech SKUs */}
        <div className="mt-14 border-t border-outline/15 pt-10 sm:mt-16 sm:pt-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product detail sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`${tabPill} ${tab === t.id ? tabActive : tabIdle}`}
                  onClick={() => emitTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`shrink-0 self-start text-left text-[0.6875rem] font-semibold uppercase tracking-ui-wide text-ink/70 underline decoration-ink/25 underline-offset-[0.35rem] transition-colors hover:text-ink sm:self-center`}
              onClick={() =>
                track({
                  customer_id: "demo-customer-1",
                  event_type: "pdp_report_product_clicked",
                  payload: { productId: product.id, slug: product.slug },
                  consent_scope: ["analytics", "personalization"],
                })
              }
            >
              Report product
            </button>
          </div>

          {tab === "description" ? (
            <div className="max-w-3xl">
              <h2 className={`${tw.displayH2} text-2xl sm:text-3xl`}>Product details</h2>
              <div className={`mt-4 space-y-4 text-sm leading-relaxed sm:text-[0.9375rem] ${tw.muted}`}>
                <p className="text-pretty text-ink/90">{product.longDescription ?? product.description}</p>
              </div>
              <dl className="mt-8 border-t border-outline/15">
                {product.dimensions?.display ? (
                  <div className={specRow}>
                    <dt className={specDt}>Package dimensions</dt>
                    <dd className={specDd}>{product.dimensions.display}</dd>
                  </div>
                ) : null}
                {specLines.length > 0 ? (
                  <div className={specRow}>
                    <dt className={specDt}>Specification</dt>
                    <dd className={specDd}>{specLines.join(", ")}</dd>
                  </div>
                ) : null}
                {product.dateFirstAvailable ? (
                  <div className={specRow}>
                    <dt className={specDt}>Date first available</dt>
                    <dd className={specDd}>{product.dateFirstAvailable}</dd>
                  </div>
                ) : null}
                {product.department ? (
                  <div className={specRow}>
                    <dt className={specDt}>Department</dt>
                    <dd className={specDd}>{product.department}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {tab === "styling" && showStylingTab(product.vertical) ? (
            <div className="max-w-3xl">
              <h2 className={`${tw.displayH2} text-2xl sm:text-3xl`}>Styling ideas</h2>
              <p className={`mt-4 text-pretty text-sm leading-relaxed sm:text-[0.9375rem] ${tw.muted}`}>
                Outfit and layer pairings for apparel—grounded in tags and how this piece reads in editorial shoots.
                Non-apparel SKUs use Highlights instead so category copy stays truthful.
              </p>
              {(product.tags?.length ?? 0) > 0 ? (
                <ul className={`${tw.chipList} mt-6`} aria-label="Style tags">
                  {product.tags!.map((tag) => (
                    <li key={tag} className={tw.chip}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div id="pdp-reviews" className="max-w-3xl scroll-mt-24">
              <h2 className={`${tw.displayH2} text-2xl sm:text-3xl`}>Reviews</h2>
              <p className={`mt-4 text-sm leading-relaxed sm:text-[0.9375rem] ${tw.muted}`}>
                {product.reviewCount} reviews · average {product.rating.toFixed(1)}. Full review threads, load more,
                and helpful votes ship with the reviews module; telemetry contracts are already in{" "}
                <code className="rounded bg-white/60 px-1 py-0.5 text-xs text-ink/80">API_REQUIREMENTS.md</code>.
              </p>
            </div>
          ) : null}

          {tab === "highlights" ? (
            <div className="max-w-3xl">
              <h2 className={`${tw.displayH2} text-2xl sm:text-3xl`}>Highlights</h2>
              {!showStylingTab(product.vertical) && (product.tags?.length ?? 0) > 0 ? (
                <>
                  <p className={`mt-4 text-sm leading-relaxed sm:text-[0.9375rem] ${tw.muted}`}>
                    Merchandising tags for this {vertical} SKU (replaces apparel-only “Styling ideas”).
                  </p>
                  <ul className={`${tw.chipList} mt-4`} aria-label="Product tags">
                    {product.tags!.map((tag) => (
                      <li key={tag} className={tw.chip}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {product.badges.length > 0 ? (
                <ul className={`${tw.chipList} mt-6`} aria-label="Badges">
                  {product.badges.map((badge) => (
                    <li key={badge} className={tw.chip}>
                      {badge}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className={`mt-6 space-y-2 text-sm leading-relaxed text-ink/90 sm:text-[0.9375rem]`}>
                {product.features.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
