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
      SELECT name, phone, points, total_earned, created_at
      FROM accounts
      ORDER BY created_at DESC
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
    const { phone, pointsDelta, pointsAbsolute } = await request.json();

    if (!phone) {
      return Response.json(
        { error: "Telephone requis." },
        { status: 400 },
      );
    }

    let rows;

    if (typeof pointsAbsolute === "number") {
      const newPoints = Math.max(0, pointsAbsolute);

      rows = await sql`
        UPDATE accounts
        SET
          points = ${newPoints},
          total_earned = GREATEST(total_earned, ${newPoints})
        WHERE phone = ${phone}
        RETURNING name, phone, points, total_earned
      `;
    } else if (typeof pointsDelta === "number") {
      const addToTotal = pointsDelta > 0 ? pointsDelta : 0;

      rows = await sql`
        UPDATE accounts
        SET
          points = GREATEST(0, points + ${pointsDelta}),
          total_earned = total_earned + ${addToTotal}
        WHERE phone = ${phone}
        RETURNING name, phone, points, total_earned
      `;
    } else {
      return Response.json(
        { error: "pointsDelta ou pointsAbsolute requis." },
        { status: 400 },
      );
    }

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

export async function DELETE(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json(
        { error: "Telephone requis." },
        { status: 400 },
      );
    }

    await sql`DELETE FROM orders WHERE account_phone = ${phone}`;
    await sql`DELETE FROM accounts WHERE phone = ${phone}`;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
