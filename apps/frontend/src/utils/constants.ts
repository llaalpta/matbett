// =============================================
// UTILIDADES PARA CONSTANTES Y OPCIONES
// =============================================

import { z } from "zod";

/**
 * Convierte cualquier objeto constante clave-valor en opciones para formularios
 * @param constant - Objeto constante con estructura { CLAVE: "Valor mostrable" }
 * @returns Array de opciones con { value, label }
 */
export const getOptionsFromConstant = <T extends Record<string, string>>(
  constant: T
) => {
  return Object.entries(constant).map(([key, label]) => ({
    value: key,
    label: label
  }));
};

/**
 * Obtiene el label de una clave específica de una constante
 * @param constant - Objeto constante
 * @param key - Clave a buscar
 * @returns Label correspondiente o undefined
 */
export const getLabelFromConstant = <T extends Record<string, string>>(
  constant: T,
  key: string
): string | undefined => {
  return constant[key];
};

/**
 * Crea un schema Zod enum desde un objeto constante
 * @param obj - Objeto constante
 * @returns Schema Zod enum type-safe
 */
export const enumFromObject = <T extends Record<string, string>>(obj: T) => {
  const keys = Object.keys(obj) as [string, ...string[]];
  return z.enum(keys);
};

/**
 * Tipo para objetos constantes válidos
 */
export type ConstantObject = Record<string, string>;