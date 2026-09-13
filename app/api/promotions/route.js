import sql from "@/lib/db";
import { DATABASE_OUTAGE, databaseOutageResponse } from "@/lib/db-status";

export async function GET() {
  if (DATABASE_OUTAGE) {
    return databaseOutageResponse();
  }

  try {
    const rows = await sql`
      SELECT id, label, discount_percent, brand_filter, product_filter, starts_at, ends_at
      FROM promotions
      WHERE starts_at <= now() AND ends_at > now()
      ORDER BY created_at DESC
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
