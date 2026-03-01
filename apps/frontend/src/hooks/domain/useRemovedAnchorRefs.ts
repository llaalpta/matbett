import { useCallback, useState } from "react";

import { buildAnchorRefKey } from "@/utils/anchorCatalog";

export function useRemovedAnchorRefs() {
  const [removedAnchorRefs, setRemovedAnchorRefs] = useState<Set<string>>(
    () => new Set<string>()
  );

  const markRemoved = useCallback(
    (entityType: "PROMOTION" | "PHASE" | "REWARD" | "QUALIFY_CONDITION", id?: string) => {
      if (!id) {
        return;
      }
      setRemovedAnchorRefs((prev) => {
        const next = new Set(prev);
        next.add(buildAnchorRefKey(entityType, "persisted", id));
        return next;
      });
    },
    []
  );

  const unmarkRemoved = useCallback(
    (entityType: "PROMOTION" | "PHASE" | "REWARD" | "QUALIFY_CONDITION", id?: string) => {
      if (!id) {
        return;
      }
      setRemovedAnchorRefs((prev) => {
        const next = new Set(prev);
        next.delete(buildAnchorRefKey(entityType, "persisted", id));
        return next;
      });
    },
    []
  );

  const resetRemoved = useCallback(() => {
    setRemovedAnchorRefs(new Set<string>());
  }, []);

  return {
    removedAnchorRefs,
    markRemoved,
    unmarkRemoved,
    resetRemoved,
  };
}
