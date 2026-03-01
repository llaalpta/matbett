export function getCompactStatusLabel(status?: string | null, fallbackLabel?: string) {
  if (!status) {
    return fallbackLabel ?? "Sin estado";
  }

  switch (status) {
    case "NOT_STARTED":
      return "No iniciada";
    case "PENDING":
      return "Pendiente";
    case "QUALIFYING":
      return "Calificando";
    case "FULFILLED":
      return "Cumplida";
    case "FAILED":
      return "Fallida";
    case "EXPIRED":
      return "Caducada";
    case "ACTIVE":
      return "Activa";
    case "COMPLETED":
      return "Completada";
    case "RECEIVED":
      return "Recibida";
    case "IN_USE":
      return "En uso";
    case "PENDING_TO_CLAIM":
      return "A reclamar";
    case "CLAIMED":
      return "Reclamada";
    case "USED":
      return "Usada";
    case "WON":
      return "Ganada";
    case "LOST":
      return "Perdida";
    case "VOID":
      return "Nula";
    case "OPEN":
      return "Abierta";
    case "CASHOUT":
      return "Cashout";
    default:
      return fallbackLabel ?? status;
  }
}
