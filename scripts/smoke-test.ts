const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function check(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  console.info(`ok ${path}`);
}

async function main() {
  await check("/");
  await check("/matches");
  await check("/teams");
  await check("/api/health");
  await check("/api/matches");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
