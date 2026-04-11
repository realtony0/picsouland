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
      SELECT id, label, discount_percent, brand_filter, product_filter, starts_at, ends_at, created_at
      FROM promotions
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

export async function POST(request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { label, discountPercent, brandFilter, productFilter, endsAt } =
      await request.json();

    if (!label || !discountPercent || !endsAt) {
      return Response.json(
        { error: "Nom, pourcentage et date de fin requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      INSERT INTO promotions (label, discount_percent, brand_filter, product_filter, ends_at)
      VALUES (${label}, ${discountPercent}, ${brandFilter || null}, ${productFilter || null}, ${endsAt})
      RETURNING id, label, discount_percent, brand_filter, product_filter, starts_at, ends_at
    `;

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

    await sql`DELETE FROM promotions WHERE id = ${id}`;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
