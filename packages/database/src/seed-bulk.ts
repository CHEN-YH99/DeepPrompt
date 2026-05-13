import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client } from "pg";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootEnvPath = path.resolve(currentDir, "../../../.env");
const featuredSeedPath = path.resolve(currentDir, "seed-prompts.sql");
const bulkSeedPath = path.resolve(currentDir, "seed-prompts-bulk.sql");

dotenv.config({ path: rootEnvPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run bulk seed.");
}

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    if (fs.existsSync(featuredSeedPath)) {
      await client.query(fs.readFileSync(featuredSeedPath, "utf8"));
    }
    await client.query(fs.readFileSync(bulkSeedPath, "utf8"));
    await client.query("COMMIT");
    console.log("[database] bulk seed complete (featured + 512 cold-start prompts)");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("[database] bulk seed failed", error);
  process.exit(1);
});
