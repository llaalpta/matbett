import { redirect } from "next/navigation";

export default async function LegacyBetBatchEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/bets/${id}`);
}
