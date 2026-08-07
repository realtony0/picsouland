import webpush from "web-push";
import sql from "@/lib/db";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BBwaEFQoP3088ylfjxbdsd6mfFeXcG-wwIwcWLWcaYhytBYzj57D4S6ZnKyYJDdYYmv5IQhTgTlK1_RtWC91gTo";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let configured = false;

function ensureConfigured() {
  if (configured || !VAPID_PRIVATE_KEY) {
    return configured;
  }

  webpush.setVapidDetails(
    "mailto:contact@picsou-land.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

// Envoie une notification push a tous les appareils abonnes pour ce numero.
// Echoue silencieusement si les cles VAPID ne sont pas configurees ou si la
// table n'existe pas encore (avant migration) : la commande ne doit jamais
// planter a cause d'une notification.
export async function sendPushToPhone(phone, payload) {
  if (!phone || !ensureConfigured()) {
    return;
  }

  let subs;
  try {
    subs = await sql`
      SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE phone = ${phone}
    `;
  } catch {
    return;
  }

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`.catch(
            () => {},
          );
        }
      }
    }),
  );
}
