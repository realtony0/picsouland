import sql from "@/lib/db";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";

export async function GET(request) {
  if (request.headers.get("x-admin-pin") !== ADMIN_PIN) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT
        o.id,
        o.account_phone,
        a.name AS account_name,
        o.items,
        o.subtotal,
        o.delivery_zone,
        o.delivery_price,
        o.reward_id,
        o.reward_discount,
        o.grand_total,
        o.points_earned,
        o.points_used,
        o.created_at
      FROM orders o
      LEFT JOIN accounts a ON a.phone = o.account_phone
      ORDER BY o.created_at DESC
      LIMIT 200
    `;

    return Response.json(rows);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
