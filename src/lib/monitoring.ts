import { env } from "@/lib/env";
import { logApp } from "@/lib/logger";

export async function captureException(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : "Unknown error";
  await logApp("error", "monitoring", message, context as never);
  if (env.ERROR_TRACKING_DSN) {
    console.error("[error-tracking]", { dsnConfigured: true, message, context });
  }
}

export async function sendSyncFailureAlert(payload: Record<string, unknown>) {
  if (!env.SYNC_ALERT_WEBHOOK_URL) return;
  try {
    await fetch(env.SYNC_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    await logApp("error", "alerts", "Failed to send sync failure alert", { message: error instanceof Error ? error.message : "Unknown error" });
  }
}
