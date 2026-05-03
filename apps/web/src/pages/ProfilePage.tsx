import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProfileSummary } from "@/features/profile/components/ProfileSummary";
import { useTrackEvent } from "@/features/events/useTrackEvent";
import { apiClient } from "@/shared/api/client";
import { tw } from "@/shared/ui/tw";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const track = useTrackEvent();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: apiClient.getProfile,
  });
  const explanationsQuery = useQuery({
    queryKey: ["explanations"],
    queryFn: apiClient.getExplanations,
  });

  const mutation = useMutation({
    mutationFn: apiClient.updateProfile,
    onSuccess: (next) => {
      queryClient.setQueryData(["profile"], next);
    },
  });

  if (!profileQuery.data || !explanationsQuery.data) {
    return (
      <div className={tw.page}>
        <p className={tw.muted}>Loading profile lab...</p>
      </div>
    );
  }

  return (
    <div className={tw.stackLg}>
      <section className={tw.sectionHeader}>
        <div>
          <span className={tw.eyebrow}>Profile lab</span>
          <h1 className={`${tw.displayH1} mt-2`}>
            Make the system’s understanding of the shopper visible and editable.
          </h1>
        </div>
      </section>
      <ProfileSummary profile={profileQuery.data} explanations={explanationsQuery.data} />
      <article className={`${tw.surface} ${tw.surfacePad} ${tw.stackMd}`}>
        <span className={tw.eyebrow}>Quick preference update</span>
        <button
          type="button"
          className={tw.button}
          onClick={() => {
            const next = profileQuery.data.explicitPreferences.map((item) =>
              item.key === "budget" ? { ...item, value: "$40-$120" } : item,
            );
            mutation.mutate(next);
            track({
              customer_id: "demo-customer-1",
              event_type: "profile_updated",
              payload: { field: "budget", value: "$40-$120" },
              consent_scope: ["analytics", "personalization"],
            });
          }}
        >
          Simulate budget preference change
        </button>
      </article>
    </div>
  );
}
