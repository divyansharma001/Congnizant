import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { CatalogToolbar } from "@/features/catalog/components/CatalogToolbar";
import {
  CatalogProductGridSkeleton,
  CatalogToolbarSkeleton,
} from "@/features/catalog/components/CatalogSkeletons";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { useTrackEvent } from "@/features/events/useTrackEvent";
import { useProductSearch } from "@/features/catalog/hooks/useProductSearch";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const track = useTrackEvent();
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "featured";
  const page = params.get("page") ?? "1";
  const vertical = params.get("vertical") ?? "";
  const freeDelivery = params.get("freeDelivery") === "true" ? "true" : "";
  const query = useProductSearch({ category, sort, page, vertical, freeDelivery });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: apiClient.getCategories,
  });

  const updateCategory = (nextCategory: string) => {
    const next = new URLSearchParams(params);
    if (nextCategory) {
      next.set("category", nextCategory);
    } else {
      next.delete("category");
    }
    next.delete("page");
    setParams(next);
    track({
      customer_id: "demo-customer-1",
      event_type: "category_view",
      payload: { category: nextCategory || "all" },
      consent_scope: ["analytics", "personalization"],
    });
  };

  const updateSort = (nextSort: string) => {
    const next = new URLSearchParams(params);
    next.set("sort", nextSort);
    next.delete("page");
    setParams(next);
    track({
      customer_id: "demo-customer-1",
      event_type: "sort_changed",
      payload: { sort: nextSort, category },
      consent_scope: ["analytics", "personalization"],
    });
  };

  const updateVertical = (nextVertical: string) => {
    const next = new URLSearchParams(params);
    if (nextVertical) {
      next.set("vertical", nextVertical);
    } else {
      next.delete("vertical");
    }
    next.delete("page");
    setParams(next);
    track({
      customer_id: "demo-customer-1",
      event_type: "filter_change",
      payload: { filter: "vertical", value: nextVertical || "all", category },
      consent_scope: ["analytics", "personalization"],
    });
  };

  const updateFreeDelivery = (only: boolean) => {
    const next = new URLSearchParams(params);
    if (only) {
      next.set("freeDelivery", "true");
    } else {
      next.delete("freeDelivery");
    }
    next.delete("page");
    setParams(next);
    track({
      customer_id: "demo-customer-1",
      event_type: "filter_change",
      payload: { filter: "freeDelivery", value: only, category },
      consent_scope: ["analytics", "personalization"],
    });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setParams(next);
  };

  const pageNum = Math.max(1, Number(page || "1"));
  const pageSize = query.data?.pageSize ?? 12;
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const categoriesReady = Boolean(categoriesQuery.data);
  const categoriesBusy = categoriesQuery.isPending || categoriesQuery.isLoading;
  const productsReady = Boolean(query.data);
  const productsBusy = query.isPending || query.isLoading;

  return (
    <div className={`${tw.stackLg} pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-14 lg:pb-16`}>
      <header className="max-w-3xl">
        <p className={`mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Catalog</p>
        <h1 className={`${tw.storyTitle} max-w-[18ch]`}>Browse editorial product surfaces the way a real shopper would.</h1>       
      </header>

      {query.isError ? (
        <p className="text-sm text-red-800/90" role="alert">
          Could not load products. Check your connection and try again.
        </p>
      ) : null}

      {!categoriesReady && categoriesBusy ? (
        <CatalogToolbarSkeleton />
      ) : categoriesQuery.data ? (
        <CatalogToolbar
          categories={categoriesQuery.data}
          activeCategory={category}
          activeSort={sort}
          resultsLoading={productsBusy && !query.data}
          total={query.data?.total ?? 0}
          totalFiltered={query.data?.total}
          page={query.data?.page ?? 1}
          pageSize={query.data?.pageSize ?? pageSize}
          activeVertical={vertical}
          freeDeliveryOnly={freeDelivery === "true"}
          facets={query.data?.facets}
          onCategoryChange={updateCategory}
          onSortChange={updateSort}
          onVerticalChange={updateVertical}
          onFreeDeliveryToggle={updateFreeDelivery}
        />
      ) : null}

      {!productsReady && productsBusy ? (
        <CatalogProductGridSkeleton />
      ) : query.data ? (
        <ProductGrid products={query.data.items} />
      ) : null}

      {productsReady && totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-4 border-t border-outline/12 pt-6 sm:pt-7"
          aria-label="Catalog pagination"
        >
          <button
            type="button"
            className={tw.buttonGhost}
            disabled={pageNum <= 1}
            onClick={() => setPage(pageNum - 1)}
          >
            Previous
          </button>
          <span className={`text-sm ${tw.muted}`}>
            Page {pageNum} of {totalPages}
          </span>
          <button
            type="button"
            className={tw.buttonGhost}
            disabled={pageNum >= totalPages}
            onClick={() => setPage(pageNum + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
