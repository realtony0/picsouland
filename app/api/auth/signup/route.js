import sql from "@/lib/db";

const WELCOME_BONUS = 10;

export async function POST(request) {
  try {
    const { name, phone, pin } = await request.json();

    if (!name || !phone || !pin) {
      return Response.json(
        { error: "Nom, telephone et PIN requis." },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return Response.json(
        { error: "Le code PIN doit contenir exactement 4 chiffres." },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT phone FROM accounts WHERE phone = ${phone}
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Ce numero a deja un compte." },
        { status: 409 },
      );
    }

    const rows = await sql`
      INSERT INTO accounts (name, phone, pin, points, total_earned)
      VALUES (${name}, ${phone}, ${pin}, ${WELCOME_BONUS}, ${WELCOME_BONUS})
      RETURNING name, phone, points, total_earned
    `;

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
