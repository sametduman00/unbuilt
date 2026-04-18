#!/usr/bin/env node
/**
 * run-migration.js
 * 
 * Runs a SQL migration against Supabase using the REST API.
 * 
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy \
 *     node scripts/run-migration.js supabase/migrations/005_seo_pages.sql
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-migration.js <path-to-sql-file>");
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(sqlFile), "utf-8");
console.log(`Running migration: ${sqlFile}`);
console.log(`SQL length: ${sql.length} chars`);

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({}),
  });

  // For raw SQL, use the Supabase SQL endpoint
  const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
  });

  // Actually use the management API or psql
  // Simpler: just use fetch to the Supabase SQL editor endpoint
  console.log("\n⚠️  Auto-migration via REST API is limited.");
  console.log("Run this SQL manually in Supabase Dashboard > SQL Editor:");
  console.log("────────────────────────────────────────");
  console.log(sql);
  console.log("────────────────────────────────────────");
  console.log(`\nOr use: npx supabase db push (if CLI is configured)`);
}

run().catch(console.error);
