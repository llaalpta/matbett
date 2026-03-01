import type { AnchorCatalog } from "@matbett/shared";
import { useMemo } from "react";

import { useAnchorCatalog, useAnchorOccurrences } from "@/hooks/api/usePromotions";
import { mergeAnchorCatalogs } from "@/utils/anchorCatalog";

interface UseAnchorContextArgs {
  promotionId?: string;
  draftCatalog?: AnchorCatalog;
  removedRefs?: Set<string>;
}

export function useAnchorContext({
  promotionId,
  draftCatalog,
  removedRefs,
}: UseAnchorContextArgs) {
  const { data: serverCatalog, isLoading: isLoadingAnchorCatalog } =
    useAnchorCatalog(promotionId);
  const { data: anchorOccurrences, isLoading: isLoadingAnchorOccurrences } =
    useAnchorOccurrences(promotionId);

  const anchorCatalog = useMemo(
    () =>
      mergeAnchorCatalogs({
        serverCatalog,
        draftCatalog,
        removedRefs,
      }),
    [draftCatalog, removedRefs, serverCatalog]
  );

  return {
    anchorCatalog,
    anchorOccurrences,
    isLoadingAnchorCatalog,
    isLoadingAnchorOccurrences,
  };
}
