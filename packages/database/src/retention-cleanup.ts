import process from "node:process";
import dotenv from "dotenv";
import { Client } from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // 1. telemetry: 30 天前的记录脱敏 IP/UA
    const mask30 = await client.query(`
      UPDATE telemetry_events
      SET ip_address = '***', user_agent = NULL
      WHERE occurred_at < NOW() - INTERVAL '30 days'
        AND ip_address IS NOT NULL
        AND ip_address != '***'
    `);
    console.log(`[retention] masked ${mask30.rowCount} telemetry rows (30d+ IP/UA)`);

    // 2. telemetry: 90 天前的明细删除（保留聚合统计即可）
    const del90 = await client.query(`
      DELETE FROM telemetry_events
      WHERE occurred_at < NOW() - INTERVAL '90 days'
    `);
    console.log(`[retention] deleted ${del90.rowCount} telemetry rows (90d+)`);

    // 3. 已删除用户的关联数据清理
    //    - prompts: author 改为 __deleted__（保留内容）
    //    - interactions: 软删除（删除记录）
    //    - auth_sessions: 物理删除
    const deletedUsers = await client.query<{ id: string }>(`
      SELECT id FROM users WHERE is_active = FALSE
    `);

    if (deletedUsers.rows.length > 0) {
      const ids = deletedUsers.rows.map((r) => r.id);

      const updatePrompts = await client.query(`
        UPDATE prompts
        SET author_id = (SELECT id FROM users WHERE nickname = '__system__' LIMIT 1)
        WHERE author_id = ANY($1)
          AND author_id != (SELECT id FROM users WHERE nickname = '__system__' LIMIT 1)
      `, [ids]);
      console.log(`[retention] reassigned ${updatePrompts.rowCount} prompts from deleted users`);

      const delInteractions = await client.query(`
        DELETE FROM interactions WHERE user_id = ANY($1)
      `, [ids]);
      console.log(`[retention] deleted ${delInteractions.rowCount} interactions from deleted users`);

      const delSessions = await client.query(`
        DELETE FROM auth_sessions WHERE user_id = ANY($1)
      `, [ids]);
      console.log(`[retention] deleted ${delSessions.rowCount} sessions from deleted users`);
    } else {
      console.log("[retention] no deleted users to clean up");
    }

    // 4. 过期 auth_sessions 清理（超过 30 天的已过期 session）
    const delExpired = await client.query(`
      DELETE FROM auth_sessions
      WHERE expires_at < NOW() - INTERVAL '30 days'
    `);
    console.log(`[retention] deleted ${delExpired.rowCount} expired sessions (30d+)`);

    console.log("[retention] done");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("[retention] failed:", error);
  process.exit(1);
});
