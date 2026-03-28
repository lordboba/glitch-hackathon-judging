import { ensureBootstrapData } from "@/lib/server/bootstrap";

async function main() {
  await ensureBootstrapData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
