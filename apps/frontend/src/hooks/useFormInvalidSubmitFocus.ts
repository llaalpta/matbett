import { useCallback, useRef } from "react";

export function useFormInvalidSubmitFocus() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const validationBannerRef = useRef<HTMLDivElement | null>(null);

  const focusFirstInvalidField = useCallback(() => {
    const formElement = formRef.current;
    const firstInvalidField = formElement?.querySelector<HTMLElement>(
      "[aria-invalid='true']"
    );

    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidField.focus({ preventScroll: true });
      return;
    }

    const validationBanner = validationBannerRef.current;

    if (validationBanner) {
      validationBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      validationBanner.focus({ preventScroll: true });
      return;
    }

    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    formRef,
    validationBannerRef,
    focusFirstInvalidField,
  };
}
