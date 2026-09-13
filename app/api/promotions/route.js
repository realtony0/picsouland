import sql from "@/lib/db";
import { CATALOGUE_OUTAGE, CATALOGUE_OUTAGE_PAYLOAD } from "@/lib/catalogue-status";

export async function GET() {
  if (CATALOGUE_OUTAGE) {
    return Response.json(CATALOGUE_OUTAGE_PAYLOAD, { status: 503 });
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
