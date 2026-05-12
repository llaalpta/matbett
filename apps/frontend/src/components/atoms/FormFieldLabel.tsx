import { Info } from "lucide-react";

import { FormLabel } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormFieldLabelProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  className?: string;
}

/**
 * Componente reutilizable para labels de formulario con:
 * - Asterisco rojo si required={true}
 * - Tooltip opcional (icono info)
 *
 * Usado por InputField, SelectField, TextareaField, etc.
 */
export function FormFieldLabel({
  label,
  required = false,
  tooltip,
  className,
}: FormFieldLabelProps) {
  return (
    <FormLabel
      className={cn(
        "inline-flex min-h-4 items-center gap-1.5 leading-none",
        className ?? "text-sm font-medium"
      )}
    >
      {label}
      {required && (
        <span className="text-destructive" aria-label="obligatorio">
          *
        </span>
      )}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <Info className="text-muted-foreground h-3 w-3 cursor-help" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </FormLabel>
  );
}
