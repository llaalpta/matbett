import { useCallback } from "react";

import { useAppToast } from "@/components/feedback/ToastProvider";

export function useApiSuccessToast() {
  const { showToast } = useAppToast();

  const notifySuccess = useCallback(
    (message: string, title = "Operacion completada") => {
      showToast({
        title,
        description: message,
        variant: "success",
      });
    },
    [showToast]
  );

  return {
    notifySuccess,
  };
}
