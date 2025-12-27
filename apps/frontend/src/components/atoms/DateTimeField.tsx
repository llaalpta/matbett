"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Control, FieldPath, FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getFieldVisualState } from "@/utils/fieldVisualState";
import { FormFieldLabel } from "./FormFieldLabel";

interface DateTimeFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control?: Control<TFieldValues>;
  name: TName;
  label?: string;
  tooltip?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean;
  displayError?: boolean;
}

export function DateTimeField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  tooltip,
  className,
  containerClassName,
  disabled = false,
  required = false,
  displayError = false,
}: DateTimeFieldProps<TFieldValues, TName>) {
  return (
    <div className={cn("min-w-0 space-y-2", containerClassName)}>
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          // Handle potential raw values (string) or Date objects safely
          const rawValue = field.value as unknown;
          const parsedDate =
            rawValue instanceof Date
              ? rawValue
              : typeof rawValue === "string" && rawValue
                ? new Date(rawValue)
                : undefined;

          const validFieldDate =
            parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;

          function handleDateSelect(date: Date | undefined) {
            if (date) {
              field.onChange(date);
            }
          }

          function handleTimeChange(type: "hour" | "minute", value: string) {
            const currentDate = validFieldDate || new Date();
            const newDate = new Date(currentDate.getTime());

            if (type === "hour") {
              const hour = parseInt(value, 10);
              newDate.setHours(hour);
            } else if (type === "minute") {
              newDate.setMinutes(parseInt(value, 10));
            }

            field.onChange(newDate);
          }

          // Calcular estado visual
          const visualState = getFieldVisualState(
            validFieldDate,
            required,
            fieldState.error,
            formState.isSubmitted
          );

          return (
            <FormItem className={cn(className, disabled && "opacity-50")}>
              {label && (
                <FormFieldLabel
                  label={label}
                  required={required}
                  tooltip={tooltip}
                />
              )}
              <Popover>
                <PopoverTrigger asChild disabled={disabled}>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      disabled={disabled}
                      data-visual-state={visualState}
                      className={cn(
                        "w-full pl-3 text-left font-normal text-sm transition-colors",
                        !validFieldDate && "text-muted-foreground/50",
                        // Aplicar estilos warning/error al botón trigger
                        visualState === "warning" && "border-warning bg-warning/20 hover:bg-warning/30",
                        visualState === "error" && "border-destructive bg-destructive/20 hover:bg-destructive/30"
                      )}
                    >
                      {validFieldDate ? (
                        format(validFieldDate, "MM/dd/yyyy HH:mm")
                      ) : (
                        <span>MM/DD/YYYY HH:mm</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="sm:flex">
                    <Calendar
                      mode="single"
                      selected={validFieldDate}
                      onSelect={handleDateSelect}
                      autoFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                      <ScrollArea className="w-64 sm:w-auto">
                        <div className="flex sm:flex-col p-2">
                          {Array.from({ length: 24 }, (_, i) => i)
                            .reverse()
                            .map((hour) => (
                              <Button
                                key={hour}
                                size="icon"
                                variant={
                                  validFieldDate && validFieldDate.getHours() === hour
                                    ? "default"
                                    : "ghost"
                                }
                                className="sm:w-full shrink-0 aspect-square"
                                onClick={() =>
                                  handleTimeChange("hour", hour.toString())
                                }
                              >
                                {hour}
                              </Button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="sm:hidden" />
                      </ScrollArea>
                      <ScrollArea className="w-64 sm:w-auto">
                        <div className="flex sm:flex-col p-2">
                          {Array.from({ length: 12 }, (_, i) => i * 5).map(
                            (minute) => (
                              <Button
                                key={minute}
                                size="icon"
                                variant={
                                  validFieldDate &&
                                  validFieldDate.getMinutes() === minute
                                    ? "default"
                                    : "ghost"
                                }
                                className="sm:w-full shrink-0 aspect-square"
                                onClick={() =>
                                  handleTimeChange("minute", minute.toString())
                                }
                              >
                                {minute.toString().padStart(2, '0')}
                              </Button>
                            )
                          )}
                        </div>
                        <ScrollBar orientation="horizontal" className="sm:hidden" />
                      </ScrollArea>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {displayError && <FormMessage />}
            </FormItem>
          );
        }}
      />
    </div>
  );
}