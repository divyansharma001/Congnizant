import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { products } from "@/mocks/data/products";
import { useWishlistStore } from "@/features/wishlist/store";
import { tw } from "@/shared/ui/tw";

export function WishlistPage() {
  const productIds = useWishlistStore((state) => state.productIds);
  const wishlistProducts = products.filter((product) => productIds.includes(product.id));

  return (
    <div className={`${tw.editorialBreakout} ${tw.storyCanvas} border-b border-outline/15`}>
      <div className={`${tw.layoutFrame} py-10 sm:py-12 lg:py-14`}>
        <section className="mb-10 max-w-3xl sm:mb-12">
          <p className={`mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${tw.muted}`}>Wishlist</p>
          <h1 className={`${tw.storyTitle}`}>Saved pieces carry preference signals.</h1>
          <p className={`mt-5 max-w-xl text-pretty text-sm leading-relaxed ${tw.muted}`}>
            Same catalogue card treatment as `/catalog`—fixed-width tiles so a single save never stretches edge to
            edge.
          </p>
        </section>
        {wishlistProducts.length > 0 ? (
          <ProductGrid products={wishlistProducts} />
        ) : (
          <p className={tw.muted}>Save products to your wishlist to simulate durable preference signals.</p>
        )}
      </div>
    </div>
  );
}
