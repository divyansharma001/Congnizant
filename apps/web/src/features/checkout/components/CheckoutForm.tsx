import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCartStore, getCartSubtotal } from "@/features/cart/store";
import { useTrackEvent } from "@/features/events/useTrackEvent";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  address: z.string().min(4),
  city: z.string().min(2),
  country: z.string().min(2),
  paymentMethod: z.enum(["card", "wallet"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const track = useTrackEvent();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const subtotal = getCartSubtotal(items);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "ava@hyperpersona.demo",
      fullName: "Ava Chen",
      address: "121 Orchard Way",
      city: "Seattle",
      country: "United States",
      paymentMethod: "card",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      apiClient.checkout({
        ...values,
        subtotal,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess: (response) => {
      startTransition(() => {
        setConfirmation(response.orderId);
        clear();
      });
      track({
        customer_id: "demo-customer-1",
        event_type: "checkout_completed",
        payload: { orderId: response.orderId, subtotal },
        consent_scope: ["analytics", "personalization"],
      });
    },
  });

  if (confirmation) {
    return (
      <article className={`${tw.surface} ${tw.surfacePad} ${tw.stackSm}`}>
        <span className={tw.eyebrow}>Order confirmed</span>
        <h2 className={`${tw.displayH2} text-3xl`}>Demo checkout complete</h2>
        <p className={tw.muted}>
          Order <strong>{confirmation}</strong> was created so the frontend can demonstrate post-purchase tracking.
        </p>
      </article>
    );
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <label className="grid gap-2 text-sm">
          Email
          <input autoComplete="email" spellCheck={false} className={tw.fieldInput} {...form.register("email")} />
        </label>
        <label className="grid gap-2 text-sm">
          Full name
          <input autoComplete="name" className={tw.fieldInput} {...form.register("fullName")} />
        </label>
        <label className="grid gap-2 text-sm">
          Address
          <input autoComplete="street-address" className={tw.fieldInput} {...form.register("address")} />
        </label>
        <label className="grid gap-2 text-sm">
          City
          <input autoComplete="address-level2" className={tw.fieldInput} {...form.register("city")} />
        </label>
        <label className="grid gap-2 text-sm">
          Country
          <input autoComplete="country-name" className={tw.fieldInput} {...form.register("country")} />
        </label>
        <label className="grid gap-2 text-sm">
          Payment
          <select className={tw.fieldInput} {...form.register("paymentMethod")}>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
          </select>
        </label>
      </div>
      <button type="submit" className={tw.button} disabled={mutation.isPending || items.length === 0}>
        {mutation.isPending ? "Submitting..." : "Place fake order"}
      </button>
    </form>
  );
}
