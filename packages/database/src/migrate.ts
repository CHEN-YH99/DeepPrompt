import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client } from "pg";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootEnvPath = path.resolve(currentDir, "../../../.env");
const schemaPath = path.resolve(currentDir, "schema.sql");
const seedPath = path.resolve(currentDir, "seed.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");
const seedSql = fs.readFileSync(seedPath, "utf8");

dotenv.config({ path: rootEnvPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query("COMMIT");
    console.log("[database] migration + seed complete");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("[database] migration failed", error);
  process.exit(1);
});
