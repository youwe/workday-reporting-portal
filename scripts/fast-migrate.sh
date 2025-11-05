#!/bin/bash

# Fast MySQL to Postgres migration using CSV export/import

MYSQL_USER="workday_user"
MYSQL_PASS="workday_pass"
MYSQL_DB="workday_reporting"

PGHOST="ep-lingering-art-ag8zbrex-pooler.c-2.eu-central-1.aws.neon.tech"
PGUSER="neondb_owner"
PGPASS="npg_0RxnAbqOcZ1N"
PGDB="neondb"

export PGPASSWORD="$PGPASS"

TABLES=("users" "organizations" "uploadTypes" "dataUploads" "journalLines" "customerInvoices" "supplierInvoices" "customerContracts" "timeEntries" "supplierPayments" "customerPayments" "bankStatements" "hubspotDeals" "billingInstallments")

echo "Starting fast migration..."

for table in "${TABLES[@]}"; do
  echo ""
  echo "Migrating $table..."
  
  # Export from MySQL to CSV
  mysql -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -e "SELECT * FROM $table" -B | sed 's/\t/,/g' > /tmp/${table}.csv
  
  # Get row count
  rows=$(wc -l < /tmp/${table}.csv)
  echo "Exported $rows rows"
  
  if [ $rows -gt 1 ]; then
    # Import to Postgres using COPY
    echo "Importing to Postgres..."
    psql -h $PGHOST -U $PGUSER -d $PGDB -c "\COPY \"$table\" FROM '/tmp/${table}.csv' WITH CSV HEADER" 2>&1 | grep -v "COPY"
    echo "✓ Migrated $table"
  else
    echo "Skipping $table (no data)"
  fi
done

echo ""
echo "Migration complete! Verifying..."

# Verify counts
for table in "${TABLES[@]}"; do
  count=$(psql -h $PGHOST -U $PGUSER -d $PGDB -t -c "SELECT COUNT(*) FROM \"$table\"")
  echo "$table: $count records"
done
