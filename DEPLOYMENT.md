# Workday Reporting Portal - Deployment Instructies

## Status

✅ **Database**: 263,423 records geïmporteerd  
✅ **Code**: Alle wijzigingen gecommit naar GitHub  
✅ **Docker**: Klaar voor deployment

## Geïmporteerde Data

| Type | Records |
|------|---------|
| Journal Lines | 77,436 |
| Customer Invoices | 8,528 |
| Supplier Invoices | 6,581 |
| Customer Contracts | 794 |
| Time Entries | 170,084 |
| **Totaal** | **263,423** |

## Docker Deployment

### Optie 1: Met bestaande database

```bash
# Clone repository
git clone https://github.com/youwe/workday-reporting-portal.git
cd workday-reporting-portal

# Importeer database dump
mysql -u workday_user -pworkday_pass workday_reporting < database-export.sql

# Start applicatie
docker-compose up -d

# Applicatie is beschikbaar op http://localhost:3000
```

### Optie 2: Verse installatie

```bash
# Clone repository
git clone https://github.com/youwe/workday-reporting-portal.git
cd workday-reporting-portal

# Start Docker services
docker-compose up -d

# Wacht tot database klaar is
sleep 30

# Voer migraties uit
docker-compose exec app pnpm db:migrate

# Run seed script
docker-compose exec app npx tsx scripts/seed-complete.ts

# Importeer CSV bestanden
# Plaats CSV bestanden in /home/ubuntu/upload/
docker-compose exec app npx tsx scripts/import-all-csv.ts
```

## Lokale Development

```bash
# Installeer dependencies
pnpm install

# Start MySQL
sudo service mysql start

# Maak database aan
mysql -u root -p < init-complete-schema.sql

# Run seed data
npx tsx scripts/seed-complete.ts

# Start development server
pnpm dev

# Applicatie is beschikbaar op http://localhost:3000
```

## Environment Variables

Maak een `.env` bestand aan:

```env
# Database
DATABASE_URL=mysql://workday_user:workday_pass@localhost:3306/workday_reporting
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=workday_reporting
MYSQL_USER=workday_user
MYSQL_PASSWORD=workday_pass

# Server
NODE_ENV=production
PORT=3000

# OAuth (optioneel voor productie)
VITE_OAUTH_PORTAL_URL=https://your-oauth-provider.com
VITE_APP_ID=your-app-id

# AI Keys (optioneel)
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
XAI_API_KEY=your-key
```

## Database Export

De volledige database met alle geïmporteerde data is beschikbaar:

```bash
# Export (43MB)
/home/ubuntu/workday-reporting-portal/database-export.sql

# Importeer
mysql -u workday_user -pworkday_pass workday_reporting < database-export.sql
```

## Verificatie

Na deployment, controleer:

1. **Database connectie**: `docker-compose logs app | grep "Database"`
2. **Server status**: `curl http://localhost:3000/`
3. **Data counts**: 
   ```sql
   SELECT 'journalLines', COUNT(*) FROM journalLines
   UNION ALL SELECT 'customerInvoices', COUNT(*) FROM customerInvoices
   UNION ALL SELECT 'supplierInvoices', COUNT(*) FROM supplierInvoices
   UNION ALL SELECT 'customerContracts', COUNT(*) FROM customerContracts
   UNION ALL SELECT 'timeEntries', COUNT(*) FROM timeEntries;
   ```

## Features

### Werkend
- ✅ Database met alle tabellen
- ✅ 263k+ records geïmporteerd
- ✅ Development auth bypass
- ✅ CSV import scripts
- ✅ Upload interface
- ✅ Dashboard UI
- ✅ Reports UI
- ✅ Analytics UI

### Nog Te Implementeren
- ⚠️ Report generatie logica
- ⚠️ Dashboard met echte data visualisatie
- ⚠️ Intercompany elimination
- ⚠️ KPI calculations met echte data
- ⚠️ Admin interface

## Troubleshooting

### Database connectie errors
```bash
# Check MySQL status
docker-compose ps db

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Server start errors
```bash
# Check logs
docker-compose logs app

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port conflicts
```bash
# Check welke poorten in gebruik zijn
netstat -tlnp | grep 3000

# Gebruik andere port
APP_PORT=3001 docker-compose up -d
```

## Support

Voor vragen of problemen:
- GitHub Issues: https://github.com/youwe/workday-reporting-portal/issues
- Repository: https://github.com/youwe/workday-reporting-portal
