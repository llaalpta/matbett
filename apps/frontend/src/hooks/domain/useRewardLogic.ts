import { useCallback } from "react";
import { FieldValues, Path, PathValue, useFormContext, useWatch } from "react-hook-form"; // <--- Importamos useFormContext

import type { RewardQualifyConditionFormData } from "@/types/hooks";
import { buildDefaultReward, buildDefaultQualifyCondition } from "@/utils/formDefaults";

/**
 * Hook de lógica de dominio para la gestión de Rewards.
 * Desacoplado: Usa el contexto del formulario activo.
 */
export function useRewardLogic<T extends FieldValues>(
  basePath: Path<T> | ""
  // Eliminamos el argumento 'form'. El hook lo busca solo.
) {
  // 1. Obtener métodos del contexto
  const { setValue, getValues, control, reset } = useFormContext<T>();

  // Helper para construir paths seguros (maneja basePath vacío)
  const getPath = useCallback((field: string) => {
    return basePath ? `${basePath}.${field}` : field;
  }, [basePath]);

  // Watchers locales
  const rewardType = useWatch({
    control,
    name: getPath("type") as Path<T>,
  });

  const valueType = useWatch({
    control,
    name: getPath("valueType") as Path<T>,
  });

  /**
   * Resetea el reward a sus valores por defecto cuando cambia el tipo
   */
  const handleTypeChange = useCallback(
    (newType: string) => {
      const defaultReward = buildDefaultReward(newType);
      // Mantenemos el ID si existe
      const currentId = getValues(getPath("id") as Path<T>);
      
      const newRewardData = {
        ...defaultReward,
        id: currentId,
      };

      // Si basePath es vacío, estamos en la raíz, usamos reset o setValue de root?
      // setValue con path "" no funciona. Si basePath es vacío, debemos iterar claves o usar reset?
      // En RHF, setValue de un objeto nested funciona. setValue de root...
      // Si basePath existe, es un objeto nested.
      if (basePath) {
         setValue(basePath, newRewardData as PathValue<T, Path<T>>, {
           shouldValidate: true,
           shouldDirty: true,
         });
      } else {
         // Estamos en root (RewardStandaloneForm). Usamos reset para reemplazar todos los valores.
         // Double cast: RewardFormData (union) -> unknown -> T (generic)
         // Safe at runtime because T is always RewardFormData when basePath is ""
         reset(newRewardData as unknown as T);
      }
    },
    [basePath, setValue, getValues, getPath, reset]
  );

  /**
   * Reconstruye qualifyConditions cuando cambia reward.valueType
   * Preserva campos comunes (id, description, timeframe, depositCode, etc.)
   */
  const handleValueTypeChange = useCallback(
    (newValueType: string) => {
      // Actualizar el valueType
      setValue(getPath("valueType") as Path<T>, newValueType as PathValue<T, Path<T>>, { shouldValidate: true });

      // Si es CALCULATED, resetear value a 0
      if (newValueType === "CALCULATED_FROM_CONDITIONS") {
        setValue(getPath("value") as Path<T>, 0 as PathValue<T, Path<T>>, { shouldValidate: true });
      }

      // Reconstruir todas las conditions preservando campos comunes
      const conditionsPath = getPath("qualifyConditions") as Path<T>;
      const conditions = getValues(conditionsPath);

      if (Array.isArray(conditions)) {
        conditions.forEach((condition: RewardQualifyConditionFormData, index: number) => {
          if (condition.type === 'DEPOSIT' || condition.type === 'BET') {
            // Determinar contributesToRewardValue según el nuevo valueType
            const contributesToRewardValue = newValueType === 'CALCULATED_FROM_CONDITIONS'
              ? (condition.conditions.contributesToRewardValue ?? false) // Preservar si existe
              : false; // Forzar a false si FIXED

            // Preservar campos comunes base
            const preservedBaseFields = {
              id: condition.id,
              description: condition.description,
              timeframe: condition.timeframe,
              dependsOnQualifyConditionId: condition.dependsOnQualifyConditionId,
              otherRestrictions: condition.otherRestrictions,
            };

            // Reconstruir condition con valores correctos
            const newCondition = buildDefaultQualifyCondition(
              condition.type,
              contributesToRewardValue
            );

            // Aplicar campos base preservados
            Object.assign(newCondition, preservedBaseFields);

            // Preservar campos específicos comunes según el tipo
            if (condition.type === 'DEPOSIT') {
              Object.assign(newCondition.conditions, {
                depositCode: condition.conditions.depositCode,
                firstDepositOnly: condition.conditions.firstDepositOnly,
              });
            }
            // BET: los campos de restricción son específicos del tipo calculated/fixed,
            // por lo que no se preservan (se reconstruyen desde defaults)

            // Actualizar la condition en el formulario
            setValue(
              `${conditionsPath}.${index}` as Path<T>,
              newCondition as PathValue<T, Path<T>>,
              { shouldValidate: true, shouldDirty: true }
            );
          }
        });
      }
    },
    [setValue, getValues, getPath]
  );

  const hasContributingCondition = useCallback((): boolean => {
    const conditionsPath = getPath("qualifyConditions") as Path<T>;
    const conditions = getValues(conditionsPath);

    if (!Array.isArray(conditions)) return false;

    // contributesToRewardValue ahora está dentro de conditions como discriminador
    return conditions.some((c: RewardQualifyConditionFormData) => {
      // Solo DEPOSIT y BET tienen contributesToRewardValue
      if (c.type === 'DEPOSIT' || c.type === 'BET') {
        return c.conditions.contributesToRewardValue === true;
      }
      return false;
    });
  }, [getPath, getValues]);

  return {
    control, // Devolvemos control por si el componente lo necesita para inputs genéricos
    rewardType,
    valueType,
    handleTypeChange,
    handleValueTypeChange,
    hasContributingCondition,
    getPath, // Exportamos helper para componentes
  };
}