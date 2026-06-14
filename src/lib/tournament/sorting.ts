export type SortableMatch = {
  matchNumber?: number | null;
  kickoffAt: Date;
};

export function sortMatchesByNumberAndChronology<T extends SortableMatch>(matches: T[]) {
  return [...matches].sort((a, b) => {
    const numberA = a.matchNumber ?? Number.MAX_SAFE_INTEGER;
    const numberB = b.matchNumber ?? Number.MAX_SAFE_INTEGER;
    return numberA - numberB || a.kickoffAt.getTime() - b.kickoffAt.getTime();
  });
}

export function sortMatchesChronologically<T extends SortableMatch>(matches: T[]) {
  return [...matches].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
}
