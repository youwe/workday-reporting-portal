import { parseCSV, mapCSVRow } from '../server/utils/csvParser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script to validate CSV parsing and mapping
 */

const CSV_FILES = [
  { path: '/home/ubuntu/upload/Journal-Lines.csv', type: 'journal_lines' },
  { path: '/home/ubuntu/upload/Customer-Invoices.csv', type: 'customer_invoices' },
  { path: '/home/ubuntu/upload/Supplier-Invoices.csv', type: 'supplier_invoices' },
  { path: '/home/ubuntu/upload/Customer-Contracts.csv', type: 'customer_contracts' },
  { path: '/home/ubuntu/upload/All-Time-Entries.csv', type: 'time_entries' },
];

async function testCSVParsing() {
  console.log('🧪 Testing CSV Parsing and Mapping\n');

  for (const file of CSV_FILES) {
    console.log(`\n📄 Testing: ${path.basename(file.path)}`);
    console.log(`   Type: ${file.type}`);

    try {
      // Check if file exists
      if (!fs.existsSync(file.path)) {
        console.log(`   ❌ File not found: ${file.path}`);
        continue;
      }

      // Read and parse CSV
      const content = fs.readFileSync(file.path, 'utf-8');
      const rows = parseCSV(content);

      console.log(`   ✅ Parsed ${rows.length} rows`);

      if (rows.length > 0) {
        // Show headers
        const headers = Object.keys(rows[0]);
        console.log(`   📋 Headers (${headers.length}):`, headers.slice(0, 5).join(', '), '...');

        // Test mapping first row
        const mapped = mapCSVRow(rows[0], file.type);
        console.log(`   🔄 Mapped fields:`, Object.keys(mapped).join(', '));

        // Show sample mapped data
        const sampleKeys = Object.keys(mapped).slice(0, 3);
        sampleKeys.forEach(key => {
          console.log(`      ${key}: ${mapped[key]}`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testCSVParsing().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
