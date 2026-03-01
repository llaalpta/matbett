/**
 * Utilities para manejar los tipos de condiciones de uso
 */

// Helper para obtener el estilo del badge según el tipo de condición de uso
export const getUsageTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    FREEBET: "default",
    BET_BONUS_ROLLOVER: "secondary",
    BET_BONUS_NO_ROLLOVER: "outline",
    CASHBACK_FREEBET: "destructive",
    ENHANCED_ODDS: "default",
    CASINO_SPINS: "secondary",
  };
  return variants[type] || "outline";
};

export const getUsageTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    FREEBET: "FreeBet",
    BET_BONUS_ROLLOVER: "Bono con Rollover",
    BET_BONUS_NO_ROLLOVER: "Bono sin Rollover",
    CASHBACK_FREEBET: "Cashback FreeBet",
    ENHANCED_ODDS: "Cuotas Mejoradas",
    CASINO_SPINS: "Tiradas Gratis",
  };
  return labels[type] || type;
};
