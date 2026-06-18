import Link from "next/link";

const navItems = [
  ["home", "/"],
  ["live", "/live"],
  ["matches", "/matches"],
  ["groups", "/groups"],
  ["third-place", "/third-place"],
  ["bracket", "/bracket"],
  ["teams", "/teams"],
  ["statistics", "/statistics"],
  ["admin", "/admin/sync"]
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm" aria-label="Main navigation">
        {navItems.map(([label, href]) => (
          <Link key={href} className="shrink-0 rounded px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70" href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
