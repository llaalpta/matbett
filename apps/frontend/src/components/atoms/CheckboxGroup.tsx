"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control?: Control<TFieldValues>;
  name: TName;
  options: CheckboxOption[];
  label?: string;
  tooltip?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean; // Si required, al menos uno debe estar seleccionado
  displayError?: boolean;
}

export function CheckboxGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  options,
  label,
  tooltip,
  className,
  containerClassName,
  disabled = false,
  required = false,
  displayError = false,
}: CheckboxGroupProps<TFieldValues, TName>) {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          const value = (field.value as string[]) || [];

          // Para grupos: está "vacío" si el array tiene 0 elementos
          const isEmpty = value.length === 0;
          const visualState = getFieldVisualState(
            isEmpty ? undefined : value, // undefined si vacío para que getFieldVisualState detecte
            required,
            fieldState.error,
            formState.isSubmitted
          );

          const handleChange = (optionValue: string, checked: boolean) => {
            if (checked) {
              field.onChange([...value, optionValue]);
            } else {
              field.onChange(value.filter((v: string) => v !== optionValue));
            }
          };

          return (
            <FormItem className={className}>
              {label && (
                <FormFieldLabel
                  label={label}
                  required={required}
                  tooltip={tooltip}
                />
              )}
              {/* Contenedor del grupo con estilos de warning/error */}
              <div
                data-visual-state={visualState}
                className={cn(
                  "grid grid-cols-2 gap-2 p-3 rounded-md transition-colors",
                  visualState === "warning" && "border border-warning bg-warning/10",
                  visualState === "error" && "border border-destructive bg-destructive/10"
                )}
              >
                {options.map((option) => (
                  <div key={option.value} className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={value.includes(option.value)}
                        onCheckedChange={(checked) =>
                          handleChange(option.value, checked as boolean)
                        }
                        disabled={disabled}
                      />
                    </FormControl>
                    <label
                      className="text-sm cursor-pointer"
                      onClick={() => handleChange(option.value, !value.includes(option.value))}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}
