import { synchronizeAllProviders } from "@/lib/sync/synchronization-service";

synchronizeAllProviders()
  .then((results) => {
    console.table(results);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
