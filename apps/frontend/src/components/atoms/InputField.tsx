"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface InputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // Configuración del Formulario
  control?: Control<TFieldValues>;
  name: TName;
  
  // Contenido y Etiquetas
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  
  // Configuración del Input
  type?: "text" | "email" | "number" | "password" | "url";
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
  required?: boolean; // Activa lógica visual de "warning"
  
  // Estilos
  className?: string;          // Aplica al contenedor intermedio (FormItem)
  containerClassName?: string; // Aplica al contenedor exterior (div)
  inputClassName?: string;     // Aplica directamente al <input> HTML
  
  // Valores Numéricos
  min?: number;
  max?: number;
  step?: number;
  
  // Eventos
  onValueChange?: (value: number | undefined | string) => void;
  
  // Visual
  displayError?: boolean;
}

export function InputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  description,
  tooltip,
  type = "text",
  variant = "default",
  className,
  containerClassName,
  inputClassName, // Nueva prop para estilos específicos del input
  disabled = false,
  min,
  max,
  step,
  onValueChange,
  required = false,
  displayError = false,
}: InputFieldProps<TFieldValues, TName>) {
  
  const variantClasses = {
    default: "border-input bg-background",
    outline: "border-border bg-background",
    ghost: "border-transparent bg-background",
  };

  return (
    <div className={cn("min-w-0 space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          // 1. Calcular estado visual (Default | Warning | Error)
          const visualState = getFieldVisualState(
            field.value,
            required,
            fieldState.error,
            formState.isSubmitted
          );

          return (
            <FormItem className={className}>
              {/* 2. Label reutilizable con Tooltip y Asterisco */}
              {label && (
                <FormFieldLabel
                  label={label}
                  required={required}
                  tooltip={tooltip}
                />
              )}
              
              <FormControl>
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  required={required}
                  aria-required={required}
                  
                  // 3. Inyección de estado visual para CSS
                  data-visual-state={visualState}
                  
                  min={type === "number" ? min : undefined}
                  max={type === "number" ? max : undefined}
                  step={type === "number" ? step : undefined}
                  
                  // 4. Composición de clases (Variante + Custom)
                  className={cn(
                    variantClasses[variant],
                    "focus-visible:ring-ring transition-colors",
                    inputClassName
                  )}
                  
                  // 5. Manejo seguro de valores (null/undefined -> "")
                  value={
                    type === "number"
                      ? (field.value ?? "") 
                      : field.value
                  }
                  
                  // 6. Manejo inteligente de onChange (Number vs String)
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    if (type === "number") {
                      // Convertir string vacío a undefined para que Zod no falle validando strings
                      const numValue = rawValue === "" ? undefined : Number(rawValue);
                      field.onChange(numValue);
                      onValueChange?.(numValue);
                    } else {
                      field.onChange(rawValue);
                      onValueChange?.(rawValue);
                    }
                  }}
                />
              </FormControl>
              
              {description && <FormDescription>{description}</FormDescription>}
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}