export function notAvailable(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not available" : String(value);
}

export function scoreLine(home?: number | null, away?: number | null) {
  if (home === null || home === undefined || away === null || away === undefined) return "Not available";
  return `${home}-${away}`;
}
