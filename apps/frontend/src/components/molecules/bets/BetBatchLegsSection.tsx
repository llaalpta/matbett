import { BetBatchLegsTable } from "./legs";
import type { BookmakerAccountLike } from "./types";

type BetBatchLegsSectionProps = {
  mode: "create" | "edit";
  bookmakerAccounts: BookmakerAccountLike[];
};

export function BetBatchLegsSection({
  mode,
  bookmakerAccounts,
}: BetBatchLegsSectionProps) {
  return (
    <BetBatchLegsTable mode={mode} bookmakerAccounts={bookmakerAccounts} />
  );
}
