import { useMutation } from "@tanstack/react-query";

import { useDebugEventStore } from "@/features/events/debug/store";
import { apiClient } from "@/shared/api/client";
import type { IngestEventRequest } from "@/shared/api/contracts";

export function useTrackEvent() {
  const push = useDebugEventStore((state) => state.push);

  const mutation = useMutation({
    mutationFn: async (body: IngestEventRequest) => {
      const response = await apiClient.trackEvent(body);
      return {
        event_id: response.event_id,
        event_type: body.event_type,
        payload: body.payload,
        status: "sent" as const,
        created_at: new Date().toISOString(),
      };
    },
    onSuccess: (event) => {
      push(event);
    },
  });

  return mutation.mutate;
}
