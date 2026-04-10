import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return Response.json(
        { error: "Telephone et PIN requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT name, phone, points, total_earned
      FROM accounts
      WHERE phone = ${phone} AND pin = ${pin}
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Numero ou code PIN incorrect." },
        { status: 401 },
      );
    }

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
