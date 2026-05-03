import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { useCartStore, getCartSubtotal } from "@/features/cart/store";
import { formatCurrency } from "@/shared/lib/format";
import { tw } from "@/shared/ui/tw";

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = getCartSubtotal(items);

  return (
    <div className="grid grid-cols-[minmax(0,1.3fr)_360px] gap-6 max-[960px]:grid-cols-1">
      <section className={tw.stackLg}>
        <div className={tw.sectionHeader}>
          <div>
            <span className={tw.eyebrow}>Fake checkout</span>
            <h1 className={`${tw.displayH1} mt-2`}>
              Complete the journey so the tracking model sees downstream intent.
            </h1>
          </div>
        </div>
        <CheckoutForm />
      </section>
      <aside className={`${tw.surface} ${tw.surfacePad} ${tw.stackSm}`}>
        <span className={tw.eyebrow}>Order summary</span>
        {items.map((item) => (
          <div key={item.product.id} className={`${tw.flexBetween} border-b border-outline py-3`}>
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <strong>{formatCurrency(item.product.price * item.quantity)}</strong>
          </div>
        ))}
        <div className={`${tw.flexBetween} border-b border-outline py-3`}>
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
      </aside>
    </div>
  );
}
