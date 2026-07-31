import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  themeColor: "#141414",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
