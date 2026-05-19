import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const targetEmail = "1779726113@qq.com";

const before = await client.query(
  "SELECT id, email, role FROM users WHERE email = $1",
  [targetEmail]
);

if (before.rows.length === 0) {
  console.log(`[skip] account ${targetEmail} does not exist yet — register it from the web first`);
  await client.end();
  process.exit(0);
}

console.log("=== Before ===");
console.log(JSON.stringify(before.rows, null, 2));

const updated = await client.query(
  "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role",
  [targetEmail]
);

console.log("\n=== After ===");
console.log(JSON.stringify(updated.rows, null, 2));

await client.end();
