"use client";

export const formatEventDateSummary = (
  eventDate?: Date | string | null
): string =>
  eventDate
    ? new Date(eventDate).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin fecha";
