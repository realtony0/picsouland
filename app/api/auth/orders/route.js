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

    const account = await sql`
      SELECT phone FROM accounts WHERE phone = ${phone} AND pin = ${pin}
    `;

    if (account.length === 0) {
      return Response.json({ error: "Non autorise." }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, items, subtotal, delivery_zone, delivery_price,
             reward_id, reward_discount, grand_total, points_earned,
             status, created_at
      FROM orders
      WHERE account_phone = ${phone}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
