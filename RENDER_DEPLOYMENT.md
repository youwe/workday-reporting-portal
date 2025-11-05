# Render Deployment Instructies

## ✅ Voorbereiding Compleet

De applicatie is volledig voorbereid voor deployment op Render met:
- ✅ `render.yaml` configuratie
- ✅ Build en start scripts
- ✅ Postgres database support
- ✅ Environment variables configuratie

---

## 🚀 Deployment Stappen

### Stap 1: Nieuwe Web Service Aanmaken

1. Ga naar **Render Dashboard**: https://dashboard.render.com/
2. Klik op **"New +"** (rechtsboven)
3. Selecteer **"Web Service"**

### Stap 2: Repository Koppelen

1. Klik op **"Connect a repository"**
2. Als GitHub nog niet gekoppeld is:
   - Klik **"Connect GitHub"**
   - Authoriseer Render
3. Zoek en selecteer: **`youwe/workday-reporting-portal`**
4. Klik **"Connect"**

### Stap 3: Service Configureren

Render detecteert automatisch de `render.yaml` configuratie. Verifieer de instellingen:

**Name**: `workday-reporting-portal`  
**Region**: `Frankfurt (EU Central)`  
**Branch**: `master`  
**Runtime**: `Node`  
**Build Command**: `pnpm install && pnpm build`  
**Start Command**: `pnpm start`  

### Stap 4: Database Aanmaken

**Optie A: Via render.yaml (Aanbevolen)**
1. Render zal automatisch de database aanmaken zoals gedefinieerd in `render.yaml`
2. De `DATABASE_URL` wordt automatisch gekoppeld

**Optie B: Handmatig**
1. Ga terug naar Dashboard
2. Klik **"New +"** → **"PostgreSQL"**
3. Configureer:
   - **Name**: `workday-db`
   - **Database**: `workday_reporting`
   - **User**: `workday_user`
   - **Region**: `Frankfurt (EU Central)`
   - **Plan**: `Free`
4. Klik **"Create Database"**
5. Kopieer de **External Database URL**
6. Ga terug naar de Web Service → **Environment**
7. Voeg toe: `DATABASE_URL` = [gekopieerde URL]

### Stap 5: Deploy Starten

1. Scroll naar beneden
2. Klik **"Create Web Service"**
3. Render start automatisch de build en deployment

**Build duurt ongeveer 3-5 minuten**

---

## 📊 Database Schema Aanmaken

Na de eerste deployment moet u het database schema aanmaken:

### Via Render Shell

1. Ga naar uw Web Service in Render Dashboard
2. Klik op **"Shell"** tab (rechtsboven)
3. Voer uit:

```bash
# Seed database met schema en initial data
npx tsx scripts/seed-postgres.ts
```

### Via Lokale PostgreSQL Client

Als u de External Database URL heeft:

```bash
psql [DATABASE_URL] < postgres-schema.sql
psql [DATABASE_URL] -c "INSERT INTO users (email, name, role) VALUES ('admin@youwe.nl', 'Admin User', 'admin');"
```

---

## 🌐 Applicatie URL

Na succesvolle deployment:

**Render URL**: `https://workday-reporting-portal.onrender.com`

**Custom Domain** (optioneel):
1. Ga naar Service → **Settings** → **Custom Domain**
2. Voeg toe: `workday.youwe.nl`
3. Configureer DNS volgens Render instructies

---

## 🔧 Environment Variables

De volgende environment variables zijn automatisch geconfigureerd via `render.yaml`:

- ✅ `NODE_ENV=production`
- ✅ `DATABASE_URL` (van database)
- ✅ `JWT_SECRET` (auto-generated)
- ✅ `OAUTH_CLIENT_ID=dev-client`
- ✅ `OAUTH_CLIENT_SECRET=dev-secret`

**Extra variables toevoegen** (optioneel):
1. Ga naar Service → **Environment**
2. Klik **"Add Environment Variable"**
3. Voeg toe en klik **"Save Changes"**

---

## 📤 CSV Data Uploaden

Na deployment kunt u CSV bestanden uploaden via de UI:

1. Ga naar **Upload Data** pagina
2. Selecteer upload type (bijv. "Journal Lines")
3. Upload CSV bestand
4. Applicatie verwerkt automatisch:
   - Entity detectie
   - Period detectie
   - Data opslag
   - Status tracking

**Beschikbare Upload Types**:
- Journal Lines
- Customer Invoices
- Supplier Invoices
- Customer Contracts
- Time Entries
- Supplier Payments
- Customer Payments
- Bank Statements
- HubSpot Deals
- Billing Installments

---

## 🔍 Monitoring & Logs

**Logs bekijken**:
1. Ga naar Service in Dashboard
2. Klik op **"Logs"** tab
3. Real-time logs van applicatie

**Metrics**:
1. Klik op **"Metrics"** tab
2. CPU, Memory, Request metrics

**Health Checks**:
- Render monitoreert automatisch: `https://[your-app].onrender.com/`
- Als app niet reageert, wordt deze automatisch herstart

---

## ⚡ Auto-Deploy

Render is nu gekoppeld aan GitHub:

**Bij elke push naar `master`**:
1. Render detecteert wijziging
2. Start automatisch nieuwe build
3. Deploy nieuwe versie
4. Zero-downtime deployment

**Manual Deploy**:
1. Ga naar Service → **Manual Deploy**
2. Klik **"Deploy latest commit"**

---

## 🆓 Free Tier Beperkingen

**Web Service (Free)**:
- ✅ 750 uur/maand (voldoende voor 24/7)
- ✅ Automatisch suspend na 15 min inactiviteit
- ✅ Wake-up bij eerste request (kan 30-60 sec duren)
- ✅ 512 MB RAM
- ✅ Shared CPU

**PostgreSQL (Free)**:
- ✅ 1 GB storage
- ✅ 90 dagen data retention
- ✅ Automatische backups
- ⚠️ Expires na 90 dagen (upgrade naar paid voor permanent)

**Tip**: Voor production gebruik, upgrade naar **Starter plan** ($7/maand) voor:
- Geen auto-suspend
- Snellere response
- Meer resources

---

## 🐛 Troubleshooting

### Build Fails

**Probleem**: `pnpm: command not found`  
**Oplossing**: Render ondersteunt pnpm. Check `package.json` heeft `packageManager` field.

**Probleem**: Dependencies error  
**Oplossing**: Run `pnpm install` lokaal en commit `pnpm-lock.yaml`

### Database Connection Error

**Probleem**: `Connection refused`  
**Oplossing**: 
1. Check `DATABASE_URL` is correct ingesteld
2. Verifieer database is running in Render Dashboard
3. Check SSL mode: `?sslmode=require`

### Application Not Loading

**Probleem**: 502 Bad Gateway  
**Oplossing**:
1. Check logs voor errors
2. Verifieer `pnpm start` command werkt
3. Check port binding (Render gebruikt `PORT` env var)

### Schema Not Created

**Probleem**: Tables don't exist  
**Oplossing**: Run seed script via Shell:
```bash
npx tsx scripts/seed-postgres.ts
```

---

## 📞 Support

**Render Documentation**: https://render.com/docs  
**GitHub Repository**: https://github.com/youwe/workday-reporting-portal  
**Render Community**: https://community.render.com/

---

## ✅ Checklist

Na deployment, verifieer:

- [ ] Web Service is deployed en running
- [ ] Database is aangemaakt en connected
- [ ] Schema is aangemaakt (via seed script)
- [ ] Applicatie is toegankelijk via URL
- [ ] Login werkt (Development User)
- [ ] Dashboard laadt correct
- [ ] Upload Data pagina werkt
- [ ] CSV upload test succesvol
- [ ] API endpoints reageren

**Alles groen? 🎉 Deployment succesvol!**
