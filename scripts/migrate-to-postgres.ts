/**
 * Migrate data from MySQL to Postgres
 */

import mysql from 'mysql2/promise';
import pg from 'pg';
const { Client } = pg;

const mysqlConfig = {
  host: 'localhost',
  user: 'workday_user',
  password: 'workday_pass',
  database: 'workday_reporting',
};

const pgConfig = {
  host: 'ep-lingering-art-ag8zbrex-pooler.c-2.eu-central-1.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_0RxnAbqOcZ1N',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
};

async function migrateTable(
  mysqlConn: mysql.Connection,
  pgClient: pg.Client,
  tableName: string,
  batchSize: number = 1000
) {
  console.log(`\nMigrating ${tableName}...`);
  
  // Get total count
  const [countRows] = await mysqlConn.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
  const totalCount = (countRows as any)[0].count;
  console.log(`Total records: ${totalCount}`);
  
  if (totalCount === 0) {
    console.log(`Skipping ${tableName} (no data)`);
    return;
  }
  
  // Get column names
  const [columns] = await mysqlConn.execute(`SHOW COLUMNS FROM ${tableName}`);
  const columnNames = (columns as any[]).map(col => col.Field);
  
  // Migrate in batches
  let offset = 0;
  let migrated = 0;
  
  while (offset < totalCount) {
    const [rows] = await mysqlConn.execute(
      `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`
    );
    
    const data = rows as any[];
    
    if (data.length === 0) break;
    
    // Build INSERT statement
    for (const row of data) {
      const values = columnNames.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });
      
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO "${tableName}" (${columnNames.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      try {
        await pgClient.query(query, values);
        migrated++;
      } catch (error: any) {
        console.error(`Error inserting into ${tableName}:`, error.message);
      }
    }
    
    offset += batchSize;
    console.log(`Progress: ${migrated}/${totalCount} (${Math.round((migrated/totalCount)*100)}%)`);
  }
  
  console.log(`✓ Migrated ${migrated} records from ${tableName}`);
}

async function main() {
  console.log('Starting migration from MySQL to Postgres...\n');
  
  // Connect to MySQL
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  console.log('✓ Connected to MySQL');
  
  // Connect to Postgres
  const pgClient = new Client(pgConfig);
  await pgClient.connect();
  console.log('✓ Connected to Postgres\n');
  
  try {
    // Migrate tables in order (respecting foreign keys)
    await migrateTable(mysqlConn, pgClient, 'users');
    await migrateTable(mysqlConn, pgClient, 'organizations');
    await migrateTable(mysqlConn, pgClient, 'uploadTypes');
    await migrateTable(mysqlConn, pgClient, 'dataUploads');
    
    // Migrate data tables
    await migrateTable(mysqlConn, pgClient, 'journalLines', 5000);
    await migrateTable(mysqlConn, pgClient, 'customerInvoices', 5000);
    await migrateTable(mysqlConn, pgClient, 'supplierInvoices', 5000);
    await migrateTable(mysqlConn, pgClient, 'customerContracts', 5000);
    await migrateTable(mysqlConn, pgClient, 'timeEntries', 10000);
    await migrateTable(mysqlConn, pgClient, 'supplierPayments', 5000);
    await migrateTable(mysqlConn, pgClient, 'customerPayments', 5000);
    await migrateTable(mysqlConn, pgClient, 'bankStatements', 5000);
    await migrateTable(mysqlConn, pgClient, 'hubspotDeals', 5000);
    await migrateTable(mysqlConn, pgClient, 'billingInstallments', 5000);
    
    console.log('\n✓ Migration completed successfully!');
    
    // Verify counts
    console.log('\nVerifying data...');
    const tables = [
      'journalLines', 'customerInvoices', 'supplierInvoices', 
      'customerContracts', 'timeEntries', 'supplierPayments',
      'customerPayments', 'bankStatements', 'hubspotDeals', 'billingInstallments'
    ];
    
    for (const table of tables) {
      const result = await pgClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`${table}: ${result.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mysqlConn.end();
    await pgClient.end();
    console.log('\n✓ Connections closed');
  }
}

main().catch(console.error);
