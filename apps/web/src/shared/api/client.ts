import { env } from "@/shared/config/env";
import type {
  Category,
  CheckoutInput,
  CheckoutResponse,
  ConsentRecord,
  CreateProductReviewBody,
  CreateProductReviewResponse,
  DeliveryAddress,
  DeliveryAddressListResponse,
  ExplanationRecord,
  IngestEventRequest,
  OrderListResponse,
  OrderSummary,
  Product,
  ProductListResponse,
  ProductReviewsResponse,
  ProfileSummary,
  RecommendationRail,
  SetReviewHelpfulBody,
  SetReviewHelpfulResponse,
  TrackedEvent,
} from "@/shared/api/contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  getCategories: () => request<Category[]>("/catalog/categories"),
  getProducts: (params = "") => request<ProductListResponse>(`/catalog/products${params}`),
  /** Same catalog slice for every shopper — popularity / bestseller ordering from the server. */
  getPopularProducts: () => request<Product[]>(`/catalog/popular`),
  getProduct: (slug: string) => request<Product>(`/catalog/products/${slug}`),
  getProductReviews: (slug: string, params = "") =>
    request<ProductReviewsResponse>(`/catalog/products/${slug}/reviews${params}`),
  createProductReview: (slug: string, body: CreateProductReviewBody) =>
    request<CreateProductReviewResponse>(`/catalog/products/${slug}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setReviewHelpful: (slug: string, reviewId: string, body: SetReviewHelpfulBody) =>
    request<SetReviewHelpfulResponse>(
      `/catalog/products/${slug}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      { method: "PUT", body: JSON.stringify(body) },
    ),
  searchProducts: (params = "") => request<ProductListResponse>(`/search${params}`),
  getHomeRecommendations: () => request<RecommendationRail[]>("/recommendations/home"),
  getSurfaceRecommendations: (surface: string, value?: string) =>
    request<RecommendationRail[]>(
      `/recommendations/${surface}${value ? `?productId=${encodeURIComponent(value)}` : ""}`,
    ),
  getConsent: () => request<ConsentRecord>("/consent"),
  updateConsent: (scopes: string[]) =>
    request<ConsentRecord>("/consent", {
      method: "PUT",
      body: JSON.stringify({ scopes }),
    }),
  getProfile: () => request<ProfileSummary>("/me/profile"),
  updateProfile: (explicitPreferences: ProfileSummary["explicitPreferences"]) =>
    request<ProfileSummary>("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({ explicitPreferences }),
    }),
  getExplanations: () => request<ExplanationRecord>("/me/explanations"),
  trackEvent: (body: IngestEventRequest) =>
    request<{ event_id: string; status: string; job_id: string }>("/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getDebugEvents: () => request<TrackedEvent[]>("/debug/events"),
  checkout: (body: CheckoutInput) =>
    request<CheckoutResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getOrders: (params = "") => request<OrderListResponse>(`/me/orders${params}`),
  patchOrderDeliveryAddress: (orderId: string, deliveryAddressId: string) =>
    request<OrderSummary>(`/me/orders/${encodeURIComponent(orderId)}/delivery-address`, {
      method: "PATCH",
      body: JSON.stringify({ deliveryAddressId }),
    }),
  getAddresses: () => request<DeliveryAddressListResponse>("/me/addresses"),
  patchAddress: (id: string, body: Partial<DeliveryAddress>) =>
    request<DeliveryAddress>(`/me/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
