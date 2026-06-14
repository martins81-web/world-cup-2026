"use client";

import { useEffect } from "react";
import { captureClientError } from "@/lib/client-monitoring";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureClientError(error, { digest: error.digest });
  }, [error]);

  return <main className="mx-auto max-w-6xl px-6 py-10">Something went wrong while loading this page.</main>;
}
