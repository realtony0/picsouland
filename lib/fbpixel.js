export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "2478570292639669";

// Envoie un evenement au Pixel Meta si le script est charge. Ne fait
// jamais planter le site si le pixel est bloque (ad-blocker, etc.).
export function trackPixelEvent(eventName, params) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  try {
    window.fbq("track", eventName, params);
  } catch {
    // Pixel indisponible : on ignore silencieusement.
  }
}
