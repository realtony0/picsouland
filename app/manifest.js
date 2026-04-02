export default function manifest() {
  return {
    name: "PicsouLand",
    short_name: "PicsouLand",
    description:
      "PicsouLand, boutique de puffs au Senegal avec commande WhatsApp, compte client et ajout a l'ecran d'accueil.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ef",
    theme_color: "#d45b1f",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
