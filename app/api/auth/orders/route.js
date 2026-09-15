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

    let rows;
    try {
      rows = await sql`
        SELECT o.id, o.items, o.subtotal, o.delivery_zone, o.delivery_price,
               o.reward_id, o.reward_discount, o.grand_total, o.points_earned,
               o.status, o.created_at,
               EXISTS(
                 SELECT 1 FROM wheel_spins ws WHERE ws.order_id = o.id
               ) AS wheel_spun
        FROM orders o
        WHERE o.account_phone = ${phone}
        ORDER BY o.created_at DESC
        LIMIT 50
      `;
    } catch {
      rows = await sql`
        SELECT id, items, subtotal, delivery_zone, delivery_price,
               reward_id, reward_discount, grand_total, points_earned,
               status, created_at
        FROM orders
        WHERE account_phone = ${phone}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    }

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
