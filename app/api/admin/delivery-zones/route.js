import sql from "@/lib/db";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";

function checkAdmin(request) {
  return request.headers.get("x-admin-pin") === ADMIN_PIN;
}

export async function POST(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { area, price, sortOrder } = await request.json();

    if (!area || !area.trim() || !Number.isFinite(price)) {
      return Response.json(
        { error: "Nom de zone et prix requis." },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT id FROM delivery_zones WHERE area = ${area.trim()}
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Cette zone existe deja." },
        { status: 409 },
      );
    }

    const rows = await sql`
      INSERT INTO delivery_zones (area, price, sort_order)
      VALUES (${area.trim()}, ${Math.max(0, price)}, ${Number.isFinite(sortOrder) ? sortOrder : 0})
      RETURNING id, area, price, sort_order
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
    const { id, area, price, sortOrder } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Identifiant de zone requis." },
        { status: 400 },
      );
    }

    const trimmedArea = typeof area === "string" ? area.trim() : null;

    const rows = await sql`
      UPDATE delivery_zones
      SET
        area = COALESCE(${trimmedArea || null}, area),
        price = COALESCE(${Number.isFinite(price) ? Math.max(0, price) : null}, price),
        sort_order = COALESCE(${Number.isFinite(sortOrder) ? sortOrder : null}, sort_order)
      WHERE id = ${id}
      RETURNING id, area, price, sort_order
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Zone introuvable." },
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
    const { id } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Identifiant de zone requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      DELETE FROM delivery_zones WHERE id = ${id} RETURNING id
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Zone introuvable." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
