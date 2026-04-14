import sql from "@/lib/db";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";

export async function POST(request) {
  try {
    const { pin } = await request.json();

    if (pin !== ADMIN_PIN) {
      return Response.json({ error: "PIN incorrect" }, { status: 401 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id           SERIAL PRIMARY KEY,
        name         TEXT NOT NULL,
        phone        VARCHAR(20) UNIQUE NOT NULL,
        pin          VARCHAR(4) NOT NULL,
        points       INTEGER NOT NULL DEFAULT 0,
        total_earned INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id              SERIAL PRIMARY KEY,
        account_phone   VARCHAR(20) REFERENCES accounts(phone) ON DELETE SET NULL,
        items           JSONB NOT NULL,
        subtotal        INTEGER NOT NULL,
        delivery_zone   TEXT,
        delivery_price  INTEGER NOT NULL DEFAULT 0,
        reward_id       TEXT,
        reward_discount INTEGER NOT NULL DEFAULT 0,
        grand_total     INTEGER NOT NULL,
        points_earned   INTEGER NOT NULL DEFAULT 0,
        points_used     INTEGER NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_orders_account_phone ON orders(account_phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'status'
        ) THEN
          ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        END IF;
      END $$
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        brand      TEXT NOT NULL,
        price      INTEGER NOT NULL,
        image      TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)`;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'in_stock'
        ) THEN
          ALTER TABLE products ADD COLUMN in_stock BOOLEAN NOT NULL DEFAULT true;
        END IF;
      END $$
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS promotions (
        id         SERIAL PRIMARY KEY,
        label      TEXT NOT NULL,
        discount_percent INTEGER NOT NULL DEFAULT 0,
        brand_filter TEXT,
        product_filter TEXT,
        starts_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        ends_at    TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await sql`
      INSERT INTO products (id, name, brand, price, image) VALUES
        ('rodman-allstar', 'All Star', 'Rodman', 8000, '/images/rodman-allstar.jpeg'),
        ('rodman-buzzerbeater', 'Buzzer Beater', 'Rodman', 8000, '/images/rodman-buzzerbeater.webp'),
        ('rodman-coolmint', 'Cool Mint', 'Rodman', 8000, '/images/rodman-coolmint.webp'),
        ('rodman-peach-berry', 'Peach Berry', 'Rodman', 8000, '/images/rodman-peach-berry.webp'),
        ('rodman-pineapple-banana-ice', 'Pineapple Banana Ice', 'Rodman', 8000, '/images/rodman-pineapple-banana-ice.webp'),
        ('rodman-red-bull', 'Red Bull', 'Rodman', 8000, '/images/rodman-red-bull.webp'),
        ('coolbar-cola-ice', 'Cola Ice', 'Coolbar', 7000, '/images/coolbar-cola-ice.jpeg'),
        ('coolbar-mix-berry', 'Mix Berry', 'Coolbar', 7000, '/images/coolbar-mix-berry.png'),
        ('coolbar-peach-ice', 'Peach Ice', 'Coolbar', 7000, '/images/coolbar-peach-ice.png'),
        ('coolbar-watermelon', 'Watermelon', 'Coolbar', 7000, '/images/coolbar-watermelon.png'),
        ('hyperjoy-blue-razz', 'Blue Razz', 'Hyperjoy', 8000, '/images/hyperjoy-blue-razz.jpg'),
        ('hyperjoy-kiwi-passion-fruit-guava', 'Kiwi Passion Fruit Guava', 'Hyperjoy', 8000, '/images/hyperjoy-kiwi-passion-fruit-guava.jpg'),
        ('hyperjoy-triple-berry', 'Triple Berry', 'Hyperjoy', 8000, '/images/hyperjoy-triple-berry.jpg'),
        ('hyperjoy-vimto', 'Vimto', 'Hyperjoy', 8000, '/images/hyperjoy-vimto.jpg'),
        ('hyperjoy-watermelon-bubble-gum', 'Watermelon Bubble Gum', 'Hyperjoy', 8000, '/images/hyperjoy-watermelon-bubble-gum.jpg'),
        ('hyperjoy-watermelon-ice', 'Watermelon Ice', 'Hyperjoy', 8000, '/images/hyperjoy-watermelon-ice.jpg')
      ON CONFLICT (id) DO NOTHING
    `;

    return Response.json({ ok: true, message: "Migration terminee." });
  } catch (error) {
    return Response.json(
      { error: "Erreur migration", detail: error.message },
      { status: 500 },
    );
  }
}
