import sql from "@/lib/db";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";

function checkAdmin(request) {
  return request.headers.get("x-admin-pin") === ADMIN_PIN;
}

const VALID_TYPES = ["points", "delivery", "puff", "nothing"];

export async function GET(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const settingsRows = await sql`
      SELECT enabled, min_amount FROM wheel_settings WHERE id = 1
    `;

    const prizes = await sql`
      SELECT id, label, type, value, weight, active, sort_order
      FROM wheel_prizes
      ORDER BY sort_order ASC, id ASC
    `;

    const spins = await sql`
      SELECT id, order_id, account_phone, prize_label, prize_type, prize_value, created_at
      FROM wheel_spins
      ORDER BY created_at DESC
      LIMIT 40
    `;

    return Response.json({
      settings: settingsRows[0] || { enabled: true, min_amount: 8000 },
      prizes,
      spins,
    });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { label, type, value, weight, active, sortOrder } = await request.json();

    if (!label || !type) {
      return Response.json({ error: "Label et type requis." }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: "Type de lot invalide." }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO wheel_prizes (label, type, value, weight, active, sort_order)
      VALUES (
        ${label},
        ${type},
        ${Number.isFinite(value) ? value : 0},
        ${Number.isFinite(weight) ? Math.max(0, weight) : 1},
        ${active !== false},
        ${Number.isFinite(sortOrder) ? sortOrder : 0}
      )
      RETURNING id, label, type, value, weight, active, sort_order
    `;

    return Response.json(rows[0]);
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
    const body = await request.json();

    // Mise a jour des reglages globaux.
    if (body.settings) {
      const { enabled, minAmount } = body.settings;
      const rows = await sql`
        UPDATE wheel_settings
        SET
          enabled = COALESCE(${typeof enabled === "boolean" ? enabled : null}, enabled),
          min_amount = COALESCE(${Number.isFinite(minAmount) ? Math.max(0, minAmount) : null}, min_amount)
        WHERE id = 1
        RETURNING enabled, min_amount
      `;
      return Response.json({ settings: rows[0] });
    }

    // Mise a jour d'un lot.
    const { id, label, type, value, weight, active, sortOrder } = body;

    if (!id) {
      return Response.json({ error: "Identifiant du lot requis." }, { status: 400 });
    }

    if (type && !VALID_TYPES.includes(type)) {
      return Response.json({ error: "Type de lot invalide." }, { status: 400 });
    }

    const rows = await sql`
      UPDATE wheel_prizes
      SET
        label = COALESCE(${label ?? null}, label),
        type = COALESCE(${type ?? null}, type),
        value = COALESCE(${Number.isFinite(value) ? value : null}, value),
        weight = COALESCE(${Number.isFinite(weight) ? Math.max(0, weight) : null}, weight),
        active = COALESCE(${typeof active === "boolean" ? active : null}, active),
        sort_order = COALESCE(${Number.isFinite(sortOrder) ? sortOrder : null}, sort_order)
      WHERE id = ${id}
      RETURNING id, label, type, value, weight, active, sort_order
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Lot introuvable." }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: "Identifiant du lot requis." }, { status: 400 });
    }

    const rows = await sql`DELETE FROM wheel_prizes WHERE id = ${id} RETURNING id`;

    if (rows.length === 0) {
      return Response.json({ error: "Lot introuvable." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
