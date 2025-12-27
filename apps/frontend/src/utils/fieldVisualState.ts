import type { FieldError } from "react-hook-form";

/**
 * Estados visuales posibles para un campo de formulario
 */
export type FieldVisualState = "default" | "warning" | "error";

/**
 * Calcula el estado visual de un campo basado en:
 * - Validación (error de Zod después de submit)
 * - Requerimiento (campo vacío + marcado como requerido)
 * - Estado del formulario (antes/después de submit)
 *
 * Estrategia híbrida:
 * - ANTES de submit: Campos vacíos requeridos → amarillo (warning)
 * - DESPUÉS de submit: Errores de validación → rojo (error)
 *
 * NO es un Hook - es una función pura sin dependencias de contexto
 * Puede ser llamada dentro de render props sin violar Rules of Hooks
 *
 * @param value - Valor actual del campo
 * @param required - Si el campo es requerido (prop manual)
 * @param error - Error de validación de React Hook Form
 * @param isSubmitted - Si el formulario ya fue enviado
 * @returns Estado visual: "default" | "warning" | "error"
 */
export function getFieldVisualState(
  value: any,
  required: boolean,
  error: FieldError | undefined,
  isSubmitted: boolean
): FieldVisualState {
  // Determinar si el campo está vacío
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  // 🔴 PRIORIDAD 1: Error de validación (después de submit)
  // Si Zod generó un error, mostrar estado error (rojo)
  if (error) {
    return "error";
  }

  // 🟨 PRIORIDAD 2: Campo vacío requerido ANTES de submit
  // Mostrar hint visual (amarillo) para guiar al usuario
  if (required && isEmpty && !isSubmitted) {
    return "warning";
  }

  // ⚪ PRIORIDAD 3: Estado normal
  // Campo lleno, no requerido, o después de submit sin errores
  return "default";
}
