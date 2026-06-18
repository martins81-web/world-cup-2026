"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { API_SPORTS_WIDGET_FALLBACK, isApiSportsWidgetAvailable, type ApiSportsWidgetTheme } from "@/lib/api-sports-widgets";
import { API_SPORTS_WIDGET_CLASS_NAME, API_SPORTS_WIDGET_SCRIPT_SELECTOR, API_SPORTS_WIDGET_SCRIPT_SRC, apiSportsWidgetElementId, buildApiSportsDataAttributes } from "@/lib/api-sports-widget-attributes";

declare global {
  interface Window {
    __apiSportsWidgetsScript?: Promise<void>;
    __apiSportsWidgetsInitTimer?: number;
  }
}

export type ApiSportsWidgetType = "leagues" | "games" | "game" | "standings" | "teams" | "team" | "player" | "players";

export type ApiSportsWidgetProps = {
  type: ApiSportsWidgetType;
  enabled: boolean;
  widgetKey: string;
  host: string;
  league?: string | number | null;
  season?: string | number | null;
  fixture?: string | number | null;
  team?: string | number | null;
  player?: string | number | null;
  theme?: ApiSportsWidgetTheme;
  lang?: string;
  title?: string;
  fallback?: React.ReactNode;
  attributes?: Record<string, string | number | boolean | null | undefined>;
};

const EMPTY_CHECK_DELAY_MS = 4500;

export function ApiSportsWidget({
  type,
  enabled,
  widgetKey,
  host,
  league,
  season,
  fixture,
  team,
  player,
  theme = "light",
  lang = "en",
  title = "API-Sports widget",
  fallback,
  attributes = {}
}: ApiSportsWidgetProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"disabled" | "loading" | "ready" | "empty" | "failed">(
    isApiSportsWidgetAvailable({ enabled, widgetKey }) ? "loading" : "disabled"
  );
  const widgetId = useMemo(() => apiSportsWidgetElementId(type, reactId.replace(/:/g, "")), [reactId, type]);

  useEffect(() => {
    if (!isApiSportsWidgetAvailable({ enabled, widgetKey })) {
      setStatus("disabled");
      return;
    }

    let cancelled = false;
    loadApiSportsWidgetScript()
      .then(() => {
        if (!cancelled) {
          scheduleApiSportsWidgetInitialization();
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    const emptyTimer = window.setTimeout(() => {
      const widget = containerRef.current;
      if (!cancelled && widget && widget.childElementCount === 0 && widget.textContent?.trim().length === 0) {
        setStatus((current) => current === "failed" ? current : "empty");
      }
    }, EMPTY_CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(emptyTimer);
    };
  }, [enabled, widgetKey]);

  if (status === "disabled" || status === "failed") {
    return <WidgetFallback title={title} fallback={fallback} />;
  }

  const dataAttributes = buildApiSportsDataAttributes({
    host,
    key: widgetKey,
    widget: type,
    league,
    season,
    fixture,
    team,
    player,
    theme,
    lang,
    ...attributes
  });

  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-black/10 bg-white p-3" aria-label={title} data-testid="api-sports-widget">
      <h2 className="text-lg font-semibold">{title}</h2>
      {status === "loading" ? <p className="mt-2 text-sm text-black/60">Loading live widget...</p> : null}
      {status === "empty" ? <p className="mt-2 text-sm text-black/60">{fallback ?? API_SPORTS_WIDGET_FALLBACK}</p> : null}
      <div
        id={widgetId}
        ref={containerRef}
        className={`${API_SPORTS_WIDGET_CLASS_NAME} mt-3 min-h-24 max-w-full overflow-x-auto`}
        {...dataAttributes}
      />
      <noscript>{fallback ?? API_SPORTS_WIDGET_FALLBACK}</noscript>
    </section>
  );
}

function WidgetFallback({ title, fallback }: { title: string; fallback?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-md border border-black/10 bg-white p-3" aria-label={title} data-testid="widget-fallback">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-black/60">{fallback ?? API_SPORTS_WIDGET_FALLBACK}</p>
    </section>
  );
}

function loadApiSportsWidgetScript() {
  if (window.__apiSportsWidgetsScript) return window.__apiSportsWidgetsScript;

  window.__apiSportsWidgetsScript = loadApiSportsWidgetScriptWithRetry();
  return window.__apiSportsWidgetsScript;
}

async function loadApiSportsWidgetScriptWithRetry() {
  const maxAttempts = 3;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await injectApiSportsWidgetScript(attempt);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API-Sports widget script failed");
      document.querySelector<HTMLScriptElement>(API_SPORTS_WIDGET_SCRIPT_SELECTOR)?.remove();
      if (attempt < maxAttempts) {
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 2000));
      }
    }
  }
  window.__apiSportsWidgetsScript = undefined;
  throw lastError ?? new Error("API-Sports widget script failed");
}

function injectApiSportsWidgetScript(attempt: number) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(API_SPORTS_WIDGET_SCRIPT_SELECTOR);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("API-Sports widget script failed")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `${API_SPORTS_WIDGET_SCRIPT_SRC}?attempt=${attempt}`;
    script.type = "module";
    script.async = true;
    script.defer = true;
    script.dataset.apiSportsWidgetsV3 = "true";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("API-Sports widget script failed"));
    document.body.appendChild(script);
  });
}

function scheduleApiSportsWidgetInitialization() {
  if (window.__apiSportsWidgetsInitTimer) {
    window.clearTimeout(window.__apiSportsWidgetsInitTimer);
  }
  window.__apiSportsWidgetsInitTimer = window.setTimeout(() => {
    window.dispatchEvent(new Event("DOMContentLoaded"));
    window.__apiSportsWidgetsInitTimer = undefined;
  }, 0);
}
