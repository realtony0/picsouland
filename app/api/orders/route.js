import sql from "@/lib/db";

async function fetchAccount(phone, pin) {
  try {
    const rows = await sql`
      SELECT name, phone, points, total_earned,
             free_delivery_credits, free_puff_credits
      FROM accounts
      WHERE phone = ${phone} AND pin = ${pin}
    `;
    return rows[0] || null;
  } catch {
    const rows = await sql`
      SELECT name, phone, points, total_earned
      FROM accounts
      WHERE phone = ${phone} AND pin = ${pin}
    `;
    return rows[0] || null;
  }
}

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
      useFreeDelivery,
      useFreePuff,
      wheelDiscount,
    } = body;

    if (!items || !items.length) {
      return Response.json(
        { error: "La commande doit contenir au moins un article." },
        { status: 400 },
      );
    }

    let account = null;

    if (phone && pin) {
      account = await fetchAccount(phone, pin);
    }

    // Bons applicables seulement si le compte possede le credit.
    const freeDeliveryUsed = Boolean(
      account && useFreeDelivery && (account.free_delivery_credits || 0) > 0,
    );
    const freePuffUsed = Boolean(
      account && useFreePuff && (account.free_puff_credits || 0) > 0,
    );
    const wheelDiscountValue = Math.max(0, wheelDiscount || 0);

    let orderRows;
    try {
      orderRows = await sql`
        INSERT INTO orders (
          account_phone, items, subtotal, delivery_zone, delivery_price,
          reward_id, reward_discount, grand_total, points_earned, points_used,
          status, free_delivery_used, free_puff_used, wheel_discount
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
          ${pointsUsed || 0},
          'pending',
          ${freeDeliveryUsed},
          ${freePuffUsed},
          ${wheelDiscountValue}
        )
        RETURNING id, created_at, status, grand_total
      `;
    } catch {
      orderRows = await sql`
        INSERT INTO orders (
          account_phone, items, subtotal, delivery_zone, delivery_price,
          reward_id, reward_discount, grand_total, points_earned, points_used,
          status
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
          ${pointsUsed || 0},
          'pending'
        )
        RETURNING id, created_at, status, grand_total
      `;
    }

    // Mise a jour du compte : points depenses + bons consommes.
    if (account && (pointsUsed > 0 || freeDeliveryUsed || freePuffUsed)) {
      let updatedRows;
      try {
        updatedRows = await sql`
          UPDATE accounts
          SET
            points = GREATEST(0, points - ${pointsUsed || 0}),
            free_delivery_credits = GREATEST(0, free_delivery_credits - ${freeDeliveryUsed ? 1 : 0}),
            free_puff_credits = GREATEST(0, free_puff_credits - ${freePuffUsed ? 1 : 0})
          WHERE phone = ${account.phone}
          RETURNING name, phone, points, total_earned,
                    free_delivery_credits, free_puff_credits
        `;
      } catch {
        updatedRows = await sql`
          UPDATE accounts
          SET points = GREATEST(0, points - ${pointsUsed || 0})
          WHERE phone = ${account.phone}
          RETURNING name, phone, points, total_earned
        `;
      }

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
