import { drizzle } from "drizzle-orm/mysql2";
import { organizations } from "../drizzle/schema";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("Seeding organizations...");

  await db.insert(organizations).values([
    {
      name: "UWI",
      type: "services",
      description: "Services bedrijf dat stuurt op Gross Margin en EBITDA performance",
    },
    {
      name: "SIMSEN",
      type: "saas",
      description: "SaaS bedrijf met focus op SaaS KPI's zoals MRR, ARR, Churn, CAC en LTV",
    },
  ]);

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
