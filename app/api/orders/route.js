import sql from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      phone,
      pin,
      items,
      subtotal,
      deliveryZone,
      deliveryPrice,
      rewardId,
      rewardDiscount,
      grandTotal,
      pointsEarned,
      pointsUsed,
    } = body;

    if (!items || !items.length) {
      return Response.json(
        { error: "La commande doit contenir au moins un article." },
        { status: 400 },
      );
    }

    let account = null;

    if (phone && pin) {
      const rows = await sql`
        SELECT name, phone, points, total_earned
        FROM accounts
        WHERE phone = ${phone} AND pin = ${pin}
      `;

      if (rows.length > 0) {
        account = rows[0];
      }
    }

    const orderRows = await sql`
      INSERT INTO orders (
        account_phone, items, subtotal, delivery_zone, delivery_price,
        reward_id, reward_discount, grand_total, points_earned, points_used
      )
      VALUES (
        ${account ? account.phone : null},
        ${JSON.stringify(items)},
        ${subtotal || 0},
        ${deliveryZone || null},
        ${deliveryPrice || 0},
        ${rewardId || null},
        ${rewardDiscount || 0},
        ${grandTotal || 0},
        ${pointsEarned || 0},
        ${pointsUsed || 0}
      )
      RETURNING id, created_at
    `;

    if (account && (pointsEarned || pointsUsed)) {
      const updatedRows = await sql`
        UPDATE accounts
        SET
          points = GREATEST(0, points + ${pointsEarned || 0} - ${pointsUsed || 0}),
          total_earned = total_earned + ${pointsEarned || 0}
        WHERE phone = ${account.phone}
        RETURNING name, phone, points, total_earned
      `;

      return Response.json({
        order: orderRows[0],
        account: updatedRows[0],
      });
    }

    return Response.json({ order: orderRows[0], account });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
