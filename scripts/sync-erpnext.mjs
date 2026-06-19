import { syncCache } from './erpnext-bridge.mjs';

async function main() {
  const payload = await syncCache();
  console.log(`Synced ${payload.projects.length} projects and ${payload.tasks.length} tasks to src/generated/erpnext-cache.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
