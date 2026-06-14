export function DevelopmentNotice({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Development data is active. Live provider data has not replaced this seed dataset yet.
    </div>
  );
}
