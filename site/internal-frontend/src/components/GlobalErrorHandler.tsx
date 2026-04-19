import { useEffect } from "react";
import { getErrorMessage } from "../api/error";
import { useToast } from "../context/ToastContext";

export default function GlobalErrorHandler() {
  const { showError } = useToast();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      showError(event.message || "Unexpected application error");
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      showError(getErrorMessage(event.reason));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [showError]);

  return null;
}
