import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (!axios.isAxiosError(error)) {
      return error.message;
    }
  }

  if (!axios.isAxiosError(error)) {
    return "Unexpected error";
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const payload = data as Record<string, unknown>;
    if (typeof payload.message === "string") {
      return payload.message;
    }
    if (typeof payload.error === "string") {
      return payload.error;
    }
  }

  return error.message || "Request failed";
}
