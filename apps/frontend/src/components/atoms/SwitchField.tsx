"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface SwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control?: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  tooltip?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean; // Activa lógica visual de warning (switch debe estar ON)
  onValueChange?: (value: boolean) => void;
  displayError?: boolean;
}

export function SwitchField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  tooltip,
  containerClassName,
  disabled = false,
  required = false,
  onValueChange: _onValueChange,
  displayError = false,
}: SwitchFieldProps<TFieldValues, TName>) {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          // Para switch required: warning si está OFF (value = false/undefined)
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
                "space-y-2",
                // Aplicar estilos warning/error al contenedor
                visualState === "warning" && "border border-warning bg-warning/10 rounded-md p-2",
                visualState === "error" && "border border-destructive bg-destructive/10 rounded-md p-2",
                containerClassName
              )}
            >
              <div className={cn(
                "flex items-center space-x-2",
                disabled && "cursor-not-allowed opacity-50"
              )}>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      _onValueChange?.(checked);
                    }}
                    disabled={disabled}
                    aria-required={required}
                  />
                </FormControl>
                {label && (
                  <FormFieldLabel
                    label={label}
                    required={required}
                    tooltip={tooltip}
                    className="cursor-pointer"
                  />
                )}
              </div>
              {description && (
                <div className="text-sm text-muted-foreground ml-6">
                  {description}
                </div>
              )}
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}