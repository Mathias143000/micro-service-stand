import { API_BASE_URL } from "./apiRequest";

const API_ORIGIN = new URL(API_BASE_URL).origin;

export default function resolveAssetUrl(value) {
  if (!value) {
    return value;
  }

  if (
    value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("data:")
    || value.startsWith("blob:")
  ) {
    try {
      const parsed = new URL(value);
      if (parsed.hostname === "example.com" || parsed.hostname.endsWith(".example.com")) {
        return "";
      }
    } catch {
      return "";
    }

    return value;
  }

  if (value.startsWith("/api/")) {
    return `${API_ORIGIN}${value}`;
  }

  return value;
}
