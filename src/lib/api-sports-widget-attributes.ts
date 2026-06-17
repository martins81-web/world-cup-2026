export const API_SPORTS_WIDGET_SCRIPT_SRC = "https://widgets.api-sports.io/2.0.3/widgets.js";
export const API_SPORTS_WIDGET_SCRIPT_SELECTOR = "script[data-api-sports-widgets-v3]";

export function buildApiSportsDataAttributes(input: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => [`data-${toKebabCase(key)}`, String(value)])
  );
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
