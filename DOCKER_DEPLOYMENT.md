# Docker Deployment Instructies

## 🐳 Lokaal Draaien met Docker

De Workday Reporting Portal kan volledig lokaal draaien met Docker en Docker Compose. Alles is voorgeïnstalleerd: PostgreSQL database, applicatie server, en automatische database initialisatie.

---

## ⚡ Snelle Start (3 minuten)

### Vereisten

- **Docker Desktop** geïnstalleerd ([Download](https://www.docker.com/products/docker-desktop))
- **Git** geïnstalleerd

### Stap 1: Clone Repository

```bash
git clone https://github.com/youwe/workday-reporting-portal.git
cd workday-reporting-portal
```

### Stap 2: Environment Variables (Optioneel)

Kopieer de template en pas aan indien gewenst:

```bash
cp .env.docker .env
```

**Standaard configuratie werkt direct!** Pas alleen aan als u specifieke instellingen wilt.

### Stap 3: Start Applicatie

```bash
docker-compose up -d
```

**Dat is alles!** 🎉

De applicatie is nu beschikbaar op: **http://localhost:3000**

---

## 📊 Wat Wordt Gestart?

### Services

**1. PostgreSQL Database** (`workday-db`)
- Port: `5432`
- Database: `workday_reporting`
- User: `workday_user`
- Password: `workday_pass`
- Volume: Persistent data opslag

**2. Web Application** (`workday-app`)
- Port: `3000`
- Node.js Express server
- Automatisch verbonden met database
- Health checks ingebouwd

### Automatische Setup

Bij eerste start:
1. ✅ PostgreSQL database wordt aangemaakt
2. ✅ Database schema wordt geïnitialiseerd (17 tabellen)
3. ✅ Applicatie start en verbindt met database
4. ✅ Development user wordt aangemaakt

---

## 🔧 Handige Commando's

### Applicatie Beheer

```bash
# Start applicatie
docker-compose up -d

# Stop applicatie
docker-compose down

# Herstart applicatie
docker-compose restart

# Bekijk logs (real-time)
docker-compose logs -f

# Bekijk logs van specifieke service
docker-compose logs -f app
docker-compose logs -f db

# Status controleren
docker-compose ps
```

### Database Beheer

```bash
# Seed data toevoegen (organizations, upload types)
docker-compose exec app npx tsx scripts/seed-postgres.ts

# Database backup maken
docker-compose exec db pg_dump -U workday_user workday_reporting > backup.sql

# Database restore
docker-compose exec -T db psql -U workday_user workday_reporting < backup.sql

# Direct database toegang
docker-compose exec db psql -U workday_user -d workday_reporting
```

### Applicatie Shell

```bash
# Shell in applicatie container
docker-compose exec app sh

# CSV bestanden importeren (vanuit container)
docker-compose exec app npx tsx scripts/import-all-csv.ts
```

### Cleanup

```bash
# Stop en verwijder containers (data blijft behouden)
docker-compose down

# Stop en verwijder alles inclusief volumes (WAARSCHUWING: data wordt gewist!)
docker-compose down -v

# Rebuild applicatie (na code wijzigingen)
docker-compose up -d --build
```

---

## 📁 Data Persistentie

### Volumes

Docker Compose maakt automatisch volumes aan voor data opslag:

**postgres_data**: Database bestanden (persistent)
- Locatie: Docker volume
- Data blijft behouden na `docker-compose down`

**app_data**: Applicatie data
- Locatie: Docker volume
- Logs, cache, etc.

**uploads**: CSV uploads
- Locatie: `./uploads` (lokale directory)
- Direct toegankelijk op host machine

### Data Wissen

```bash
# Verwijder alleen containers (data blijft)
docker-compose down

# Verwijder alles inclusief data
docker-compose down -v
```

---

## 🌐 Toegang tot Applicatie

### Web Interface

**URL**: http://localhost:3000

**Login**: Automatisch ingelogd als "Development User"

### Database

**Host**: `localhost`  
**Port**: `5432`  
**Database**: `workday_reporting`  
**User**: `workday_user`  
**Password**: `workday_pass`

**Connection String**:
```
postgresql://workday_user:workday_pass@localhost:5432/workday_reporting
```

**Tools**:
- pgAdmin
- DBeaver
- DataGrip
- psql CLI

---

## 📤 CSV Data Uploaden

### Via Web Interface

1. Ga naar http://localhost:3000
2. Klik op **"Upload Data"**
3. Selecteer upload type
4. Upload CSV bestand
5. Data wordt automatisch verwerkt

### Via Script (Bulk Import)

```bash
# Plaats CSV bestanden in ./uploads directory
cp /path/to/your/*.csv ./uploads/

# Run import script
docker-compose exec app npx tsx scripts/import-all-csv.ts
```

---

## 🔍 Monitoring & Debugging

### Health Checks

Docker voert automatisch health checks uit:

**Database**: Elke 10 seconden
**Applicatie**: Elke 30 seconden

Status bekijken:
```bash
docker-compose ps
```

Healthy services tonen: `Up (healthy)`

### Logs

**Real-time logs**:
```bash
docker-compose logs -f
```

**Laatste 100 regels**:
```bash
docker-compose logs --tail=100
```

**Specifieke service**:
```bash
docker-compose logs -f app
```

### Debug Mode

Start met verbose logging:

```bash
# Stop huidige containers
docker-compose down

# Start met debug output
docker-compose up
```

(Zonder `-d` flag voor foreground mode)

---

## ⚙️ Configuratie Aanpassen

### Environment Variables

Bewerk `.env` bestand:

```bash
# Database
POSTGRES_USER=custom_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=my_database
POSTGRES_PORT=5432

# Application
APP_PORT=8080
NODE_ENV=production
JWT_SECRET=your-secret-key

# OAuth
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
```

**Herstart** na wijzigingen:
```bash
docker-compose down
docker-compose up -d
```

### Poorten Wijzigen

Bewerk `docker-compose.yml` of `.env`:

```yaml
# Applicatie op port 8080
APP_PORT=8080

# Database op port 5433
POSTGRES_PORT=5433
```

---

## 🚀 Productie Deployment

### Docker Compose in Productie

```bash
# Build voor productie
docker-compose -f docker-compose.yml build

# Start in productie mode
NODE_ENV=production docker-compose up -d

# Met custom environment file
docker-compose --env-file .env.production up -d
```

### Docker Image Publiceren

```bash
# Build image
docker build -t youwe/workday-reporting-portal:latest .

# Tag voor registry
docker tag youwe/workday-reporting-portal:latest registry.youwe.nl/workday-reporting-portal:latest

# Push naar registry
docker push registry.youwe.nl/workday-reporting-portal:latest
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Probleem**: `Error: port 3000 already in use`

**Oplossing**:
```bash
# Wijzig port in .env
APP_PORT=3001

# Of stop conflicterende service
lsof -ti:3000 | xargs kill
```

### Database Connection Failed

**Probleem**: `Connection refused` of `ECONNREFUSED`

**Oplossing**:
```bash
# Check database status
docker-compose ps

# Bekijk database logs
docker-compose logs db

# Herstart database
docker-compose restart db

# Wacht tot healthy
docker-compose ps
```

### Build Errors

**Probleem**: Build fails met dependency errors

**Oplossing**:
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory

**Probleem**: Container crashes met OOM

**Oplossing**: Verhoog Docker memory limit in Docker Desktop settings (minimum 4GB aanbevolen)

### Permission Denied

**Probleem**: Cannot write to uploads directory

**Oplossing**:
```bash
# Fix permissions
chmod 777 ./uploads

# Or recreate directory
rm -rf ./uploads
mkdir ./uploads
chmod 777 ./uploads
```

---

## 📋 Checklist Na Deployment

- [ ] Containers draaien: `docker-compose ps`
- [ ] Database is healthy
- [ ] Applicatie is healthy
- [ ] Web interface toegankelijk: http://localhost:3000
- [ ] Login werkt (Development User)
- [ ] Seed data toegevoegd: `docker-compose exec app npx tsx scripts/seed-postgres.ts`
- [ ] Dashboard laadt
- [ ] Upload Data pagina werkt
- [ ] Test CSV upload succesvol

**Alles groen? 🎉 Docker deployment succesvol!**

---

## 🔗 Nuttige Links

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL Docker**: https://hub.docker.com/_/postgres
- **GitHub Repository**: https://github.com/youwe/workday-reporting-portal

---

## 💡 Tips

1. **Development**: Run zonder `-d` voor direct log output
2. **Backup**: Maak regelmatig database backups
3. **Updates**: Pull latest code en rebuild: `git pull && docker-compose up -d --build`
4. **Resources**: Monitor Docker Desktop dashboard voor resource gebruik
5. **Cleanup**: Run `docker system prune` periodiek om disk space vrij te maken
