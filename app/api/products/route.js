import sql from "@/lib/db";
import { DATABASE_OUTAGE, databaseOutageResponse } from "@/lib/db-status";

export async function GET() {
  if (DATABASE_OUTAGE) {
    return databaseOutageResponse();
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
