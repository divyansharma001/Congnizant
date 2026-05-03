import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { CatalogProductGridSkeleton } from "@/features/catalog/components/CatalogSkeletons";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { SearchInsightPanel } from "@/features/search/components/SearchInsightPanel";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

export function SearchPage() {
  const [params] = useSearchParams();
  const search = params.get("q") ?? "";
  const query = useQuery({
    queryKey: ["search", search],
    queryFn: () => apiClient.searchProducts(`?q=${encodeURIComponent(search)}`),
    enabled: search.length > 0,
  });
  const explanationsQuery = useQuery({
    queryKey: ["explanations", search],
    queryFn: apiClient.getExplanations,
    enabled: search.length > 0,
  });

  const searchBusy = Boolean(search) && (query.isPending || query.isLoading);

  return (
    <div className={`${tw.editorialBreakout} ${tw.storyCanvas} border-b border-outline/15`}>
      <div className={`${tw.layoutFrame} py-10 sm:py-12 lg:py-14`}>
        <section className="mb-10 max-w-3xl sm:mb-12">
          <p className={`mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Search</p>
          <h1 className={`${tw.storyTitle}`}>Results for “{search || "your query"}”</h1>
        </section>
        {query.data && explanationsQuery.data ? (
          <SearchInsightPanel
            personalized={query.data.personalized}
            query={search}
            explanations={explanationsQuery.data.search}
          />
        ) : null}
        {searchBusy ? (
          <div className="mt-8">
            <CatalogProductGridSkeleton count={3} />
          </div>
        ) : query.data ? (
          <div className="mt-8">
            <ProductGrid
              products={query.data.items}
              accent={query.data.personalized ? "Boosted for your signals" : "Generic ranking"}
            />
          </div>
        ) : (
          <p className={`mt-6 text-sm ${tw.muted}`}>Search for products to see ranking behavior.</p>
        )}
      </div>
    </div>
  );
}
