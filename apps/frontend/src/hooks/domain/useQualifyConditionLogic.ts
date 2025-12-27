import { useCallback } from "react";
import { FieldValues, Path, PathValue, useFormContext, useWatch } from "react-hook-form";

import { buildDefaultQualifyCondition } from "@/utils/formDefaults";

export function useQualifyConditionLogic<T extends FieldValues>(
  basePath: Path<T>
) {
  // 1. Obtenemos contexto (incluido control para el watch)
  const { setValue, control } = useFormContext<T>();

  // 2. Lógica Reactiva (Watch interno)
  // El hook es quien "mira" el tipo, no el componente
  const conditionType = useWatch({
    control,
    name: `${basePath}.type` as Path<T>,
  });

  const contributesToRewardValue = useWatch({
    control,
    name: `${basePath}.conditions.contributesToRewardValue` as Path<T>,
  });

  // 3. Helpers derivados (para limpiar el JSX del componente)
  const isDeposit = conditionType === "DEPOSIT";
  const isBet = conditionType === "BET";
  const isLossesCashback = conditionType === "LOSSES_CASHBACK";

  // 4. Acciones
  const handleConditionTypeChange = useCallback(
    (newType: string) => {
      const defaultCondition = buildDefaultQualifyCondition(newType);

      setValue(basePath, defaultCondition as PathValue<T, Path<T>>, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [basePath, setValue]
  );

  /**
   * Handler para cambio de contributesToRewardValue en la condición.
   * Reconstruye la condición desde cero con los campos apropiados.
   */
  const handleValueTypeChange = useCallback(
    (newValue: boolean) => {
      // Type narrowing para inferencia correcta de tipos
      if (conditionType === 'BET') {
        // ✅ CORRECTO - Pasar contributesToRewardValue como parámetro
        const newCondition = buildDefaultQualifyCondition('BET', newValue);

        setValue(basePath, newCondition as PathValue<T, Path<T>>, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else if (conditionType === 'DEPOSIT') {
        // ✅ CORRECTO - Pasar contributesToRewardValue como parámetro
        const newCondition = buildDefaultQualifyCondition('DEPOSIT', newValue);

        setValue(basePath, newCondition as PathValue<T, Path<T>>, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [basePath, conditionType, setValue]
  );

  return {
    control, // Útil para inputs hijos
    conditionType,
    contributesToRewardValue,
    // Flags booleanos para renderizado condicional limpio
    isDeposit,
    isBet,
    isLossesCashback,
    // Acciones
    handleConditionTypeChange,
    handleValueTypeChange,
  };
}