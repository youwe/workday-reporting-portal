# Workday Reporting Portal - Nieuwe Features

## ✅ Voltooid (Vorige Versie)
- [x] Basis project setup
- [x] Database schema (oude structuur)
- [x] Admin interface
- [x] Frontend rapportages pagina
- [x] CSV export functionaliteit

## 🔄 Te Updaten

### Organisatiestructuur
- [ ] Update database schema met correcte organisaties:
  - Smart Nes (parent: null, type: holding, reporting: consolidated)
  - Outstrive (parent: Smart Nes, type: holding, reporting: standalone)
  - Symson BV (parent: Outstrive, type: saas, reporting: standalone)
  - Youwe Holding BV (parent: Smart Nes, type: holding, reporting: consolidated)
- [ ] Voeg parent_id kolom toe aan organizations tabel
- [ ] Voeg reporting_type kolom toe (standalone/consolidated)
- [ ] Update seed data met correcte hiërarchie

### Upload Types & Data Model
- [ ] Voeg upload_types tabel toe met:
  - General Ledger / Journals
  - Customer Invoices (AR)
  - Supplier Invoices (AP)
  - Revenue Details
  - Employee/Payroll Data
  - Time Tracking Data
  - Subscription/Customer Data
- [ ] Voeg upload_type_id toe aan data_uploads tabel
- [ ] Maak upload_requirements tabel (welke uploads zijn verplicht per org type)
- [ ] Voeg data_mapping tabel toe voor field mapping

### Upload Wizard
- [ ] Maak multi-step upload wizard component
- [ ] Stap 1: Selecteer organisatie
- [ ] Stap 2: Selecteer upload type
- [ ] Stap 3: Upload bestand + field mapping
- [ ] Stap 4: Data preview & validatie
- [ ] Stap 5: Bevestiging & opslag
- [ ] Upload status dashboard (welke uploads ontbreken)

### KPI Berekeningen - Youwe
- [ ] Gross Margin % berekening
- [ ] EBITDA berekening  
- [ ] Revenue per FTE
- [ ] Billable Utilization %
- [ ] Average Hourly Rate
- [ ] Days Sales Outstanding (DSO)
- [ ] Operating Cash Flow
- [ ] KPI dashboard pagina voor Youwe

### KPI Berekeningen - Symson
- [ ] MRR (Monthly Recurring Revenue)
- [ ] ARR (Annual Recurring Revenue)
- [ ] Net Revenue Retention (NRR)
- [ ] Gross Revenue Retention (GRR)
- [ ] Customer Churn Rate
- [ ] Revenue Churn Rate
- [ ] CAC (Customer Acquisition Cost)
- [ ] LTV (Customer Lifetime Value)
- [ ] LTV/CAC Ratio
- [ ] Rule of 40
- [ ] ARPU (Average Revenue Per User)
- [ ] Months to Recover CAC
- [ ] KPI dashboard pagina voor Symson

### Docker Support
- [ ] Dockerfile (multi-stage build)
- [ ] docker-compose.yml (app + MySQL)
- [ ] .dockerignore
- [ ] .env.docker.example
- [ ] docker-start.sh script
- [ ] Update README met Docker instructies

### Documentatie
- [ ] Upload flow documentatie
- [ ] KPI berekeningen uitleg
- [ ] Workday export mapping guide
- [ ] Docker setup guide
- [ ] Gebruikershandleiding

### GitHub & Testing
- [ ] Push alle updates naar GitHub
- [ ] Test lokaal met Docker
- [ ] Maak checkpoint
