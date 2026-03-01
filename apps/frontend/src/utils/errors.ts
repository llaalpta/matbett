const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeTechnicalMessage = (message: string): string => {
  const normalized = message.replace(/\r/g, "").trim();

  if (
    normalized.includes("No 'User' record") &&
    normalized.includes("PromotionToUser")
  ) {
    return "No existe el usuario de desarrollo en la base de datos. Ejecuta el seed y vuelve a intentarlo.";
  }

  if (normalized.includes("The column `(not available)` does not exist")) {
    return "La base de datos no está sincronizada con el esquema actual.";
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const meaningfulLine = lines.find(
    (line) => !line.startsWith("Invalid `") && !line.startsWith("at ")
  );

  return meaningfulLine ?? normalized;
};

const extractMessage = (error: unknown): string | null => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return sanitizeTechnicalMessage(error.message);
  }

  if (!isRecord(error)) {
    return null;
  }

  const message = error.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return sanitizeTechnicalMessage(message);
  }

  const data = error.data;
  if (isRecord(data)) {
    const dataMessage = data.message;
    if (typeof dataMessage === "string" && dataMessage.trim().length > 0) {
      return sanitizeTechnicalMessage(dataMessage);
    }
  }

  return null;
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = "Ha ocurrido un error inesperado."
): string => {
  return extractMessage(error) ?? fallbackMessage;
};
