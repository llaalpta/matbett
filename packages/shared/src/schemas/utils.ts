/**
 * Utilidades para schemas Zod
 */

import { z } from 'zod';

/**
 * Campo numérico requerido que permite undefined en el formulario
 * pero falla validación si está vacío al submit.
 *
 * - Input type: `number | undefined` (permite campos vacíos en el form)
 * - Output type: `number` (después de validar, garantiza que es número)
 *
 * Uso:
 *   value: requiredNumber(0),                      // min 0, mensaje default
 *   stake: requiredNumber(0, "Stake obligatorio"), // min 0, mensaje custom
 *
 * @param min - Valor mínimo permitido (default: sin mínimo)
 * @param message - Mensaje de error personalizado
 */
export const requiredNumber = (
  min?: number,
  message = "Este campo es obligatorio"
) => {
  let schema = z.number();

  if (min !== undefined) {
    schema = schema.min(min);
  }

  return schema
    .optional()
    .refine((val) => val !== undefined, { message })
    .transform((val) => val as number);
};
