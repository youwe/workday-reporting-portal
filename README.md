# Workday Financial Intelligence Platform

A modern financial reporting and analytics platform for processing Workday exports with consolidation, intercompany elimination, and AI-powered insights.

## Features

### 📊 Financial Reporting
- **Multi-entity consolidation** with automatic intercompany eliminations
- **Minority interest calculations** (Symson 76%, Youwe Concept 70%)
- **Hierarchical organization structure** (Smart Nes → Outstrive/Youwe Holding)
- **Standard financial reports**: P&L, Balance Sheet, Cash Flow

### 📈 KPI Dashboards
**Professional Services (Youwe):**
- Gross Margin %, EBITDA, Revenue per FTE
- Billable Utilization %, Average Hourly Rate
- Days Sales Outstanding (DSO), Operating Cash Flow

**SaaS (Symson):**
- MRR, ARR, Net/Gross Revenue Retention
- Customer Churn Rate, CAC, LTV, LTV/CAC Ratio
- Rule of 40, ARPU, Months to Recover CAC

### 📥 Workday Data Import
Supports 11 export types:
1. Journal Lines (General Ledger)
2. Customer Invoices
3. Supplier Invoices
4. Customer Contracts
5. Time Entries
6. Bank Statements
7. Customer Payments
8. Supplier Payments
9. Billing Installments
10. Tax Declarations
11. HubSpot Deals

### 🎨 Modern UI
- Glassmorphism design with smooth animations
- Dark/Light mode support
- Interactive charts and visualizations
- Drag & drop file uploads
- Real-time progress indicators

### 🤖 AI Assistant
- Natural language queries on financial data
- Automated insights and anomaly detection
- Executive summary generation
- Suggested questions based on context
- Powered by Claude 3.5 Sonnet (Anthropic)
- Real-time chat interface with markdown support

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose v2+

### 1. Clone Repository
```bash
git clone https://github.com/youwe/workday-reporting-portal.git
cd workday-reporting-portal
```

### 2. Configure Environment
Create `.env` file:
```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=workday_reporting
MYSQL_USER=workday_user
MYSQL_PASSWORD=your_secure_password
MYSQL_PORT=3306

# Application Configuration
APP_PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here

# AI API Keys (Optional)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
XAI_API_KEY=your_xai_key
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Access Application
Open http://localhost:3000

### 5. View Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f db
```

### 6. Stop Services
```bash
docker-compose down
```

### 7. Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

## Local Development (without Docker)

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL 8.0+

### Setup
```bash
# Install dependencies
pnpm install

# Configure database
# Update DATABASE_URL in .env

# Run migrations
pnpm db:push

# Seed data
npx tsx scripts/seed-complete.ts

# Start dev server
pnpm dev
```

## Organization Structure

```
Smart Nes Holding B.V. (Consolidated)
├── Outstrive B.V. (Standalone)
│   └── Symson B.V. (Standalone, 76% owned)
└── Youwe Holding B.V. (Consolidated)
    ├── Youwe Concept B.V. (70% owned)
    ├── Youwe Commerce B.V.
    ├── Youwe Digital B.V.
    ├── Youwe Hosting B.V.
    └── Youwe UK Ltd.
```

## Consolidation Logic

### Reporting Levels
1. **Smart Nes (Consolidated)**: All entities minus intercompany eliminations
2. **Youwe Holding (Consolidated)**: All Youwe entities minus intercompany eliminations
3. **Outstrive (Standalone)**: Outstrive only
4. **Symson BV (Standalone)**: Symson only

### Intercompany Elimination
- Transactions between group entities are automatically identified
- Eliminated at appropriate consolidation level
- Preserved at individual entity level

### Minority Interest
- **Symson B.V.**: 24% minority interest (76% owned)
- **Youwe Concept B.V.**: 30% minority interest (70% owned)

## Upload Workflow

1. **Select Period**: Choose reporting period (e.g., 2024-Q1)
2. **Upload Files**: Drag & drop or browse for Workday CSV exports
3. **Validation**: Automatic field mapping and data validation
4. **Processing**: Parse data and detect intercompany transactions
5. **Consolidation**: Apply eliminations and calculate minority interests
6. **KPI Calculation**: Compute all relevant KPIs
7. **Reports**: Generate and export financial reports

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Express 4, tRPC 11
- **Database**: MySQL 8.0, Drizzle ORM
- **Charts**: Recharts
- **AI**: Claude API (Anthropic)
- **Deployment**: Docker, Docker Compose

## Project Structure

```
├── client/              # Frontend React app
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components
│   │   └── lib/        # Utilities and tRPC client
├── server/              # Backend Express + tRPC
│   ├── _core/          # Core framework (OAuth, context)
│   ├── db.ts           # Database query helpers
│   └── routers.ts      # tRPC API routes
├── drizzle/             # Database schema and migrations
├── scripts/             # Utility scripts (seed data, etc.)
├── shared/              # Shared types and constants
└── docker-compose.yml   # Docker orchestration
```

## API Documentation

### tRPC Endpoints

**Organizations**
- `organizations.list` - Get all organizations
- `organizations.getHierarchy` - Get organization tree

**Uploads**
- `uploads.create` - Create new upload
- `uploads.list` - List uploads by period
- `uploads.getStatus` - Get upload processing status

**Reports**
- `reports.generate` - Generate financial report
- `reports.export` - Export report as CSV
- `reports.list` - List available reports

**KPIs**
- `kpis.calculate` - Calculate KPIs for period
- `kpis.get` - Get KPI data
- `kpis.compare` - Compare KPIs across periods

## Troubleshooting

### Database Connection Issues
```bash
# Check database is running
docker-compose ps

# Restart database
docker-compose restart db

# View database logs
docker-compose logs db
```

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Rebuild containers
docker-compose up -d --build
```

### Port Already in Use
```bash
# Change ports in .env
APP_PORT=3001
MYSQL_PORT=3307

# Restart services
docker-compose down && docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Proprietary - Youwe/Smart Nes

## Support

For issues and questions:
- GitHub Issues: https://github.com/youwe/workday-reporting-portal/issues
- Email: support@youwe.nl
