"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { RewardStandaloneForm } from "@/components/organisms/RewardStandaloneForm";
import { Button } from "@/components/ui/button";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const rewardId = params.id;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/rewards">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Editar Reward</h1>
      </div>

      <RewardStandaloneForm rewardId={rewardId} />
    </div>
  );
}
