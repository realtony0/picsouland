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
      SELECT id, name, color, sort_order
      FROM categories
      ORDER BY sort_order, name
    `;
    return Response.json(rows);
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
    const { name, color, sortOrder } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Nom de categorie requis." },
        { status: 400 },
      );
    }

    const existing = await sql`SELECT id FROM categories WHERE name = ${name.trim()}`;

    if (existing.length > 0) {
      return Response.json(
        { error: "Cette categorie existe deja." },
        { status: 409 },
      );
    }

    const rows = await sql`
      INSERT INTO categories (name, color, sort_order)
      VALUES (${name.trim()}, ${color || "#d45b1f"}, ${sortOrder || 0})
      RETURNING id, name, color, sort_order
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
    const { id, name, color, sortOrder } = await request.json();

    if (!id) {
      return Response.json({ error: "ID requis." }, { status: 400 });
    }

    const oldRows = await sql`SELECT name FROM categories WHERE id = ${id}`;
    if (oldRows.length === 0) {
      return Response.json(
        { error: "Categorie introuvable." },
        { status: 404 },
      );
    }

    const rows = await sql`
      UPDATE categories
      SET
        name = COALESCE(${name ?? null}, name),
        color = COALESCE(${color ?? null}, color),
        sort_order = COALESCE(${sortOrder ?? null}, sort_order)
      WHERE id = ${id}
      RETURNING id, name, color, sort_order
    `;

    if (name && name !== oldRows[0].name) {
      await sql`
        UPDATE products SET brand = ${name} WHERE brand = ${oldRows[0].name}
      `;
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
      return Response.json({ error: "ID requis." }, { status: 400 });
    }

    const rows = await sql`
      DELETE FROM categories WHERE id = ${id} RETURNING name
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Categorie introuvable." },
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
