# Vercel Deployment Instructies

## Status
✅ Code is gepushed naar GitHub  
✅ Postgres database is aangemaakt (Neon)  
✅ Database schema is aangemaakt  
✅ Seed data is toegevoegd  
⚠️ Environment variables moeten nog worden geconfigureerd in Vercel

---

## Stap 1: Environment Variables Toevoegen

Ga naar: **https://vercel.com/youwe/workday-reporting-portal/settings/environment-variables**

Voeg de volgende environment variables toe:

### DATABASE_URL
```
postgresql://neondb_owner:npg_0RxnAbqOcZ1N@ep-lingering-art-ag8zbrex-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### NODE_ENV
```
production
```

### JWT_SECRET
```
your-random-jwt-secret-here-change-this
```

### OAUTH_CLIENT_ID
```
dev-client
```

### OAUTH_CLIENT_SECRET
```
dev-secret
```

**Belangrijk**: Zorg dat alle variables voor **Production**, **Preview** en **Development** environments worden toegevoegd.

---

## Stap 2: Redeploy Triggeren

Na het toevoegen van de environment variables:

1. Ga naar: **https://vercel.com/youwe/workday-reporting-portal/deployments**
2. Klik op de laatste deployment
3. Klik op "Redeploy" (rechtsboven)
4. Of: push een nieuwe commit naar GitHub (automatische deployment)

---

## Stap 3: Applicatie Testen

Zodra de deployment compleet is, ga naar:
**https://workday-reporting-portal-2k5jfj6qg-youwe.vercel.app**

U zou nu automatisch ingelogd moeten zijn als "Development User".

---

## Database Status

✅ **Schema**: Volledig aangemaakt (17 tabellen)  
✅ **Seed Data**: 
- 1 development user
- 9 organizations (Smart Nes Holding, Outstrive, Symson, Youwe entities)
- 10 upload types

⚠️ **Data**: Database is leeg - u kunt nu CSV bestanden uploaden via de UI

---

## CSV Upload

Na deployment kunt u de volgende CSV bestanden uploaden via **Upload Data** pagina:

1. Journal Lines (77k+ records)
2. Customer Invoices (8.5k records)
3. Supplier Invoices (6.5k records)
4. Customer Contracts (794 records)
5. Time Entries (170k+ records)
6. Supplier Payments (4k records)
7. Customer Payments (4.2k records)
8. Bank Statements (15k records)
9. HubSpot Deals (4.7k records)
10. Billing Installments (7.2k records)

De applicatie zal automatisch:
- Entity detecteren uit company veld
- Period detecteren uit date velden
- Data opslaan in correcte tabellen
- Status tracking bijhouden

---

## Troubleshooting

### "Authentication Required" scherm
**Oplossing**: Environment variables zijn niet correct ingesteld. Controleer of alle variables zijn toegevoegd en redeploy.

### Database connection errors
**Oplossing**: Controleer of `DATABASE_URL` correct is en SSL mode bevat (`?sslmode=require`).

### Build errors
**Oplossing**: Check de build logs in Vercel dashboard. Mogelijk ontbreken dependencies.

---

## Production URL

**Huidige URL**: https://workday-reporting-portal-2k5jfj6qg-youwe.vercel.app

**Custom Domain**: U kunt een custom domain toevoegen via:
Vercel Dashboard → Settings → Domains

Bijvoorbeeld: `workday.youwe.nl`

---

## API Endpoints

Na deployment zijn de volgende API endpoints beschikbaar:

### Cashflow
- `GET /api/cashflow/summary` - Complete cashflow overview
- `GET /api/cashflow/forecast` - 12-month projection
- `GET /api/cashflow/paymentBehavior` - Customer payment analysis

### HubSpot
- `GET /api/hubspot/pipeline` - Complete pipeline analysis
- `GET /api/hubspot/mapAnalysis` - MAP effectiveness metrics
- `GET /api/hubspot/dealsByStage` - Stage breakdown

### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports/generate` - Generate new report

---

## Support

Voor vragen of problemen:
- GitHub: https://github.com/youwe/workday-reporting-portal
- Repository Issues: https://github.com/youwe/workday-reporting-portal/issues

---

## Volgende Stappen

Na succesvolle deployment:

1. ✅ Upload CSV bestanden via UI
2. ✅ Test dashboard functionaliteit
3. ✅ Genereer eerste reports
4. ✅ Configureer custom domain (optioneel)
5. ✅ Setup OAuth voor productie (optioneel)
6. ✅ Implementeer frontend widgets voor cashflow/HubSpot data
