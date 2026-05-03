import { Link } from "react-router-dom";

import { getCartSubtotal, useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/shared/lib/format";
import { tw } from "@/shared/ui/tw";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = getCartSubtotal(items);

  return (
    <div className={tw.stackLg}>
      <section className={tw.sectionHeader}>
        <div>
          <span className={tw.eyebrow}>Cart</span>
          <h1 className={`${tw.displayH1} mt-2`}>
            Track purchase intent without needing a live checkout backend.
          </h1>
        </div>
      </section>
      <div className={`${tw.surface} ${tw.surfacePad} ${tw.stackMd}`}>
        {items.length === 0 ? (
          <p className={tw.muted}>Your cart is empty. Add a product to simulate purchase intent.</p>
        ) : (
          items.map((item) => (
            <article
              key={item.product.id}
              className={`${tw.flexBetween} border-b border-outline py-3 first:pt-0 last:border-b-0`}
            >
              <div>
                <strong>{item.product.name}</strong>
                <p className={tw.muted}>{formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  className={`${tw.fieldInput} max-w-[5.5rem]`}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                />
                <button type="button" className={tw.buttonGhost} onClick={() => removeItem(item.product.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
        <div className={`${tw.flexBetween} border-t border-outline pt-4`}>
          <strong>Subtotal</strong>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <Link to="/checkout" className={tw.button}>
          Continue to fake checkout
        </Link>
      </div>
    </div>
  );
}
