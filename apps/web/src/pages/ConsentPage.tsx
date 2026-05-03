import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTrackEvent } from "@/features/events/useTrackEvent";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

const scopes = ["analytics", "personalization", "marketing"];

export function ConsentPage() {
  const queryClient = useQueryClient();
  const track = useTrackEvent();
  const consentQuery = useQuery({
    queryKey: ["consent"],
    queryFn: apiClient.getConsent,
  });
  const mutation = useMutation({
    mutationFn: (nextScopes: string[]) => apiClient.updateConsent(nextScopes),
    onSuccess: (next) => {
      queryClient.setQueryData(["consent"], next);
    },
  });

  if (!consentQuery.data) {
    return (
      <div className={tw.page}>
        <p className={tw.muted}>Loading consent controls...</p>
      </div>
    );
  }

  const selected = new Set(consentQuery.data.scopes);

  return (
    <div className={tw.stackLg}>
      <section className={tw.sectionHeader}>
        <div>
          <span className={tw.eyebrow}>Consent controls</span>
          <h1 className={`${tw.displayH1} mt-2`}>
            Show how the experience changes when personalization is allowed or blocked.
          </h1>
        </div>
      </section>
      <article className={`${tw.surface} ${tw.surfacePad} ${tw.stackMd}`}>
        {scopes.map((scope) => (
          <label key={scope} className={`${tw.flexBetween} border-b border-outline py-3 last:border-b-0`}>
            <span>{scope}</span>
            <input
              type="checkbox"
              checked={selected.has(scope)}
              onChange={() => {
                const next = new Set(selected);
                if (next.has(scope)) {
                  next.delete(scope);
                } else {
                  next.add(scope);
                }
                const nextScopes = Array.from(next);
                mutation.mutate(nextScopes);
                track({
                  customer_id: "demo-customer-1",
                  event_type: "consent_updated",
                  payload: { scopes: nextScopes },
                  consent_scope: nextScopes,
                });
              }}
            />
          </label>
        ))}
      </article>
    </div>
  );
}
