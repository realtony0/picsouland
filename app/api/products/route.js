import sql from "@/lib/db";
import { CATALOGUE_OUTAGE, CATALOGUE_OUTAGE_PAYLOAD } from "@/lib/catalogue-status";

export async function GET() {
  if (CATALOGUE_OUTAGE) {
    return Response.json(CATALOGUE_OUTAGE_PAYLOAD, { status: 503 });
  }

  try {
    let rows;
    try {
      rows = await sql`
        SELECT id, name, brand, price, image, in_stock
        FROM products
        ORDER BY brand, name
      `;
    } catch {
      rows = await sql`
        SELECT id, name, brand, price, image
        FROM products
        ORDER BY brand, name
      `;
      rows = rows.map((r) => ({ ...r, in_stock: true }));
    }

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
