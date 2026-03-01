import { useCallback, useState } from "react";

import { getErrorMessage } from "@/utils/errors";

export function useApiErrorMessage() {
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const clearApiError = useCallback(() => {
    setApiErrorMessage(null);
  }, []);

  const setApiError = useCallback((error: unknown, fallbackMessage: string) => {
    setApiErrorMessage(getErrorMessage(error, fallbackMessage));
  }, []);

  return {
    apiErrorMessage,
    clearApiError,
    setApiError,
  };
}
