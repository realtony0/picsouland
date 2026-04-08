"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function InstallerPage() {
  const [deviceKind, setDeviceKind] = useState("unknown");
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const userAgent = window.navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (userAgent.includes("Mac") && "ontouchend" in document);
    const isAndroid = /Android/.test(userAgent);

    setDeviceKind(isIOS ? "ios" : isAndroid ? "android" : "desktop");

    const standaloneMatch =
      window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = window.navigator.standalone === true;
    setIsStandalone(Boolean(standaloneMatch || iosStandalone));

    function handleBeforeInstall(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
    }

    function handleInstalled() {
      setInstallPromptEvent(null);
      setIsStandalone(true);
      setInstallMessage("PicsouLand est maintenant installe sur ton telephone !");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!installPromptEvent) {
      return;
    }

    try {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice && choice.outcome === "accepted") {
        setInstallPromptEvent(null);
      } else {
        setInstallMessage("Tu peux relancer l'installation quand tu veux.");
      }
    } catch {
      setInstallMessage("L'installation a ete annulee.");
    }
  }

  return (
    <main className="installer-shell">
      <header className="installer-top">
        <Link className="back-link" href="/">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M15 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Retour a la boutique
        </Link>

        <span className="install-badge">Installer l&apos;app</span>
        <h1>Ajoute PicsouLand sur ton telephone</h1>
        <p className="installer-lead">
          Mets PicsouLand sur ton ecran d&apos;accueil pour ouvrir la boutique en
          un seul tap, comme une vraie application. Aucun telechargement sur un
          store, aucune inscription.
        </p>
      </header>

      {isStandalone ? (
        <section className="installer-success">
          <div className="installer-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 12l3 3 5-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div>
            <strong>C&apos;est deja fait !</strong>
            <p>
              Tu utilises PicsouLand depuis ton ecran d&apos;accueil. Rien a
              installer de plus.
            </p>
          </div>
        </section>
      ) : null}

      <section className="installer-perks">
        <article>
          <span className="perk-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
                fill="currentColor"
              />
            </svg>
          </span>
          <strong>Acces ultra rapide</strong>
          <p>
            Un tap sur l&apos;icone et tu es dans la boutique. Plus besoin
            d&apos;ouvrir Safari ou Chrome.
          </p>
        </article>
        <article>
          <span className="perk-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect
                x="5"
                y="3"
                width="14"
                height="18"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="17" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <strong>Comme une vraie app</strong>
          <p>
            Aucune barre de navigation, une experience plein ecran propre et
            rapide.
          </p>
        </article>
        <article>
          <span className="perk-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 3v18M3 12h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
          <strong>Aucun store</strong>
          <p>
            Aucun App Store, aucun Play Store. L&apos;installation prend 5
            secondes depuis ton navigateur.
          </p>
        </article>
      </section>

      <section
        className={`installer-platform ${
          deviceKind === "ios" ? "highlight" : ""
        }`}
      >
        <div className="platform-heading">
          <span className="install-badge">iPhone / iPad</span>
          <h2>Sur iPhone avec Safari</h2>
          <p>
            Apple interdit l&apos;installation automatique, mais ca se fait en 3
            petites etapes.
          </p>
        </div>

        <ol className="ios-steps">
          <li className="ios-step">
            <span className="ios-step-number">1</span>
            <div className="ios-step-body">
              <strong>Touche le bouton Partager</strong>
              <p>Le petit carre avec une fleche qui monte, en bas de Safari.</p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 56">
                <rect
                  x="10"
                  y="20"
                  width="28"
                  height="32"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M24 4 v28 M14 14 l10-10 10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </li>

          <li className="ios-step">
            <span className="ios-step-number">2</span>
            <div className="ios-step-body">
              <strong>Descends et touche &quot;Sur l&apos;ecran d&apos;accueil&quot;</strong>
              <p>Cherche la ligne avec un petit plus (+) dans un carre.</p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <rect
                  x="6"
                  y="6"
                  width="36"
                  height="36"
                  rx="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M24 15 v18 M15 24 h18"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </li>

          <li className="ios-step">
            <span className="ios-step-number">3</span>
            <div className="ios-step-body">
              <strong>Touche &quot;Ajouter&quot; en haut a droite</strong>
              <p>L&apos;icone PicsouLand apparait sur ton ecran. C&apos;est pret !</p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M14 24 l7 8 l13-16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </li>
        </ol>

        <p className="platform-note">
          Astuce : si tu ne vois pas le bouton Partager, ouvre cette page dans
          Safari. Dans les autres navigateurs iPhone, le bouton peut etre cache.
        </p>
      </section>

      <section
        className={`installer-platform ${
          deviceKind === "android" ? "highlight" : ""
        }`}
      >
        <div className="platform-heading">
          <span className="install-badge">Android</span>
          <h2>Sur Android avec Chrome</h2>
          <p>
            Encore plus simple : un bouton ouvre directement le popup
            d&apos;installation.
          </p>
        </div>

        {installPromptEvent ? (
          <button
            className="button primary full install-now-button"
            onClick={triggerInstall}
            type="button"
          >
            Installer maintenant
          </button>
        ) : null}

        <ol className="ios-steps">
          <li className="ios-step">
            <span className="ios-step-number">1</span>
            <div className="ios-step-body">
              <strong>Touche le bouton &quot;Installer maintenant&quot;</strong>
              <p>
                Sinon, ouvre le menu de Chrome (3 points en haut a droite).
              </p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="12" r="2.4" fill="currentColor" />
                <circle cx="24" cy="24" r="2.4" fill="currentColor" />
                <circle cx="24" cy="36" r="2.4" fill="currentColor" />
              </svg>
            </div>
          </li>

          <li className="ios-step">
            <span className="ios-step-number">2</span>
            <div className="ios-step-body">
              <strong>Touche &quot;Installer l&apos;application&quot;</strong>
              <p>
                Ou &quot;Ajouter a l&apos;ecran d&apos;accueil&quot; selon le
                navigateur.
              </p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path
                  d="M24 6 v24 M14 20 l10 10 10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 38 h32"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </li>

          <li className="ios-step">
            <span className="ios-step-number">3</span>
            <div className="ios-step-body">
              <strong>Confirme et l&apos;icone apparait</strong>
              <p>L&apos;icone PicsouLand rejoint tes autres applications.</p>
            </div>
            <div className="ios-step-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M14 24 l7 8 l13-16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </li>
        </ol>
      </section>

      {installMessage ? (
        <p className="installer-feedback">{installMessage}</p>
      ) : null}

      <footer className="installer-footer">
        <Link className="button primary" href="/">
          Revenir a la boutique
        </Link>
      </footer>
    </main>
  );
}
