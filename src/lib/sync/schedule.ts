const SYNC_TIME_ZONE = "America/Toronto";
const START_MINUTE = 12 * 60;
const END_MINUTE = 2 * 60;

export function isWithinMontrealResultSyncWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYNC_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const minuteOfDay = hour * 60 + minute;

  return minuteOfDay >= START_MINUTE || minuteOfDay < END_MINUTE;
}

export function montrealSyncWindowLabel() {
  return "12:00 PM to 2:00 AM Montreal time";
}
