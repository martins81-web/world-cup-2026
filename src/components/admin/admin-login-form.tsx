"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (response.ok) window.location.href = "/admin/sync";
    else setMessage((await response.json()).error ?? "Unauthorized");
  }

  return (
    <form className="rounded-md border bg-white p-5 shadow-sm" onSubmit={submit}>
      <label className="block text-sm font-medium" htmlFor="username">Username</label>
      <input id="username" className="mt-2 w-full rounded border px-3 py-2" value={username} onChange={(event) => setUsername(event.target.value)} />
      <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
      <input id="password" className="mt-2 w-full rounded border px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <button className="mt-5 rounded bg-ink px-4 py-2 font-medium text-white" type="submit">Sign in</button>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
    </form>
  );
}
