"use client";

import { betStatusOptions } from "@matbett/shared";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DateTimeField, InputField, SelectField } from "@/components/atoms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBetLegCardLogic } from "@/hooks/domain/bets/useBetLegCardLogic";
import { useBetPromotionContextAssignment } from "@/hooks/domain/bets/useBetPromotionContextAssignment";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { cn } from "@/lib/utils";
import { getBetOperationBetSummary } from "@/utils/bets";
import {
  formatFixedPercentage,
  formatSignedCurrencyAmount,
  getSignedMetricToneClass,
} from "@/utils/formatters";

import type { BookmakerAccountLike } from "../types";

import { BetLegAdjustmentSection } from "./BetLegAdjustmentSection";
import { BetLegPromotionContextAction } from "./BetLegPromotionContextAction";

type BetBatchLegsTableProps = {
  mode: "create" | "edit";
  bookmakerAccounts: BookmakerAccountLike[];
};

type BetBatchLegRowProps = BetBatchLegsTableProps & {
  legIndex: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
};

const compactSelectClassName = "min-w-0";
const compactNumberClassName = "min-w-0";
const compactCurrencyClassName = "min-w-0";
const compactLegLabelClassName =
  "text-muted-foreground text-[10px] font-medium leading-none";
const hideFieldLabelClassName = "[&_label]:sr-only";
const desktopHeadClassName =
  "text-muted-foreground h-8 px-2 py-1.5 text-left text-[11px] font-semibold";
const desktopNumericHeadClassName = cn(desktopHeadClassName, "text-right");
const responsiveCellClassName =
  "grid grid-cols-[112px_minmax(0,1fr)] items-start gap-2 px-3 py-1.5 align-top whitespace-normal xl:table-cell xl:px-2 xl:py-1.5";
const responsiveNumericCellClassName = cn(
  responsiveCellClassName,
  "xl:w-[72px] xl:text-right"
);

export function BetBatchLegsTable({
  mode,
  bookmakerAccounts,
}: BetBatchLegsTableProps) {
  const form = useFormContext<BetBatchFormValues>();
  const legs = useWatch({ control: form.control, name: "legs" }) ?? [];
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpanded = (legIndex: number) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(legIndex)) {
        next.delete(legIndex);
      } else {
        next.add(legIndex);
      }
      return next;
    });
  };

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Apuestas de la operación</h3>
        </div>
        <Badge variant="outline">
          {legs.length} apuesta{legs.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="px-3 py-2">
        <Table className="border-separate border-spacing-0 text-xs xl:min-w-[1220px] xl:table-fixed">
          <colgroup>
            <col className="xl:w-[116px]" />
            <col className="xl:w-[136px]" />
            <col className="xl:w-[200px]" />
            <col className="xl:w-[64px]" />
            <col className="xl:w-[72px]" />
            <col className="xl:w-[62px]" />
            <col className="xl:w-[72px]" />
            <col className="xl:w-[72px]" />
            <col className="xl:w-[62px]" />
            <col className="xl:w-[132px]" />
            <col className="xl:w-[158px]" />
            <col className="xl:w-[74px]" />
          </colgroup>
          <TableHeader className="hidden xl:table-header-group">
            <TableRow className="border-border/70 bg-muted/40 hover:bg-muted/40">
              <TableHead className={desktopHeadClassName}>Apuesta</TableHead>
              <TableHead className={desktopHeadClassName}>Cuenta</TableHead>
              <TableHead className={desktopHeadClassName}>Selección</TableHead>
              <TableHead className={desktopNumericHeadClassName}>Cuota</TableHead>
              <TableHead className={desktopNumericHeadClassName}>Stake</TableHead>
              <TableHead className={desktopNumericHeadClassName}>Com.</TableHead>
              <TableHead className={desktopNumericHeadClassName}>
                Profit est.
              </TableHead>
              <TableHead className={desktopNumericHeadClassName}>
                Riesgo est.
              </TableHead>
              <TableHead className={desktopNumericHeadClassName}>
                Yield est.
              </TableHead>
              <TableHead className={desktopHeadClassName}>Estado</TableHead>
              <TableHead className={desktopHeadClassName}>Fecha</TableHead>
              <TableHead className={cn(desktopHeadClassName, "text-center")}>
                <span className="sr-only">Contexto promocional</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block space-y-2 xl:table-row-group xl:space-y-0">
            {legs.map((leg, legIndex) => (
              <BetBatchLegRow
                key={`${leg.betId ?? "new"}-${legIndex}`}
                legIndex={legIndex}
                mode={mode}
                bookmakerAccounts={bookmakerAccounts}
                isExpanded={expandedRows.has(legIndex)}
                onToggleExpanded={() => toggleExpanded(legIndex)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function BetBatchLegRow({
  legIndex,
  mode,
  bookmakerAccounts,
  isExpanded,
  onToggleExpanded,
}: BetBatchLegRowProps) {
  const {
    leg,
    operation,
    strategy,
    bookmakerOptions,
    isSingleMatchedLayout,
    isMainLeg,
    derivedHedge1Selection,
    shouldRenderAdjustmentSection,
    legAdjustmentOptions,
    selectedAdjustment,
    setSelectedAdjustment,
  } = useBetLegCardLogic({
    legIndex,
    mode,
    bookmakerAccounts,
  });
  const form = useFormContext<BetBatchFormValues>();
  const events = useWatch({ control: form.control, name: "events" }) ?? [];
  const { removeContextsFromLeg } = useBetPromotionContextAssignment();

  if (!leg) {
    return null;
  }

  const hasExpandedDetails = shouldRenderAdjustmentSection;
  const roleSummary = getBetOperationBetSummary({
    index: legIndex,
    operation,
    role: leg.legRole,
    strategy,
  });

  const handleAccountChange = (nextBookmakerAccountId: string) => {
    const hasContexts = (leg.participations ?? []).length > 0;
    const isChangingAccount = nextBookmakerAccountId !== leg.bookmakerAccountId;

    if (!hasContexts || !isChangingAccount) {
      return;
    }

    const shouldUnlink = window.confirm(
      "Esta apuesta tiene contexto promocional vinculado. Si cambias la cuenta, se desvincularán esos contextos porque pueden dejar de ser compatibles."
    );

    if (shouldUnlink) {
      removeContextsFromLeg(legIndex);
      return;
    }

    form.setValue(`legs.${legIndex}.bookmakerAccountId`, leg.bookmakerAccountId, {
      shouldDirty: false,
    });
  };

  return (
    <>
      <TableRow className="block rounded-md border bg-background py-2 hover:bg-background xl:table-row xl:rounded-none xl:border-x-0 xl:border-t-0 xl:py-0 xl:hover:bg-muted/20">
        <TableCell className={responsiveCellClassName}>
          <MobileCellLabel>Apuesta</MobileCellLabel>
          <div className="min-w-0">
            <Badge variant="outline" className="whitespace-nowrap leading-none">
              {roleSummary.label}
            </Badge>
            <div
              className="text-muted-foreground mt-1 truncate text-[11px]"
              title={roleSummary.description}
            >
              {roleSummary.description}
            </div>
          </div>
        </TableCell>

        <TableCell className={responsiveCellClassName}>
          <MobileCellLabel>Cuenta</MobileCellLabel>
          <SelectField<BetBatchFormValues>
            name={`legs.${legIndex}.bookmakerAccountId`}
            label="Cuenta"
            labelClassName={compactLegLabelClassName}
            options={bookmakerOptions}
            size="sm"
            required
            containerClassName={cn(compactSelectClassName, hideFieldLabelClassName)}
            onValueChange={handleAccountChange}
          />
        </TableCell>

        <TableCell className={cn(responsiveCellClassName, "xl:w-[200px]")}>
          <MobileCellLabel>Selección</MobileCellLabel>
          <SelectionCell
            legIndex={legIndex}
            events={events}
            operation={operation}
            legRole={leg.legRole}
            isSingleMatchedLayout={isSingleMatchedLayout}
            isMainLeg={isMainLeg}
            derivedHedge1Selection={derivedHedge1Selection}
            selections={leg.selections ?? []}
          />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Cuota</MobileCellLabel>
          <InputField<BetBatchFormValues>
            name={`legs.${legIndex}.odds`}
            label="Cuota"
            labelClassName={compactLegLabelClassName}
            type="number"
            min={0}
            step={0.01}
            size="sm"
            required
            treatZeroAsEmpty
            containerClassName={cn(compactNumberClassName, hideFieldLabelClassName)}
            inputClassName="text-right"
          />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Stake</MobileCellLabel>
          <InputField<BetBatchFormValues>
            name={`legs.${legIndex}.stake`}
            label={isSingleMatchedLayout && !isMainLeg ? "Stake prop." : "Stake"}
            labelClassName={compactLegLabelClassName}
            type="number"
            min={0}
            step={0.01}
            size="sm"
            required={isMainLeg || !isSingleMatchedLayout}
            treatZeroAsEmpty={isMainLeg || !isSingleMatchedLayout}
            containerClassName={cn(
              compactCurrencyClassName,
              hideFieldLabelClassName,
              isSingleMatchedLayout && !isMainLeg && "rounded-md bg-sky-50/70"
            )}
            inputClassName={cn(
              "text-right",
              isSingleMatchedLayout &&
                !isMainLeg &&
                "border-sky-300 bg-white font-semibold text-sky-900"
            )}
          />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Com.</MobileCellLabel>
          <InputField<BetBatchFormValues>
            name={`legs.${legIndex}.commission`}
            label="Com. %"
            labelClassName={compactLegLabelClassName}
            type="number"
            min={0}
            step={0.01}
            size="sm"
            containerClassName={cn(compactNumberClassName, hideFieldLabelClassName)}
            inputClassName="text-right"
          />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Profit estimado</MobileCellLabel>
          <MetricCell value={leg.profit} format="number" />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Riesgo estimado</MobileCellLabel>
          <MetricCell value={leg.risk} format="number" />
        </TableCell>

        <TableCell className={responsiveNumericCellClassName}>
          <MobileCellLabel>Yield estimado</MobileCellLabel>
          <MetricCell value={leg.yield} format="percentage" />
        </TableCell>

        <TableCell className={responsiveCellClassName}>
          <MobileCellLabel>Estado</MobileCellLabel>
          <SelectField<BetBatchFormValues>
            name={`legs.${legIndex}.status`}
            label="Estado"
            labelClassName={compactLegLabelClassName}
            options={betStatusOptions}
            size="sm"
            containerClassName={cn("min-w-0", hideFieldLabelClassName)}
          />
        </TableCell>

        <TableCell className={responsiveCellClassName}>
          <MobileCellLabel>Fecha</MobileCellLabel>
          <DateTimeField<BetBatchFormValues>
            name={`legs.${legIndex}.placedAt`}
            label="Fecha"
            labelClassName={compactLegLabelClassName}
            size="sm"
            containerClassName={cn("min-w-0", hideFieldLabelClassName)}
          />
        </TableCell>

        <TableCell className={responsiveCellClassName}>
          <MobileCellLabel>Contexto</MobileCellLabel>
          <div className="flex items-center gap-1 xl:justify-center">
            <BetLegPromotionContextAction
              legIndex={legIndex}
              bookmakerAccountId={leg.bookmakerAccountId}
            />
            {hasExpandedDetails ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onToggleExpanded}
                title="Ajustes de apuesta"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="sr-only">Ajustes de apuesta</span>
              </Button>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      {hasExpandedDetails && isExpanded ? (
        <TableRow className="block rounded-md border bg-muted/15 xl:table-row xl:rounded-none xl:border-x-0 xl:border-t-0">
          <TableCell
            colSpan={12}
            className="block px-3 py-3 xl:table-cell xl:px-2 xl:py-2"
          >
            <div className="flex justify-end">
              {shouldRenderAdjustmentSection ? (
                <BetLegAdjustmentSection
                  options={legAdjustmentOptions}
                  value={selectedAdjustment}
                  onValueChange={setSelectedAdjustment}
                />
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function SelectionCell({
  legIndex,
  events,
  operation,
  legRole,
  isSingleMatchedLayout,
  isMainLeg,
  derivedHedge1Selection,
  selections,
}: {
  legIndex: number;
  events: BetBatchFormValues["events"];
  operation: BetBatchFormValues["operation"];
  legRole: BetBatchFormValues["legs"][number]["legRole"];
  isSingleMatchedLayout: boolean;
  isMainLeg: boolean;
  derivedHedge1Selection: string;
  selections: BetBatchFormValues["legs"][number]["selections"];
}) {
  if (isSingleMatchedLayout && !isMainLeg) {
    return (
      <div className="min-w-0">
        <div
          className="flex h-8 items-center truncate rounded-md border bg-muted/25 px-2 text-xs"
          title={derivedHedge1Selection || "Se deriva desde la apuesta principal"}
        >
          {derivedHedge1Selection || "Se deriva desde la apuesta principal"}
        </div>
      </div>
    );
  }

  if (selections.length > 1) {
    return (
      <div className="min-w-0 space-y-1">
        {selections.map((selection, selectionIndex) => {
          const eventName =
            events[selection.eventIndex]?.eventName?.trim() ||
            `Evento ${selection.eventIndex + 1}`;
          const showSelectionOdds =
            operation?.lineMode !== "SINGLE" &&
            (legRole === "MAIN" || legRole === undefined);

          return (
            <div
              key={`${selection.eventIndex}-${selectionIndex}`}
              className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)_48px] items-start gap-1"
            >
              <div
                className="flex h-8 items-center truncate rounded-md border bg-muted/25 px-2 text-[11px] font-medium text-muted-foreground"
                title={eventName}
              >
                {eventName}
              </div>
              <InputField<BetBatchFormValues>
                name={`legs.${legIndex}.selections.${selectionIndex}.selection`}
                label={eventName}
                labelClassName="sr-only"
                placeholder="Selección"
                size="sm"
                required
                containerClassName="min-w-0"
                inputClassName="truncate"
              />
              {showSelectionOdds ? (
                <InputField<BetBatchFormValues>
                  name={`legs.${legIndex}.selections.${selectionIndex}.odds`}
                  label="Cuota"
                  labelClassName="sr-only"
                  placeholder="Cuota"
                  type="number"
                  min={0}
                  step={0.01}
                  size="sm"
                  required
                  treatZeroAsEmpty
                  containerClassName="min-w-0"
                  inputClassName="text-right"
                />
              ) : (
                <div />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <InputField<BetBatchFormValues>
      name={`legs.${legIndex}.selections.0.selection`}
      label="Selección"
      labelClassName={compactLegLabelClassName}
      size="sm"
      required
      containerClassName={cn("min-w-0", hideFieldLabelClassName)}
      placeholder="Selección"
      inputClassName="truncate"
    />
  );
}

function MetricCell({
  value,
  format,
}: {
  value: number | undefined;
  format: "number" | "percentage";
}) {
  const safeValue = value ?? 0;

  return (
    <div
      className={cn(
        "flex h-8 min-w-0 items-center justify-end text-xs font-semibold tabular-nums",
        getSignedMetricToneClass(safeValue)
      )}
    >
      {format === "percentage"
        ? formatFixedPercentage(safeValue)
        : formatSignedCurrencyAmount(safeValue)}
    </div>
  );
}

function MobileCellLabel({ children }: { children: string }) {
  return (
    <span className="pt-2 text-[11px] font-medium text-muted-foreground xl:sr-only">
      {children}
    </span>
  );
}
