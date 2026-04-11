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
    const { name, brand, price, image } = await request.json();

    if (!name || !brand || !price) {
      return Response.json(
        { error: "Nom, marque et prix requis." },
        { status: 400 },
      );
    }

    const id = `${brand.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;

    const existing = await sql`SELECT id FROM products WHERE id = ${id}`;

    if (existing.length > 0) {
      return Response.json(
        { error: "Un produit avec cet identifiant existe deja." },
        { status: 409 },
      );
    }

    const rows = await sql`
      INSERT INTO products (id, name, brand, price, image)
      VALUES (${id}, ${name}, ${brand}, ${price}, ${image || ""})
      RETURNING id, name, brand, price, image, in_stock
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
    const { id, name, brand, price, image, in_stock } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Identifiant produit requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      UPDATE products
      SET
        name = COALESCE(${name ?? null}, name),
        brand = COALESCE(${brand ?? null}, brand),
        price = COALESCE(${price ?? null}, price),
        image = COALESCE(${image ?? null}, image),
        in_stock = COALESCE(${in_stock ?? null}, in_stock)
      WHERE id = ${id}
      RETURNING id, name, brand, price, image, in_stock
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Produit introuvable." },
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
        { error: "Identifiant produit requis." },
        { status: 400 },
      );
    }

    const rows = await sql`
      DELETE FROM products WHERE id = ${id} RETURNING id
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Produit introuvable." },
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
