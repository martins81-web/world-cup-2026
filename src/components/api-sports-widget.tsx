"use client";

import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    __apiSportsWidgetScript?: Promise<void>;
  }
}

type WidgetTheme = "light" | "dark";
type WidgetLang = "en" | "fr" | "pt" | "es";

type ApiSportsWidgetProps = {
  type: "live" | "games" | "game" | "standings" | "team" | "squad" | "player";
  league?: number;
  season?: number;
  fixture?: string | number | null;
  team?: string | number | null;
  player?: string | number | null;
  theme?: WidgetTheme;
  lang?: WidgetLang;
  title?: string;
  fallback: React.ReactNode;
};

export function ApiSportsWidget({
  type,
  league = 1,
  season = 2026,
  fixture,
  team,
  player,
  theme = "light",
  lang = "en",
  title,
  fallback
}: ApiSportsWidgetProps) {
  const key = process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_KEY;
  const host = process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_HOST ?? "https://widgets.api-sports.io";
  const [status, setStatus] = useState<"disabled" | "loading" | "ready" | "failed">(key ? "loading" : "disabled");
  const widgetId = useMemo(() => `api-sports-${type}-${league}-${season}-${fixture ?? team ?? player ?? "default"}`, [fixture, league, player, season, team, type]);

  useEffect(() => {
    if (!key) return;
    if (!window.__apiSportsWidgetScript) {
      window.__apiSportsWidgetScript = new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>("script[data-api-sports-widget]");
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `${host.replace(/\/$/, "")}/2.0.3/widgets.js`;
        script.async = true;
        script.defer = true;
        script.dataset.apiSportsWidget = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("API-Sports widget failed to load"));
        document.body.appendChild(script);
      });
    }

    window.__apiSportsWidgetScript.then(() => setStatus("ready")).catch(() => setStatus("failed"));
  }, [host, key]);

  if (!key || status === "disabled" || status === "failed") {
    return <div data-testid="widget-fallback">{fallback}</div>;
  }

  return (
    <section className="min-w-0 rounded-md border border-black/10 bg-white p-3 dark:bg-ink dark:text-white" aria-label={title ?? "API-Sports widget"}>
      {status === "loading" ? <div className="py-4 text-sm text-black/60">Loading...</div> : null}
      <div
        id={widgetId}
        className="min-h-24 w-full overflow-x-auto"
        data-host={host}
        data-key={key}
        data-widget={type}
        data-league={league}
        data-season={season}
        data-theme={theme}
        data-lang={lang}
        data-fixture={fixture ?? undefined}
        data-team={team ?? undefined}
        data-player={player ?? undefined}
      />
      <noscript>{fallback}</noscript>
    </section>
  );
}
