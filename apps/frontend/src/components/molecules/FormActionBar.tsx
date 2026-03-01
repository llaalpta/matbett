"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface FormActionBarProps {
  onSave?: () => void; // Opcional, si es type="submit" no se usa
  onDiscard: () => void;
  isLoading?: boolean;
  
  // Props para el botón de volver
  showBackButton?: boolean; // Determina si se muestra el botón
  backHref?: string;        // Ruta específica a la que volver
  backToLabel?: string;     // Texto del botón de volver (ej: "Volver a Promociones")

  saveLabel?: string;
  discardLabel?: string;
}

export function FormActionBar({
  onSave,
  onDiscard,
  isLoading = false,
  showBackButton = false,
  backHref,
  backToLabel = "Volver", // Default más genérico
  saveLabel = "Guardar",
  discardLabel = "Descartar",
}: FormActionBarProps) {
  const router = useRouter();

  // Si no se proporciona backHref, el botón "Volver" simplemente usa router.back()
  const handleBackClick = () => {
    if (backHref) {
      router.push(backHref);
    }
    else {
      router.back();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-up z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Back Button */}
        <div>
          {showBackButton && (backHref || typeof window !== 'undefined' && window.history.length > 1) && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackClick}
              className="pl-0 cursor-pointer hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {/* Texto corto en móvil, completo en pantallas medianas+ */}
              <span className="sm:hidden">Volver</span>
              <span className="hidden sm:inline">{backToLabel}</span>
            </Button>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isLoading}>
            {discardLabel}
          </Button>
          <Button 
            type={onSave ? "button" : "submit"} 
            onClick={onSave}
            disabled={isLoading} 
            className="min-w-[120px]"
          >
            {isLoading ? "Guardando..." : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
