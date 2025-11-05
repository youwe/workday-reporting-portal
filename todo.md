# Workday Reporting Portal - TODO

## Database & Schema
- [x] Database schema voor organisaties (UWI, SIMSEN)
- [x] Database schema voor financiële data uploads
- [x] Database schema voor rapportage configuraties
- [x] Database schema voor gebruikers en rollen (admin vs frontend gebruikers)

## Backend API
- [x] API endpoint voor CSV/Excel upload
- [ ] API endpoint voor data parsing en validatie
- [x] API endpoint voor rapportage generatie
- [x] API endpoint voor CSV export van rapportages
- [x] API endpoint voor organisatie beheer

## Admin Interface
- [x] Dashboard overzicht met upload statistieken
- [x] Upload interface voor Workday data (CSV/Excel)
- [ ] Data preview na upload
- [x] Organisatie selectie en beheer
- [x] Upload geschiedenis overzicht

## Rapportages - UWI (Services)
- [ ] Balans rapportage
- [ ] Winst- en verliesrekening
- [ ] Cashflow rapportage
- [ ] Gross Margin KPI
- [ ] EBITDA performance KPI

## Rapportages - SIMSEN (SaaS)
- [ ] Balans rapportage
- [ ] Winst- en verliesrekening
- [ ] Cashflow rapportage
- [ ] MRR (Monthly Recurring Revenue) KPI
- [ ] ARR (Annual Recurring Revenue) KPI
- [ ] Churn rate KPI
- [ ] CAC (Customer Acquisition Cost) KPI
- [ ] LTV (Lifetime Value) KPI
- [ ] LTV/CAC ratio KPI

## Frontend Interface (Externe Gebruikers)
- [x] Login pagina voor externe gebruikers
- [x] Dashboard met beschikbare rapportages
- [x] Rapportage viewer
- [x] CSV download functionaliteit
- [x] Organisatie filter voor rapportages

## Authenticatie & Autorisatie
- [x] Admin rol implementatie
- [x] Frontend gebruiker rol implementatie
- [x] Toegangscontrole voor admin functies
- [x] Toegangscontrole voor rapportages per organisatie

## Testing & Deployment
- [x] Test data generatie
- [x] Upload flow testen
- [x] Rapportage generatie testen
- [x] CSV export testen
- [x] Checkpoint voor deployment
