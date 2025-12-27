"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // CAMBIO 1: Hacemos control opcional (?)
  // Si no se pasa, FormField (Controller) usará useFormContext internamente
  control?: Control<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  tooltip?: string; // Texto que aparece en el tooltip al hacer hover sobre el ícono (?)
  options: SelectOption[];
  size?: "sm" | "md" | "lg";
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  required?: boolean; // Campo requerido - muestra asterisco y highlight amarillo si vacío
  displayError?: boolean;
}

export function SelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control, // Puede ser undefined
  name,
  label,
  placeholder,
  tooltip,
  options,
  size = "lg",
  className,
  containerClassName,
  disabled = false,
  onValueChange,
  required = false,
  displayError = false,
}: SelectFieldProps<TFieldValues, TName>) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-9",
    lg: "h-10",
  };

  return (
    <div className={cn("min-w-0 space-y-2", containerClassName)}>
      <FormField
        // Si control es undefined, React Hook Form busca el contexto automáticamente
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
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  onValueChange?.(value);
                }}
                value={field.value}
                disabled={disabled}
                required={required}
              >
                <FormControl>
                  <SelectTrigger
                    aria-required={required}
                    data-visual-state={visualState}
                    className={cn(
                      sizeClasses[size],
                      "w-full rounded-md bg-background"
                    )}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}