"use client";

import { useState } from "react";

export function SyncButton() {
  const [status, setStatus] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);

  async function runSync() {
    setIsSyncing(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST"
      });
      const body = await response.json();
      setStatus(response.ok ? JSON.stringify(body.results, null, 2) : body.error || "Sync failed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="max-w-xl rounded-md border border-black/10 bg-white p-4 shadow-sm">
      <button
        className="rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-50"
        type="button"
        onClick={runSync}
        disabled={isSyncing}
      >
        {isSyncing ? "Syncing..." : "Run sync"}
      </button>
      {status ? <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-black/5 p-3 text-xs">{status}</pre> : null}
    </div>
  );
}
