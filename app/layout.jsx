import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "PicsouLand | Rodman, Coolbar & Hyperjoy",
  applicationName: "PicsouLand",
  description:
    "PicsouLand, boutique de puffs au Senegal avec les gammes Rodman, Coolbar et Hyperjoy. Catalogue photo, commande rapide et compte client.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "PicsouLand",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#d45b1f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
