import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { phone, pin, subscription } = await request.json();

    if (!phone || !pin || !subscription || !subscription.endpoint) {
      return Response.json(
        { error: "Informations d'abonnement manquantes." },
        { status: 400 },
      );
    }

    const account = await sql`
      SELECT phone FROM accounts WHERE phone = ${phone} AND pin = ${pin}
    `;

    if (account.length === 0) {
      return Response.json({ error: "Non autorise." }, { status: 401 });
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!p256dh || !auth) {
      return Response.json(
        { error: "Cles d'abonnement manquantes." },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO push_subscriptions (phone, endpoint, p256dh, auth)
      VALUES (${phone}, ${subscription.endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE
      SET phone = EXCLUDED.phone, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur", detail: error.message },
      { status: 500 },
    );
  }
}
