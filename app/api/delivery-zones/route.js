import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, area, price
      FROM delivery_zones
      ORDER BY price ASC, sort_order ASC, id ASC
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
