# Workday Reporting Portal

Een volledig portaal voor het uploaden van Workday financiële data en het genereren van rapportages voor **UWI (Services)** en **SIMSEN (SaaS)**.

## Overzicht

Dit portaal biedt twee hoofdfuncties:

1. **Admin Interface** - Voor beheerders om data te uploaden en rapportages te genereren
2. **Frontend Interface** - Voor externe gebruikers (aandeelhouders, banken) om rapportages te bekijken en downloaden

## Organisaties

Het systeem ondersteunt twee organisaties met verschillende rapportage-eisen:

### UWI (Services)
- **Type**: Services bedrijf
- **Focus**: Gross Margin en EBITDA performance
- **Rapportages**:
  - Balans
  - Winst- en Verliesrekening
  - Cashflow
  - Gross Margin KPI
  - EBITDA Performance KPI

### SIMSEN (SaaS)
- **Type**: SaaS bedrijf
- **Focus**: SaaS KPI's
- **Rapportages**:
  - Balans
  - Winst- en Verliesrekening
  - Cashflow
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - Churn Rate
  - CAC (Customer Acquisition Cost)
  - LTV (Lifetime Value)
  - LTV/CAC Ratio

## Functionaliteit

### Admin Interface (`/admin`)

**Dashboard** (`/admin`)
- Overzicht van uploads en rapportages
- Statistieken per organisatie

**Organisaties** (`/admin/organizations`)
- Beheer organisaties
- Voeg nieuwe organisaties toe

**Uploads** (`/admin/uploads`)
- Upload Workday data (CSV/Excel)
- Bekijk upload geschiedenis
- Status tracking per upload

**Rapportages** (`/admin/reports`)
- Overzicht van alle gegenereerde rapportages
- Download rapportages als CSV

**Genereer Rapportage** (`/admin/generate`)
- Genereer nieuwe rapportages op basis van geüploade data
- Selecteer organisatie, rapportage type en periode
- Automatische CSV generatie en opslag

### Frontend Interface (`/reports`)

**Rapportages Portal**
- Bekijk beschikbare rapportages per organisatie
- Filter op organisatie
- Download rapportages als CSV
- Alleen toegankelijk voor ingelogde gebruikers

## Authenticatie & Autorisatie

Het portaal gebruikt **Manus OAuth** voor authenticatie met twee gebruikersrollen:

### Admin Rol
- Volledige toegang tot admin interface
- Kan data uploaden
- Kan rapportages genereren
- Kan organisaties beheren

### User Rol (Frontend)
- Toegang tot rapportages portal
- Kan rapportages bekijken en downloaden
- Geen toegang tot admin functies

## Database Schema

### Organizations
- Organisatie informatie (naam, type, beschrijving)

### Data Uploads
- Upload metadata (bestandsnaam, status, record count)
- Gekoppeld aan organisatie en uploader

### Financial Data
- Geparste financiële data uit uploads
- Gestructureerd per periode, categorie en subcategorie

### Reports
- Gegenereerde rapportages
- Bevat link naar CSV bestand in S3

## Test Data

Het systeem bevat test data voor beide organisaties:

**UWI (2024-Q1)**
- 15 financiële records
- Balans, Winst & Verlies, KPI's

**SIMSEN (2024-Q1)**
- 20 financiële records
- Balans, Winst & Verlies, SaaS KPI's

## Gebruik

### Voor Admins

1. Log in met admin account
2. Ga naar **Organisaties** om UWI en SIMSEN te bekijken
3. Ga naar **Uploads** om Workday data te uploaden
4. Ga naar **Genereer Rapportage** om rapportages te maken
5. Bekijk gegenereerde rapportages in **Rapportages**

### Voor Externe Gebruikers

1. Log in met gebruikersaccount
2. Ga naar **Rapportages** (`/reports`)
3. Selecteer een organisatie (UWI of SIMSEN)
4. Bekijk beschikbare rapportages
5. Download rapportages als CSV

## Rapportage Formaten

Alle rapportages worden gegenereerd als **CSV bestanden** met de volgende structuur:

### Financiële Rapportages (Balans, W&V, Cashflow)
```csv
Categorie,Subcategorie,Bedrag (EUR),Periode
assets,current_assets,500000,2024-Q1
```

### KPI Rapportages
```csv
KPI,Waarde,Eenheid,Periode
gross_margin,52.94,%,2024-Q1
```

## Technische Details

- **Frontend**: React 19 + Tailwind CSS
- **Backend**: Express + tRPC
- **Database**: MySQL/TiDB
- **Storage**: S3 voor CSV bestanden
- **Authenticatie**: Manus OAuth

## Seeding Scripts

Twee scripts zijn beschikbaar voor het initialiseren van data:

```bash
# Seed organisaties (UWI en SIMSEN)
npx tsx scripts/seed-data.ts

# Seed test financiële data
npx tsx scripts/seed-test-data.ts
```

## Volgende Stappen

1. **Data Upload Parsing**: Implementeer CSV/Excel parsing voor echte Workday uploads
2. **Data Validatie**: Voeg validatie toe voor geüploade data
3. **Rapportage Templates**: Breid rapportage templates uit met meer details
4. **Email Notificaties**: Stuur notificaties naar stakeholders bij nieuwe rapportages
5. **Export Formaten**: Voeg PDF export toe naast CSV
