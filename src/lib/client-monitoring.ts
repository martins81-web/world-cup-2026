"use client";

export async function captureClientError(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : "Unknown client error";
  const stack = error instanceof Error ? error.stack : undefined;
  try {
    await fetch("/api/monitoring/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, stack, path: window.location.pathname, ...context })
    });
  } catch {
    console.error("[client-monitoring]", message);
  }
}
