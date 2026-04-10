import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json(
        { error: "Telephone requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT name, phone, points, total_earned
      FROM accounts
      WHERE phone = ${phone}
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Compte introuvable." },
        { status: 404 },
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
