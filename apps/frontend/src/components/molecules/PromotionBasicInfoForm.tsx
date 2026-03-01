"use client";

import {
  activationMethodOptions,
  promotionCardinalityOptions,
} from "@matbett/shared";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DateTimeField } from "@/components/atoms/DateTimeField";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { TextareaField } from "@/components/atoms/TextareaField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { usePromotionAccessLogic } from "@/hooks/domain/promotions/usePromotionAccessLogic";
import { usePromotionStatusDateSync } from "@/hooks/useStatusDateSync";
import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";

interface PromotionBasicInfoFormProps {
  onSinglePhaseChange?: (value: PromotionFormData["cardinality"]) => void;
  onNameChange?: (value: string | number | undefined) => void;
  onDescriptionChange?: (value: string | undefined) => void;
  serverData?: PromotionServerModel;
}

export function PromotionBasicInfoForm({
  onSinglePhaseChange,
  onNameChange,
  onDescriptionChange,
  serverData,
}: PromotionBasicInfoFormProps) {
  const { control, setValue, getValues } = useFormContext<PromotionFormData>();
  const promotionStatus = useWatch({ control, name: "status" });
  const promotionTimeframe = useWatch({ control, name: "timeframe" });
  const phases = useWatch({ control, name: "phases" });
  const { data: bookmakerAccountsResponse, isLoading: isLoadingAccounts } =
    useBookmakerAccounts({
      pageIndex: 0,
      pageSize: 100,
    });
  const bookmakerAccountOptions =
    bookmakerAccountsResponse?.data.map((account) => ({
      value: account.id,
      label: formatBookmakerAccountLabel(account),
    })) ?? [];
  const firstBookmakerAccountId = bookmakerAccountOptions[0]?.value;

  usePromotionStatusDateSync({
    control,
    setValue,
    statusPath: "status",
    datePath: "statusDate",
    serverDates: serverData
      ? {
          activatedAt: serverData.activatedAt ?? null,
          completedAt: serverData.completedAt ?? null,
          expiredAt: serverData.expiredAt ?? null,
        }
      : undefined,
  });

  useEffect(() => {
    if (!firstBookmakerAccountId) {
      return;
    }

    if (!getValues("bookmakerAccountId")) {
      setValue("bookmakerAccountId", firstBookmakerAccountId);
    }
  }, [firstBookmakerAccountId, getValues, setValue]);

  const handleSinglePhaseChange = (value: string) => {
    if (value === "SINGLE" || value === "MULTIPLE") {
      onSinglePhaseChange?.(value);
    }
  };
  const promotionAccess = usePromotionAccessLogic({
    isPersisted: Boolean(serverData?.id),
    promotionStatus:
      typeof promotionStatus === "string" ? promotionStatus : undefined,
    timeframe: promotionTimeframe,
    phases,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {promotionAccess.warnings.length > 0 ? (
          <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
            <AlertDescription className="space-y-1 text-amber-900">
              {promotionAccess.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </AlertDescription>
          </Alert>
        ) : null}

        {!promotionAccess.isStructureEditable &&
        promotionAccess.structureLockedReason ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {promotionAccess.structureLockedReason}
          </div>
        ) : null}

        <fieldset
          disabled={!promotionAccess.isStructureEditable}
          className="space-y-4"
        >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<PromotionFormData>
            name="bookmakerAccountId"
            label="Cuenta de la promoción"
            options={bookmakerAccountOptions}
            placeholder={
              isLoadingAccounts ? "Cargando cuentas..." : "Selecciona una cuenta"
            }
            disabled={isLoadingAccounts || bookmakerAccountOptions.length === 0}
            required
          />
          <SelectField<PromotionFormData>
            name="cardinality"
            label="Tipo de promoción"
            options={promotionCardinalityOptions}
            onValueChange={handleSinglePhaseChange}
            required
          />
          <SelectField<PromotionFormData>
            name="activationMethod"
            label="Método de activación"
            options={activationMethodOptions}
          />
        </div>

        {!isLoadingAccounts && bookmakerAccountOptions.length === 0 ? (
          <p className="text-sm text-destructive">
            Necesitas crear una cuenta antes de registrar promociones.
          </p>
        ) : null}

        <InputField<PromotionFormData>
          name="name"
          label="Nombre"
          onValueChange={onNameChange}
          required
        />

        <TextareaField<PromotionFormData>
          name="description"
          label="Descripción"
          rows={3}
          onValueChange={onDescriptionChange}
        />
        </fieldset>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <SelectField<PromotionFormData>
            name="status"
            label="Estado"
            options={promotionAccess.statusOptions}
          />
          <DateTimeField<PromotionFormData>
            name="statusDate"
            label="Fecha del cambio de estado"
            tooltip="Fecha en la que la promoción cambió a este estado"
          />
        </div>
      </div>

      <fieldset
        disabled={!promotionAccess.isStructureEditable}
        className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateTimeField<PromotionFormData>
            name="timeframe.start"
            label="Fecha de inicio de la promoción"
            required
          />
          <DateTimeField<PromotionFormData>
            name="timeframe.end"
            label="Fecha de finalización de la promoción"
          />
        </div>
      </fieldset>
    </div>
  );
}
