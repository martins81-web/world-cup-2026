export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.ERROR_TRACKING_DSN) {
    console.info("[monitoring] error tracking configured");
  }
}
