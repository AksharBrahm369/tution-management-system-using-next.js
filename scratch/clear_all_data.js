const pg = require("pg");
const { Client } = pg;
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to DB.");

  try {
    // 1. Fetch all table names in public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);

    const allTables = res.rows.map(row => row.table_name);
    console.log("Found tables:", allTables);

    // Filter out tables we want to preserve
    const excludeTables = ["_prisma_migrations", "institutes", "users"];
    const tablesToTruncate = allTables.filter(table => !excludeTables.includes(table));

    console.log("Tables to truncate:", tablesToTruncate);

    await client.query("BEGIN");

    // 2. Truncate each table cascade
    for (const table of tablesToTruncate) {
      console.log(`Truncating table: "${table}"`);
      await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
    }

    // 3. Delete non-admin users to keep system access working
    console.log("Deleting non-SUPER_ADMIN users...");
    const deleteUsersRes = await client.query(`
      DELETE FROM "users" 
      WHERE "role" != 'SUPER_ADMIN'
    `);
    console.log(`Deleted ${deleteUsersRes.rowCount} users.`);

    await client.query("COMMIT");
    console.log("Successfully cleared all data from database while preserving admin account & institute registration.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to clear database:", error);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

main().catch(console.error);
