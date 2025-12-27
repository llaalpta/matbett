import { Info } from "lucide-react";

import { FormLabel } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <FormLabel className={className ?? "flex items-center gap-1.5 text-sm font-medium"}>
      {label}
      {required && (
        <span className="text-destructive" aria-label="obligatorio">
          *
        </span>
      )}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </FormLabel>
  );
}
