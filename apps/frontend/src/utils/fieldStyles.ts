/**
 * Estilos CSS reutilizables para estados visuales de campos de formulario
 * Usado por componentes UI base (Input, Select, Textarea, etc.)
 */

/**
 * Estilos para estado WARNING (campo vacío + requerido ANTES de submit)
 * - Fondo amarillo suave
 * - Borde amarillo
 * - Focus ring amarillo
 */
export const VISUAL_STATE_WARNING_STYLES =
  "data-[visual-state=warning]:bg-warning/20 data-[visual-state=warning]:border-warning data-[visual-state=warning]:focus-visible:border-warning data-[visual-state=warning]:focus-visible:ring-warning/30";

/**
 * Estilos para contenedores de grupos (CheckboxGroup, RadioGroup)
 * cuando el grupo completo está en warning
 */
export const CONTAINER_WARNING_STYLES =
  "data-[visual-state=warning]:border-warning data-[visual-state=warning]:bg-warning/10 data-[visual-state=warning]:rounded-md data-[visual-state=warning]:p-3";
