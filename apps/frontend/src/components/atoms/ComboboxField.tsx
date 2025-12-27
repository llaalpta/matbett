"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { VISUAL_STATE_WARNING_STYLES } from "@/utils/fieldStyles";
import { FormFieldLabel } from "./FormFieldLabel";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[];
  size?: "sm" | "md" | "lg";
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
  displayError?: boolean;
}

export function ComboboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  options,
  size = "md",
  className,
  containerClassName,
  disabled = false,
  required = false,
  tooltip,
  displayError = false,
}: ComboboxFieldProps<TFieldValues, TName>) {
  const [open, setOpen] = useState(false);

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-9 text-base",
    lg: "h-10 text-lg"
  };

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          // Calcular estado visual (Default | Warning | Error)
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-required={required}
                    disabled={disabled}
                    data-visual-state={visualState}
                    className={cn(
                      "w-full justify-between",
                      sizeClasses[size],
                      !field.value && "text-muted-foreground",
                      VISUAL_STATE_WARNING_STYLES
                    )}
                  >
                    {field.value
                      ? options.find((option) => option.value === field.value)?.label
                      : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                      <CommandEmpty>{emptyText}</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              field.onChange(currentValue === field.value ? "" : currentValue);
                              setOpen(false);
                            }}
                          >
                            {option.label}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                field.value === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormControl>
            {displayError && <FormMessage />}
          </FormItem>
          );
        }}
      />
    </div>
  );
}