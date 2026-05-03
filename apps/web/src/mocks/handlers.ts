import { delay, http, HttpResponse } from "msw";

import { homeRails, productRails } from "@/mocks/data/recommendations";
import { seedReviewsBySlug } from "@/mocks/data/productReviews";
import { initialConsent, initialProfile, explanationRecord } from "@/mocks/data/profile";
import { categories, products } from "@/mocks/data/products";
import type {
  CatalogFacetGroup,
  CheckoutInput,
  ConsentRecord,
  CreateProductReviewBody,
  DeliveryAddress,
  DeliveryAddressListResponse,
  IngestEventRequest,
  OrderListResponse,
  OrderSummary,
  Product,
  ProductListResponse,
  ProductReview,
  ProductVertical,
  ProfileSummary,
  ReviewHelpfulVote,
  SetReviewHelpfulBody,
  TrackedEvent,
  ViewerProductReview,
} from "@/shared/api/contracts";

let consentState: ConsentRecord = initialConsent;
let profileState: ProfileSummary = initialProfile;
let trackedEvents: TrackedEvent[] = [];

function cloneReviewSeeds(): Record<string, ProductReview[]> {
  const out: Record<string, ProductReview[]> = {};
  for (const [slug, list] of Object.entries(seedReviewsBySlug)) {
    out[slug] = list.map((row) => ({ ...row }));
  }
  return out;
}

/** Mutable PDP review threads + current shopper’s submitted review per slug (demo session). */
let reviewsBySlug: Record<string, ProductReview[]> = cloneReviewSeeds();
const viewerReviewBySlug: Record<string, ViewerProductReview | null> = {};

function mergeViewerReview(slug: string, product: (typeof products)[number]) {
  return { ...product, viewerReview: viewerReviewBySlug[slug] ?? null };
}

function applyHelpfulVote(review: ProductReview, vote: ReviewHelpfulVote) {
  let helpfulCount = review.helpfulCount;
  let notHelpfulCount = review.notHelpfulCount;
  const prev = review.viewerHelpfulVote ?? null;
  if (prev === "helpful") helpfulCount -= 1;
  if (prev === "not_helpful") notHelpfulCount -= 1;
  if (vote === "helpful") helpfulCount += 1;
  if (vote === "not_helpful") notHelpfulCount += 1;
  return { ...review, helpfulCount, notHelpfulCount, viewerHelpfulVote: vote };
}

function matchesQuery(text: string, search: string) {
  return text.toLowerCase().includes(search.toLowerCase());
}

function productVertical(p: Product): ProductVertical {
  return p.vertical ?? "general";
}

function buildFacets(filtered: Product[]): CatalogFacetGroup[] {
  const count = (pred: (p: Product) => boolean) => filtered.filter(pred).length;
  return [
    {
      id: "vertical",
      label: "Department",
      facetType: "multi",
      values: [
        { value: "apparel", label: "Apparel & accessories", count: count((p) => productVertical(p) === "apparel") },
        { value: "furniture", label: "Furniture & lighting", count: count((p) => productVertical(p) === "furniture") },
        { value: "electronics", label: "Electronics", count: count((p) => productVertical(p) === "electronics") },
        { value: "general", label: "Everyday & other", count: count((p) => productVertical(p) === "general") },
      ],
    },
    {
      id: "freeDelivery",
      label: "Delivery",
      facetType: "boolean",
      values: [{ value: "true", label: "Free delivery", count: count((p) => p.freeDelivery === true) }],
    },
    {
      id: "price",
      label: "Price",
      facetType: "range",
      min: filtered.length ? Math.min(...filtered.map((p) => p.price)) : 0,
      max: filtered.length ? Math.max(...filtered.map((p) => p.price)) : 0,
    },
  ];
}

function filterProducts(url: URL): ProductListResponse {
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort") ?? "featured";
  const brand = url.searchParams.get("brand");
  const vertical = url.searchParams.get("vertical");
  const freeDelivery = url.searchParams.get("freeDelivery");
  const tagsParam = url.searchParams.get("tags");
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")));

  let filtered: Product[] = [...products];

  if (category) {
    filtered = filtered.filter((product) => product.category === category);
  }

  if (search) {
    filtered = filtered.filter((product) =>
      [product.name, product.brand, product.description, ...(product.tags ?? []), ...product.features].some((field) =>
        matchesQuery(field, search),
      ),
    );
  }

  if (brand) {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  }

  if (vertical) {
    const wanted = vertical.split(",").map((v) => v.trim()) as ProductVertical[];
    filtered = filtered.filter((p) => wanted.includes(productVertical(p)));
  }

  if (freeDelivery === "true") {
    filtered = filtered.filter((p) => p.freeDelivery === true);
  }

  if (minPrice) {
    const n = Number(minPrice);
    if (!Number.isNaN(n)) filtered = filtered.filter((p) => p.price >= n);
  }
  if (maxPrice) {
    const n = Number(maxPrice);
    if (!Number.isNaN(n)) filtered = filtered.filter((p) => p.price <= n);
  }

  if (tagsParam) {
    const wanted = tagsParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (wanted.length) {
      filtered = filtered.filter((p) => {
        const hay = [...(p.tags ?? []), ...p.personalizationTags].map((x) => x.toLowerCase());
        return wanted.some((t) => hay.some((h) => h.includes(t)));
      });
    }
  }

  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const total = filtered.length;
  const facets = buildFacets(filtered);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    facets,
    personalized: consentState.scopes.includes("personalization"),
  };
}

const seedAddresses: DeliveryAddress[] = [
  {
    id: "addr-home",
    label: "Home",
    line1: "12 Rue Editoriale",
    city: "Montreal",
    region: "QC",
    postalCode: "H2X 1A1",
    country: "CA",
    isDefault: true,
  },
  {
    id: "addr-office",
    label: "Office",
    line1: "400 King St W",
    line2: "Suite 900",
    city: "Toronto",
    region: "ON",
    postalCode: "M5V 1K1",
    country: "CA",
  },
];

let addressBook: DeliveryAddress[] = seedAddresses.map((a) => ({ ...a }));

let ordersState: OrderSummary[] = [
  {
    id: "ord-demo-1001",
    status: "shipped",
    placedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    total: 308,
    currency: "CAD",
    destinationLabel: "Home · Montreal",
    lineCount: 2,
    trackingUrl: "https://example.com/track/ord-demo-1001",
    deliveryAddressId: "addr-home",
    lines: [
      { productId: "prod-1", slug: "altitude-shell-jacket", name: "Altitude Shell Jacket", quantity: 1, unitPrice: 220 },
      { productId: "prod-7", slug: "ridge-merino-sock", name: "Ridge Merino Sock", quantity: 2, unitPrice: 24 },
    ],
  },
  {
    id: "ord-demo-1002",
    status: "delivered",
    placedAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    total: 128,
    currency: "CAD",
    destinationLabel: "Office · Toronto",
    lineCount: 1,
    deliveryAddressId: "addr-office",
    lines: [{ productId: "prod-11", slug: "arc-desk-lamp", name: "Arc Desk Lamp", quantity: 1, unitPrice: 128 }],
  },
];

export const handlers = [
  http.get("/api/catalog/categories", async () => {
    await delay(150);
    return HttpResponse.json(categories);
  }),
  http.get("/api/catalog/products", async ({ request }) => {
    await delay(240);
    return HttpResponse.json(filterProducts(new URL(request.url)));
  }),
  http.get("/api/catalog/popular", async () => {
    await delay(130);
    const sorted = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6);
    return HttpResponse.json(sorted);
  }),
  http.get("/api/catalog/products/:slug", async ({ params }) => {
    await delay(180);
    const slug = String(params.slug);
    const product = products.find((item) => item.slug === slug);

    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(mergeViewerReview(slug, product));
  }),
  http.get("/api/catalog/products/:slug/reviews", async ({ params, request }) => {
    await delay(160);
    const slug = String(params.slug);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "10")));
    const all = reviewsBySlug[slug] ?? [];
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return HttpResponse.json({ items, page, pageSize, total });
  }),
  http.post("/api/catalog/products/:slug/reviews", async ({ params, request }) => {
    await delay(200);
    const slug = String(params.slug);
    const product = products.find((item) => item.slug === slug);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    if (viewerReviewBySlug[slug]) {
      return HttpResponse.json({ error: "already_reviewed", message: "Update flow not implemented in demo." }, { status: 409 });
    }
    const body = (await request.json()) as CreateProductReviewBody;
    if (body.rating < 1 || body.rating > 5 || typeof body.body !== "string" || body.body.trim().length < 4) {
      return HttpResponse.json({ error: "validation_error" }, { status: 400 });
    }
    const review: ProductReview = {
      id: `rev-${slug}-${Date.now()}`,
      productId: product.id,
      authorDisplayName: "You",
      rating: body.rating,
      title: body.title,
      body: body.body.trim(),
      createdAt: new Date().toISOString(),
      verifiedPurchase: false,
      helpfulCount: 0,
      notHelpfulCount: 0,
      viewerHelpfulVote: null,
    };
    if (!reviewsBySlug[slug]) reviewsBySlug[slug] = [];
    reviewsBySlug[slug] = [review, ...reviewsBySlug[slug]];
    const viewerReview: ViewerProductReview = {
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt,
    };
    viewerReviewBySlug[slug] = viewerReview;
    return HttpResponse.json({ review, viewerReview });
  }),
  http.put("/api/catalog/products/:slug/reviews/:reviewId/helpful", async ({ params, request }) => {
    await delay(120);
    const slug = String(params.slug);
    const reviewId = String(params.reviewId);
    const body = (await request.json()) as SetReviewHelpfulBody;
    const list = reviewsBySlug[slug];
    if (!list) {
      return new HttpResponse(null, { status: 404 });
    }
    const idx = list.findIndex((r) => r.id === reviewId);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    const updated = applyHelpfulVote(list[idx], body.vote);
    list[idx] = updated;
    return HttpResponse.json({
      reviewId: updated.id,
      helpfulCount: updated.helpfulCount,
      notHelpfulCount: updated.notHelpfulCount,
      viewerHelpfulVote: body.vote,
    });
  }),
  http.get("/api/search", async ({ request }) => {
    await delay(220);
    return HttpResponse.json(filterProducts(new URL(request.url)));
  }),
  http.get("/api/recommendations/home", async () => {
    await delay(160);
    return HttpResponse.json(
      consentState.scopes.includes("personalization")
        ? homeRails
        : homeRails.map((rail) => ({
            ...rail,
            fallback: true,
            confidence: 0.52,
            reason: "Personalization is off, so these are generic best-performing products.",
          })),
    );
  }),
  http.get("/api/recommendations/pdp", async () => {
    await delay(140);
    return HttpResponse.json(productRails);
  }),
  http.get("/api/recommendations/cart", async () => {
    await delay(140);
    return HttpResponse.json(productRails);
  }),
  http.get("/api/recommendations/profile", async () => {
    await delay(160);
    return HttpResponse.json(homeRails);
  }),
  http.get("/api/consent", async () => {
    await delay(90);
    return HttpResponse.json(consentState);
  }),
  http.put("/api/consent", async ({ request }) => {
    const body = (await request.json()) as { scopes: string[] };
    consentState = {
      ...consentState,
      scopes: body.scopes,
      lastUpdated: new Date().toISOString(),
    };
    return HttpResponse.json(consentState);
  }),
  http.get("/api/me/profile", async () => {
    await delay(120);
    return HttpResponse.json(profileState);
  }),
  http.patch("/api/me/preferences", async ({ request }) => {
    const body = (await request.json()) as {
      explicitPreferences: ProfileSummary["explicitPreferences"];
    };
    profileState = {
      ...profileState,
      explicitPreferences: body.explicitPreferences,
      lastUpdated: new Date().toISOString(),
    };
    return HttpResponse.json(profileState);
  }),
  http.get("/api/me/explanations", async () => {
    await delay(100);
    return HttpResponse.json(explanationRecord);
  }),
  http.post("/api/events", async ({ request }) => {
    const body = (await request.json()) as IngestEventRequest;
    const record: TrackedEvent = {
      event_id: crypto.randomUUID(),
      event_type: body.event_type,
      payload: body.payload,
      status: "sent",
      created_at: new Date().toISOString(),
    };
    trackedEvents = [record, ...trackedEvents].slice(0, 30);
    return HttpResponse.json({
      event_id: record.event_id,
      job_id: crypto.randomUUID(),
      status: "queued",
    });
  }),
  http.get("/api/debug/events", async () => {
    await delay(60);
    return HttpResponse.json(trackedEvents);
  }),
  http.post("/api/checkout", async ({ request }) => {
    const body = (await request.json()) as CheckoutInput;
    return HttpResponse.json({
      orderId: `demo-${body.items.length}-${Date.now()}`,
      status: "confirmed",
      placedAt: new Date().toISOString(),
    });
  }),
  http.get("/api/me/orders", async ({ request }) => {
    await delay(120);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "10")));
    const start = (page - 1) * pageSize;
    const items = ordersState.slice(start, start + pageSize);
    const res: OrderListResponse = { items, page, pageSize, total: ordersState.length };
    return HttpResponse.json(res);
  }),
  http.patch("/api/me/orders/:orderId/delivery-address", async ({ params, request }) => {
    await delay(140);
    const orderId = String(params.orderId);
    const body = (await request.json()) as { deliveryAddressId: string };
    const exists = addressBook.some((a) => a.id === body.deliveryAddressId);
    if (!exists) {
      return HttpResponse.json({ error: "address_not_found" }, { status: 404 });
    }
    const idx = ordersState.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    const addr = addressBook.find((a) => a.id === body.deliveryAddressId)!;
    ordersState[idx] = {
      ...ordersState[idx],
      deliveryAddressId: body.deliveryAddressId,
      destinationLabel: `${addr.label} · ${addr.city}`,
    };
    return HttpResponse.json(ordersState[idx]);
  }),
  http.get("/api/me/addresses", async () => {
    await delay(90);
    const res: DeliveryAddressListResponse = { items: addressBook };
    return HttpResponse.json(res);
  }),
  http.patch("/api/me/addresses/:id", async ({ params, request }) => {
    await delay(100);
    const id = String(params.id);
    const body = (await request.json()) as Partial<DeliveryAddress>;
    const idx = addressBook.findIndex((a) => a.id === id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    addressBook[idx] = { ...addressBook[idx], ...body, id: addressBook[idx].id };
    return HttpResponse.json(addressBook[idx]);
  }),
];
