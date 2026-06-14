"use client";

import { useEffect, useState } from "react";

export function LocalDateTime({ value, dateOnly = false }: { value: string | Date; dateOnly?: boolean }) {
  const [label, setLabel] = useState("Loading...");

  useEffect(() => {
    const date = new Date(value);
    setLabel(new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: dateOnly ? undefined : "short"
    }).format(date));
  }, [value, dateOnly]);

  return <time dateTime={new Date(value).toISOString()}>{label}</time>;
}
