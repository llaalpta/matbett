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
              "flex flex-row items-center space-x-3 space-y-0 px-3 h-10 transition-colors",
              bordered && "border rounded-md",
              // Aplicar estilos warning/error al contenedor
              visualState === "warning" && "border border-warning bg-warning/10 rounded-md",
              visualState === "error" && "border border-destructive bg-destructive/10 rounded-md",
              className
            )}
          >
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onValueChange?.(checked as boolean);
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
              {description && (
                <FormDescription>
                  {description}
                </FormDescription>
              )}
            </div>
            {displayError && <FormMessage />}
          </FormItem>
        );
      }}
    />
  );
}