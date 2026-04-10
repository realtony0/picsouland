import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, brand, price, image
      FROM products
      ORDER BY brand, name
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
