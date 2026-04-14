import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, color, sort_order
      FROM categories
      ORDER BY sort_order, name
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
