"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";

import { FormFieldLabel } from "./FormFieldLabel";

interface CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control?: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  tooltip?: string;
  bordered?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean; // Activa lógica visual de warning
  onValueChange?: (value: boolean) => void;
  displayError?: boolean;
}

export function CheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  tooltip,
  bordered = false,
  className,
  disabled = false,
  required = false,
  onValueChange,
  displayError = false,
}: CheckboxFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState, formState }) => {
        const visualState = getFieldVisualState(
          field.value,
          required,
          fieldState.error,
          formState.isSubmitted
        );

        return (
          <FormItem
            data-visual-state={visualState}
            className={cn(
              "flex h-10 flex-row items-center space-y-0 space-x-3 px-3 transition-colors",
              bordered && "rounded-md border",
              // Aplicar estilos warning/error al contenedor
              visualState === "warning" &&
                "border-warning bg-warning/10 rounded-md border",
              visualState === "error" &&
                "border-destructive bg-destructive/10 rounded-md border",
              className
            )}
          >
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  const nextValue = checked === true;
                  field.onChange(nextValue);
                  onValueChange?.(nextValue);
                }}
                disabled={disabled}
                required={required}
                aria-required={required}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormFieldLabel
                label={label}
                required={required}
                tooltip={tooltip}
              />
              {description && <FormDescription>{description}</FormDescription>}
            </div>
            {displayError && <FormMessage />}
          </FormItem>
        );
      }}
    />
  );
}
