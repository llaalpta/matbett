"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // CAMBIO: Hacemos control opcional (?)
  // Si no se pasa, FormField buscará el contexto automáticamente
  control?: Control<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  tooltip?: string; // Texto que aparece en el tooltip al hacer hover sobre el ícono (?)
  rows?: number;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  onValueChange?: (value: string | undefined) => void;
  required?: boolean; // Campo requerido - muestra asterisco y highlight amarillo si vacío
  displayError?: boolean;
}

export function TextareaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control, // Puede ser undefined
  name,
  label,
  placeholder,
  tooltip,
  rows = 3,
  className,
  containerClassName,
  disabled = false,
  onValueChange,
  required = false,
  displayError = false,
}: TextareaFieldProps<TFieldValues, TName>) {
  return (
    <div className={cn("min-w-0 space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          // Calcular estado visual usando función pura
          const visualState = getFieldVisualState(
            field.value,
            required,
            fieldState.error,
            formState.isSubmitted
          );

          return (
            <FormItem className={className}>
              {label && (
                <FormFieldLabel
                  label={label}
                  required={required}
                  tooltip={tooltip}
                />
              )}
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={placeholder}
                  rows={rows}
                  disabled={disabled}
                  required={required}
                  aria-required={required}
                  data-visual-state={visualState}
                  className="rounded-md" // bg-background removido - conflicto con warning
                  onChange={(e) => {
                    field.onChange(e);
                    onValueChange?.(e.target.value);
                  }}
                />
              </FormControl>
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}