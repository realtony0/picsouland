import sql from "@/lib/db";

async function getSettings() {
  const rows = await sql`SELECT enabled, min_amount FROM wheel_settings WHERE id = 1`;
  if (rows.length === 0) {
    return { enabled: true, min_amount: 8000 };
  }
  return rows[0];
}

// Config publique : lots actifs (sans les poids) + reglages.
export async function GET() {
  try {
    const settings = await getSettings();

    const prizes = await sql`
      SELECT id, label, type, value
      FROM wheel_prizes
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;

    return Response.json({
      enabled: settings.enabled,
      minAmount: settings.min_amount,
      prizes,
    });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}

// Tourner la roue : le resultat est decide cote serveur.
export async function POST(request) {
  try {
    const { phone, pin, orderId } = await request.json();

    if (!phone || !pin || !orderId) {
      return Response.json(
        { error: "Informations manquantes." },
        { status: 400 },
      );
    }

    const accountRows = await sql`
      SELECT name, phone, points, total_earned, free_delivery_credits, free_puff_credits
      FROM accounts
      WHERE phone = ${phone} AND pin = ${pin}
    `;

    if (accountRows.length === 0) {
      return Response.json({ error: "Compte introuvable." }, { status: 401 });
    }

    const account = accountRows[0];
    const settings = await getSettings();

    if (!settings.enabled) {
      return Response.json({ error: "La roue est desactivee." }, { status: 403 });
    }

    const orderRows = await sql`
      SELECT id, account_phone, grand_total
      FROM orders
      WHERE id = ${orderId}
    `;

    if (orderRows.length === 0) {
      return Response.json({ error: "Commande introuvable." }, { status: 404 });
    }

    const order = orderRows[0];

    if (order.account_phone !== account.phone) {
      return Response.json({ error: "Commande non autorisee." }, { status: 403 });
    }

    if ((order.grand_total || 0) < settings.min_amount) {
      return Response.json(
        { error: `Montant minimum de ${settings.min_amount} F CFA non atteint.` },
        { status: 403 },
      );
    }

    // Une seule roue par commande.
    const existing = await sql`
      SELECT id FROM wheel_spins WHERE order_id = ${orderId}
    `;
    if (existing.length > 0) {
      return Response.json(
        { error: "Tu as deja tourne la roue pour cette commande." },
        { status: 409 },
      );
    }

    const activePrizes = await sql`
      SELECT id, label, type, value, weight
      FROM wheel_prizes
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;

    if (activePrizes.length === 0) {
      return Response.json({ error: "Aucun lot disponible." }, { status: 503 });
    }

    // Tirage pondere.
    const totalWeight = activePrizes.reduce(
      (sum, p) => sum + Math.max(0, p.weight || 0),
      0,
    );

    let chosen;
    if (totalWeight <= 0) {
      chosen = activePrizes[0];
    } else {
      let r = Math.random() * totalWeight;
      chosen = activePrizes[activePrizes.length - 1];
      for (const prize of activePrizes) {
        r -= Math.max(0, prize.weight || 0);
        if (r < 0) {
          chosen = prize;
          break;
        }
      }
    }

    const index = activePrizes.findIndex((p) => p.id === chosen.id);

    // Attribution du gain.
    let updatedAccount = account;

    if (chosen.type === "points" && chosen.value > 0) {
      const rows = await sql`
        UPDATE accounts
        SET points = points + ${chosen.value},
            total_earned = total_earned + ${chosen.value}
        WHERE phone = ${account.phone}
        RETURNING name, phone, points, total_earned, free_delivery_credits, free_puff_credits
      `;
      updatedAccount = rows[0];
    } else if (chosen.type === "delivery") {
      const rows = await sql`
        UPDATE accounts
        SET free_delivery_credits = free_delivery_credits + ${Math.max(1, chosen.value || 1)}
        WHERE phone = ${account.phone}
        RETURNING name, phone, points, total_earned, free_delivery_credits, free_puff_credits
      `;
      updatedAccount = rows[0];
    } else if (chosen.type === "puff") {
      const rows = await sql`
        UPDATE accounts
        SET free_puff_credits = free_puff_credits + ${Math.max(1, chosen.value || 1)}
        WHERE phone = ${account.phone}
        RETURNING name, phone, points, total_earned, free_delivery_credits, free_puff_credits
      `;
      updatedAccount = rows[0];
    }

    await sql`
      INSERT INTO wheel_spins
        (order_id, account_phone, prize_id, prize_label, prize_type, prize_value)
      VALUES
        (${orderId}, ${account.phone}, ${chosen.id}, ${chosen.label}, ${chosen.type}, ${chosen.value || 0})
    `;

    return Response.json({
      prize: {
        id: chosen.id,
        label: chosen.label,
        type: chosen.type,
        value: chosen.value || 0,
      },
      index,
      prizes: activePrizes.map((p) => ({
        id: p.id,
        label: p.label,
        type: p.type,
        value: p.value,
      })),
      account: {
        name: updatedAccount.name,
        phone: updatedAccount.phone,
        points: updatedAccount.points,
        total_earned: updatedAccount.total_earned,
        free_delivery_credits: updatedAccount.free_delivery_credits,
        free_puff_credits: updatedAccount.free_puff_credits,
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
