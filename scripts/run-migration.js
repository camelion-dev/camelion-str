/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS one-off script, run directly with `node`, not part of the app build */

// One-off script to apply supabase/orders.sql directly against the
// Supabase Postgres database. Reads DATABASE_URL from .env.local.
//
// Uses DATABASE_URL (the Session/Transaction pooler, IPv4-compatible)
// rather than DIRECT_URL, because Supabase's direct connection
// (db.<ref>.supabase.co) is IPv6-only, and most sandboxed/CI/AI-tool
// environments have no IPv6 route -- that's what caused the earlier
// "getaddrinfo ENOTFOUND" error.

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadConnectionStringFromEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const contents = fs.readFileSync(envPath, "utf8");
  const match = contents.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  if (!match) throw new Error("Could not find DATABASE_URL in .env.local");
  const value = match[1];
  const placeholderMarkers = ["your-project-ref", "your-password", "aws-0-region", "db.qdgfjqzvmtwrkdqfzjel.supabase.co"];
  const foundPlaceholder = placeholderMarkers.find((marker) => value.includes(marker));
  if (foundPlaceholder) {
    throw new Error(
      `DATABASE_URL in .env.local still contains the placeholder text "${foundPlaceholder}". ` +
      "Get the real 'Session pooler' connection string from Supabase " +
      "(Dashboard -> Connect -> Session mode) and put the FULL real string in DATABASE_URL before running this."
    );
  }
  return value;
}

async function main() {
  const connectionString = loadConnectionStringFromEnvLocal();
  const sqlPath = path.join(__dirname, "..", "supabase", "orders.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  console.log("Connecting to Supabase (via pooler)...");
  await client.connect();

  try {
    console.log("Running supabase/orders.sql...");
    await client.query(sql);
    console.log("Success! Order, OrderItem, OrderStatusHistory tables and the place_order() function are now set up.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
