"use client";

import { useState } from "react";

export function ConflictActions({ issueId, conflictId }: { issueId?: string; conflictId?: string }) {
  const [status, setStatus] = useState("");

  async function post(body: object) {
    const response = await fetch("/api/admin/conflicts/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    setStatus(response.ok ? "Saved" : "Failed");
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {issueId ? <button className="rounded border px-3 py-2" onClick={() => post({ kind: "mapping", issueId, action: "ignore" })} type="button">Ignore</button> : null}
      {conflictId ? <>
        <button className="rounded border px-3 py-2" onClick={() => post({ kind: "conflict", conflictId, action: "keep-local" })} type="button">Keep local</button>
        <button className="rounded bg-ink px-3 py-2 text-white" onClick={() => post({ kind: "conflict", conflictId, action: "accept-provider" })} type="button">Accept provider</button>
      </> : null}
      {status ? <span aria-live="polite">{status}</span> : null}
    </div>
  );
}
