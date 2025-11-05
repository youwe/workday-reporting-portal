/**
 * Seed Postgres database with initial data
 */

import pg from 'pg';
const { Client } = pg;

const pgConfig = {
  host: 'ep-lingering-art-ag8zbrex-pooler.c-2.eu-central-1.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_0RxnAbqOcZ1N',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const client = new Client(pgConfig);
  await client.connect();
  console.log('✓ Connected to Postgres');

  try {
    // Insert development user
    await client.query(`
      INSERT INTO users (email, name, role)
      VALUES ('dev@workday-portal.local', 'Development User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✓ Created development user');

    // Insert organizations
    const orgs = [
      { name: 'Smart Nes Holding', code: 'SNH', type: 'holding', parentId: null, minorityInterest: 0 },
      { name: 'Outstrive', code: 'OUT', type: 'saas', parentId: null, minorityInterest: 0 },
      { name: 'Symson', code: 'SYM', type: 'saas', parentId: null, minorityInterest: 24 },
      { name: 'Youwe Holding', code: 'YWH', type: 'holding', parentId: null, minorityInterest: 0 },
      { name: 'Youwe Concept', code: 'YWC', type: 'services', parentId: null, minorityInterest: 30 },
      { name: 'Youwe Commerce', code: 'YWCOM', type: 'services', parentId: null, minorityInterest: 0 },
      { name: 'Youwe Digital', code: 'YWD', type: 'services', parentId: null, minorityInterest: 0 },
      { name: 'Youwe Data', code: 'YWDATA', type: 'services', parentId: null, minorityInterest: 0 },
      { name: 'Youwe Innovation', code: 'YWI', type: 'services', parentId: null, minorityInterest: 0 },
    ];

    for (const org of orgs) {
      await client.query(`
        INSERT INTO organizations (name, code, type, "parentId", "minorityInterest", active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (code) DO NOTHING
      `, [org.name, org.code, org.type, org.parentId, org.minorityInterest]);
    }
    console.log(`✓ Created ${orgs.length} organizations`);

    // Insert upload types
    const uploadTypes = [
      { name: 'Journal Lines', code: 'JOURNAL_LINES', description: 'General ledger journal entries', sortOrder: 1 },
      { name: 'Customer Invoices', code: 'CUSTOMER_INVOICES', description: 'Customer invoices and receivables', sortOrder: 2 },
      { name: 'Supplier Invoices', code: 'SUPPLIER_INVOICES', description: 'Supplier invoices and payables', sortOrder: 3 },
      { name: 'Customer Contracts', code: 'CUSTOMER_CONTRACTS', description: 'Customer contracts and recurring revenue', sortOrder: 4 },
      { name: 'Time Entries', code: 'TIME_ENTRIES', description: 'Employee time tracking and billable hours', sortOrder: 5 },
      { name: 'Supplier Payments', code: 'SUPPLIER_PAYMENTS', description: 'Payments made to suppliers', sortOrder: 6 },
      { name: 'Customer Payments', code: 'CUSTOMER_PAYMENTS', description: 'Payments received from customers', sortOrder: 7 },
      { name: 'Bank Statements', code: 'BANK_STATEMENTS', description: 'Bank account transactions', sortOrder: 8 },
      { name: 'HubSpot Deals', code: 'HUBSPOT_DEALS', description: 'Sales pipeline and deal data from HubSpot', sortOrder: 9 },
      { name: 'Billing Installments', code: 'BILLING_INSTALLMENTS', description: 'Scheduled billing and revenue recognition', sortOrder: 10 },
    ];

    for (const type of uploadTypes) {
      await client.query(`
        INSERT INTO "uploadTypes" (name, code, description, "sortOrder", active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (code) DO NOTHING
      `, [type.name, type.code, type.description, type.sortOrder]);
    }
    console.log(`✓ Created ${uploadTypes.length} upload types`);

    // Verify
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const orgCount = await client.query('SELECT COUNT(*) FROM organizations');
    const typeCount = await client.query('SELECT COUNT(*) FROM "uploadTypes"');

    console.log('\n✓ Seed complete!');
    console.log(`  Users: ${userCount.rows[0].count}`);
    console.log(`  Organizations: ${orgCount.rows[0].count}`);
    console.log(`  Upload Types: ${typeCount.rows[0].count}`);

  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
