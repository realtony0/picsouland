import sql from "@/lib/db";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";

function checkAdmin(request) {
  return request.headers.get("x-admin-pin") === ADMIN_PIN;
}

export async function GET(request) {
  if (!checkAdmin(request)) {
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
        o.status,
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

export async function PATCH(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return Response.json(
        { error: "orderId requis." },
        { status: 400 },
      );
    }

    const orderRows = await sql`
      SELECT id, account_phone, points_earned, status
      FROM orders
      WHERE id = ${orderId}
    `;

    if (orderRows.length === 0) {
      return Response.json(
        { error: "Commande introuvable." },
        { status: 404 },
      );
    }

    const order = orderRows[0];

    if (order.status === "confirmed") {
      return Response.json(
        { error: "Commande deja confirmee." },
        { status: 400 },
      );
    }

    await sql`
      UPDATE orders SET status = 'confirmed' WHERE id = ${orderId}
    `;

    let updatedAccount = null;

    if (order.account_phone && order.points_earned > 0) {
      const accRows = await sql`
        UPDATE accounts
        SET
          points = points + ${order.points_earned},
          total_earned = total_earned + ${order.points_earned}
        WHERE phone = ${order.account_phone}
        RETURNING name, phone, points, total_earned
      `;

      if (accRows.length > 0) {
        updatedAccount = accRows[0];
      }
    }

    return Response.json({
      ok: true,
      order: { id: orderId, status: "confirmed" },
      account: updatedAccount,
    });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
