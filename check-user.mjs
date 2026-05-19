import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const target = await client.query(
  "SELECT id, email, phone, nickname, role, created_at FROM users WHERE email = $1 OR phone = $1",
  ["1779726113@qq.com"]
);
console.log("=== Target account (1779726113@qq.com) ===");
console.log(JSON.stringify(target.rows, null, 2));

const admins = await client.query(
  "SELECT id, email, phone, nickname, role FROM users WHERE role IN ('admin','moderator') ORDER BY created_at LIMIT 20"
);
console.log("\n=== All admins/moderators ===");
console.log(JSON.stringify(admins.rows, null, 2));

const total = await client.query("SELECT COUNT(*)::int AS n FROM users");
console.log("\n=== Total users ===", total.rows[0].n);

await client.end();
