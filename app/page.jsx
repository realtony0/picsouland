"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEYS = {
  accounts: "picsouland_accounts",
  ageGate: "picsouland_age_gate",
  session: "picsouland_session_phone",
  installDismissed: "picsouland_install_dismissed",
};

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "221761668636";

const products = [
  {
    id: "rodman-allstar",
    name: "All Star",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-allstar.jpeg",
  },
  {
    id: "rodman-buzzerbeater",
    name: "Buzzer Beater",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-buzzerbeater.webp",
  },
  {
    id: "rodman-coolmint",
    name: "Cool Mint",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-coolmint.webp",
  },
  {
    id: "rodman-peach-berry",
    name: "Peach Berry",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-peach-berry.webp",
  },
  {
    id: "rodman-pineapple-banana-ice",
    name: "Pineapple Banana Ice",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-pineapple-banana-ice.webp",
  },
  {
    id: "rodman-red-bull",
    name: "Red Bull",
    brand: "Rodman",
    price: 8000,
    image: "/images/rodman-red-bull.webp",
  },
  {
    id: "coolbar-cola-ice",
    name: "Cola Ice",
    brand: "Coolbar",
    price: 7000,
    image: "/images/coolbar-cola-ice.jpeg",
  },
  {
    id: "coolbar-mix-berry",
    name: "Mix Berry",
    brand: "Coolbar",
    price: 7000,
    image: "/images/coolbar-mix-berry.png",
  },
  {
    id: "coolbar-peach-ice",
    name: "Peach Ice",
    brand: "Coolbar",
    price: 7000,
    image: "/images/coolbar-peach-ice.png",
  },
  {
    id: "coolbar-watermelon",
    name: "Watermelon",
    brand: "Coolbar",
    price: 7000,
    image: "/images/coolbar-watermelon.png",
  },
  {
    id: "hyperjoy-blue-razz",
    name: "Blue Razz",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-blue-razz.jpg",
  },
  {
    id: "hyperjoy-kiwi-passion-fruit-guava",
    name: "Kiwi Passion Fruit Guava",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-kiwi-passion-fruit-guava.jpg",
  },
  {
    id: "hyperjoy-triple-berry",
    name: "Triple Berry",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-triple-berry.jpg",
  },
  {
    id: "hyperjoy-vimto",
    name: "Vimto",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-vimto.jpg",
  },
  {
    id: "hyperjoy-watermelon-bubble-gum",
    name: "Watermelon Bubble Gum",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-watermelon-bubble-gum.jpg",
  },
  {
    id: "hyperjoy-watermelon-ice",
    name: "Watermelon Ice",
    brand: "Hyperjoy",
    price: 8000,
    image: "/images/hyperjoy-watermelon-ice.jpg",
  },
];

const heroProducts = [
  {
    brand: "Rodman",
    name: "All Star",
    image: "/images/rodman-allstar.jpeg",
    toneClass: "tone-rodman",
  },
  {
    brand: "Coolbar",
    name: "Watermelon",
    image: "/images/coolbar-watermelon.png",
    toneClass: "tone-coolbar",
  },
  {
    brand: "Hyperjoy",
    name: "Vimto",
    image: "/images/hyperjoy-vimto.jpg",
    toneClass: "tone-hyperjoy",
  },
];

const formatter = new Intl.NumberFormat("fr-FR");

function formatPrice(value) {
  return `${formatter.format(value)} F CFA`;
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("221") && digits.length === 12) {
    return digits.slice(3);
  }

  return digits;
}

function isValidSenegalPhone(value) {
  return /^7(?:0|5|6|7|8)\d{7}$/.test(normalizePhone(value));
}

function formatPhone(value) {
  const phone = normalizePhone(value);

  if (!/^7\d{8}$/.test(phone)) {
    return value;
  }

  return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)}`;
}

function formatWhatsappNumber(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("221") && digits.length === 12) {
    return digits;
  }

  const localPhone = normalizePhone(value);

  if (/^7\d{8}$/.test(localPhone)) {
    return `221${localPhone}`;
  }

  return digits;
}

function buildMessage(entries, customer) {
  if (!entries.length) {
    return "";
  }

  const total = entries.reduce((sum, item) => sum + item.subtotal, 0);
  const lines = [
    "Bonjour, je souhaite commander :",
    "",
    ...entries.map(
      (item) =>
        `- ${item.brand} ${item.name} x${item.quantity} = ${formatPrice(item.subtotal)}`,
    ),
    "",
    `Total : ${formatPrice(total)}`,
  ];

  if (customer.name.trim()) {
    lines.push(`Nom : ${customer.name.trim()}`);
  }

  if (customer.area.trim()) {
    lines.push(`Zone : ${customer.area.trim()}`);
  }

  if (customer.phone.trim()) {
    lines.push(`Telephone : ${customer.phone.trim()}`);
  }

  lines.push("", "Merci.");
  return lines.join("\n");
}

function readStoredAccounts() {
  try {
    const rawAccounts = window.localStorage.getItem(STORAGE_KEYS.accounts);

    if (!rawAccounts) {
      return [];
    }

    const parsedAccounts = JSON.parse(rawAccounts);
    return Array.isArray(parsedAccounts) ? parsedAccounts : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [ageGateStatus, setAgeGateStatus] = useState("pending");
  const [filter, setFilter] = useState("all");
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    area: "",
    phone: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authStatus, setAuthStatus] = useState("");
  const [signupForm, setSignupForm] = useState({
    name: "",
    phone: "",
    pin: "",
  });
  const [loginForm, setLoginForm] = useState({
    phone: "",
    pin: "",
  });
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [deviceKind, setDeviceKind] = useState("unknown");
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedAccounts = readStoredAccounts();
    const storedSession = window.localStorage.getItem(STORAGE_KEYS.session) || "";
    const ageGateValue = window.sessionStorage.getItem(STORAGE_KEYS.ageGate);

    setAccounts(storedAccounts);

    if (storedSession && storedAccounts.some((account) => account.phone === storedSession)) {
      setCurrentUserPhone(storedSession);
    }

    setAgeGateStatus(ageGateValue === "yes" ? "granted" : "pending");
  }, []);

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
      setIsInstallGuideOpen(false);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (ageGateStatus !== "granted") {
      return;
    }

    if (deviceKind !== "ios" || isStandalone) {
      return;
    }

    const dismissed = window.localStorage.getItem(STORAGE_KEYS.installDismissed);

    if (dismissed === "yes") {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsInstallGuideOpen(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [ageGateStatus, deviceKind, isStandalone]);

  const currentAccount =
    accounts.find((account) => account.phone === currentUserPhone) || null;

  useEffect(() => {
    if (!currentAccount) {
      return;
    }

    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      name: currentCustomer.name || currentAccount.name,
      phone: currentCustomer.phone || formatPhone(currentAccount.phone),
    }));
  }, [currentAccount]);

  const visibleProducts =
    filter === "all"
      ? products
      : products.filter((product) => product.brand === filter);

  const cartEntries = products
    .filter((product) => (cart[product.id] || 0) > 0)
    .map((product) => {
      const quantity = cart[product.id];
      return {
        ...product,
        quantity,
        subtotal: quantity * product.price,
      };
    });

  const cartTotal = cartEntries.reduce((sum, item) => sum + item.subtotal, 0);
  const cartCount = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  const generatedMessage = buildMessage(cartEntries, customer);

  function persistAccounts(nextAccounts) {
    setAccounts(nextAccounts);
    window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(nextAccounts));
  }

  function openAccountPanel(mode = "signup") {
    setAuthMode(mode);
    setAuthStatus("");
    setIsAccountOpen(true);
  }

  function closeAccountPanel() {
    setIsAccountOpen(false);
    setAuthStatus("");
  }

  function openCartPanel() {
    setIsCartOpen(true);
  }

  function closeCartPanel() {
    setIsCartOpen(false);
  }

  function acceptAgeGate() {
    window.sessionStorage.setItem(STORAGE_KEYS.ageGate, "yes");
    setAgeGateStatus("granted");
  }

  function rejectAgeGate() {
    setAgeGateStatus("blocked");
  }

  function changeQuantity(productId, delta) {
    setCart((currentCart) => {
      const nextQuantity = Math.max(0, (currentCart[productId] || 0) + delta);
      const nextCart = { ...currentCart };

      if (nextQuantity === 0) {
        delete nextCart[productId];
      } else {
        nextCart[productId] = nextQuantity;
      }

      return nextCart;
    });
  }

  function addToCart(product) {
    changeQuantity(product.id, 1);
  }

  function updateCustomerField(field, value) {
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      [field]: value,
    }));
  }

  function handleSignup(event) {
    event.preventDefault();

    if (!signupForm.name.trim()) {
      setAuthStatus("Entre ton nom pour creer le compte.");
      return;
    }

    if (!isValidSenegalPhone(signupForm.phone)) {
      setAuthStatus("Entre un numero senegalais valide.");
      return;
    }

    if (!/^\d{4}$/.test(signupForm.pin)) {
      setAuthStatus("Le code PIN doit contenir exactement 4 chiffres.");
      return;
    }

    const normalizedPhone = normalizePhone(signupForm.phone);

    if (accounts.some((account) => account.phone === normalizedPhone)) {
      setAuthStatus("Ce numero a deja un compte. Connecte-toi avec ton PIN.");
      setAuthMode("login");
      setLoginForm((currentForm) => ({
        ...currentForm,
        phone: formatPhone(normalizedPhone),
      }));
      return;
    }

    const nextAccount = {
      name: signupForm.name.trim(),
      phone: normalizedPhone,
      pin: signupForm.pin,
    };

    const nextAccounts = [...accounts, nextAccount];
    persistAccounts(nextAccounts);
    window.localStorage.setItem(STORAGE_KEYS.session, normalizedPhone);
    setCurrentUserPhone(normalizedPhone);
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      name: nextAccount.name,
      phone: formatPhone(normalizedPhone),
    }));
    setSignupForm({
      name: "",
      phone: "",
      pin: "",
    });
    setAuthStatus("Compte cree et connecte sur cet appareil.");
  }

  function handleLogin(event) {
    event.preventDefault();

    if (!isValidSenegalPhone(loginForm.phone)) {
      setAuthStatus("Entre le numero du compte au format senegalais valide.");
      return;
    }

    if (!/^\d{4}$/.test(loginForm.pin)) {
      setAuthStatus("Entre ton code PIN a 4 chiffres.");
      return;
    }

    const normalizedPhone = normalizePhone(loginForm.phone);
    const account = accounts.find(
      (storedAccount) =>
        storedAccount.phone === normalizedPhone && storedAccount.pin === loginForm.pin,
    );

    if (!account) {
      setAuthStatus("Numero ou code PIN incorrect.");
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.session, normalizedPhone);
    setCurrentUserPhone(normalizedPhone);
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      name: currentCustomer.name || account.name,
      phone: currentCustomer.phone || formatPhone(normalizedPhone),
    }));
    setLoginForm({
      phone: "",
      pin: "",
    });
    setAuthStatus("Connexion reussie.");
  }

  function handleLogout() {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    setCurrentUserPhone("");
    setAuthMode("login");
    setAuthStatus("Compte deconnecte.");
  }

  async function prepareOrder() {
    if (!generatedMessage) {
      window.alert("Ajoute au moins un produit avant de preparer la commande.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedMessage);
    } catch {}

    const cleanNumber = formatWhatsappNumber(whatsappNumber);

    if (cleanNumber) {
      window.open(
        `https://wa.me/${cleanNumber}?text=${encodeURIComponent(generatedMessage)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  function clearCart() {
    setCart({});
  }

  async function triggerInstall() {
    if (installPromptEvent) {
      try {
        installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;

        if (choice && choice.outcome === "accepted") {
          setInstallPromptEvent(null);
          setIsInstallGuideOpen(false);
        }
      } catch {
        setIsInstallGuideOpen(true);
      }

      return;
    }

    setIsInstallGuideOpen(true);
  }

  function dismissInstallGuide() {
    setIsInstallGuideOpen(false);
    window.localStorage.setItem(STORAGE_KEYS.installDismissed, "yes");
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen((open) => !open);
  }

  const canShowInstallButton =
    !isStandalone && (installPromptEvent !== null || deviceKind === "ios");

  if (ageGateStatus !== "granted") {
    return (
      <main className="age-gate-shell">
        <section className="age-card">
          <span className="gate-badge">Controle 18+</span>
          <h1>PicsouLand</h1>

          {ageGateStatus === "blocked" ? (
            <>
              <p className="age-copy">
                L&apos;acces a cette boutique est reserve aux personnes de 18 ans
                ou plus.
              </p>
              <div className="age-actions">
                <button
                  className="button secondary"
                  onClick={() => setAgeGateStatus("pending")}
                  type="button"
                >
                  Revenir
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="age-copy">
                Avant d&apos;entrer, confirme que tu as bien 18 ans ou plus.
              </p>
              <div className="age-actions">
                <button className="button primary" onClick={acceptAgeGate} type="button">
                  Oui, j&apos;ai 18 ans ou plus
                </button>
                <button className="button secondary" onClick={rejectAgeGate} type="button">
                  Non
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="page-shell">
        <header className="site-header">
          <a className="brand" href="#top">
            <Image
              alt="Logo PicsouLand"
              className="brand-logo"
              height={220}
              priority
              src="/logo-picsouland.svg"
              width={900}
            />
            <span className="brand-copy">
              <small>Puffs au Senegal reservees aux adultes</small>
            </span>
          </a>

          <div className="header-cluster">
            <nav aria-label="Navigation principale" className="site-nav">
              <a href="#catalogue">Catalogue</a>
              <a href="#prix">Prix</a>
              <Link href="/installer">Installer l&apos;app</Link>
            </nav>

            {canShowInstallButton ? (
              <button
                className="install-cta-button"
                onClick={triggerInstall}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="install-cta-icon"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 4v10m0 0l-4-4m4 4l4-4M5 18h14"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                <span className="install-cta-label">Installer</span>
              </button>
            ) : null}

            <button
              aria-label="Ouvrir le panier"
              className="cart-icon-button"
              onClick={openCartPanel}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="cart-icon"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 5h2l2.2 9.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7.4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
            </button>

            <button
              className="account-button"
              onClick={() => openAccountPanel(currentAccount ? "login" : "signup")}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="account-icon"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 20c1.5-3.5 4.8-5 8-5s6.5 1.5 8 5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
              <span className="account-button-label">
                {currentAccount ? `Compte: ${currentAccount.name}` : "Mon compte"}
              </span>
            </button>

            <button
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={
                isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
              }
              className={`mobile-menu-button ${isMobileMenuOpen ? "open" : ""}`}
              onClick={toggleMobileMenu}
              type="button"
            >
              <span className="mobile-menu-bar" />
              <span className="mobile-menu-bar" />
              <span className="mobile-menu-bar" />
            </button>
          </div>

          {isMobileMenuOpen ? (
            <div className="mobile-menu" id="mobile-menu">
              <nav aria-label="Menu mobile" className="mobile-menu-nav">
                <a href="#catalogue" onClick={closeMobileMenu}>
                  Catalogue
                </a>
                <a href="#prix" onClick={closeMobileMenu}>
                  Prix
                </a>
                <Link
                  className="mobile-menu-install"
                  href="/installer"
                  onClick={closeMobileMenu}
                >
                  <span>Installer l&apos;app</span>
                  <svg
                    aria-hidden="true"
                    className="mobile-menu-install-icon"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </Link>
              </nav>
              <button
                className="mobile-menu-account"
                onClick={() => {
                  closeMobileMenu();
                  openAccountPanel(currentAccount ? "login" : "signup");
                }}
                type="button"
              >
                {currentAccount
                  ? `Mon compte - ${currentAccount.name}`
                  : "Mon compte / Se connecter"}
              </button>
            </div>
          ) : null}
        </header>

        <section className="section hero" id="top">
          <div className="hero-copy reveal">
            <p className="eyebrow">Boutique de puffs au Senegal</p>
            <h1>PicsouLand simplifie la commande de tes saveurs preferees.</h1>
            <p className="hero-text">
              Choisis parmi les collections Rodman, Coolbar et Hyperjoy, ajoute tes
              produits au panier, puis envoie ta commande en quelques secondes.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#catalogue">
                Voir les produits
              </a>
              {cartCount > 0 ? (
                <button
                  className="button secondary"
                  onClick={openCartPanel}
                  type="button"
                >
                  Voir mon panier
                </button>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => openAccountPanel("signup")}
                  type="button"
                >
                  Creer un compte
                </button>
              )}
            </div>

            <div className="price-strip" id="prix">
              <article>
                <span>Rodman</span>
                <strong>8 000 F CFA</strong>
              </article>
              <article>
                <span>Hyperjoy</span>
                <strong>8 000 F CFA</strong>
              </article>
              <article>
                <span>Coolbar</span>
                <strong>7 000 F CFA</strong>
              </article>
            </div>

            <div className="hero-notes">
              <span className="badge badge-warn">18+ adultes uniquement</span>
              <span className="badge">Compte rapide avec PIN</span>
              <span className="badge">Prix en francs CFA</span>
            </div>
          </div>

          <div className="hero-showcase reveal">
            {heroProducts.map((product) => (
              <article className={`showcase-card ${product.toneClass}`} key={product.name}>
                <Image
                  alt={`${product.brand} ${product.name}`}
                  className="showcase-image"
                  height={1000}
                  priority
                  src={product.image}
                  width={1000}
                />
                <div>
                  <p>{product.brand}</p>
                  <strong>{product.name}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section reveal" id="catalogue">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalogue</p>
              <h2>Les saveurs disponibles</h2>
            </div>
            <p className="section-copy">
              Filtre par marque, ajoute les articles au panier et laisse le site te
              generer un message de commande propre.
            </p>
          </div>

          <div aria-label="Filtres de produits" className="filters" role="tablist">
            {["all", "Rodman", "Coolbar", "Hyperjoy"].map((brand) => (
              <button
                className={`filter-button ${filter === brand ? "active" : ""}`}
                key={brand}
                onClick={() => setFilter(brand)}
                type="button"
              >
                {brand === "all" ? "Tout voir" : brand}
              </button>
            ))}
          </div>

          <div className="catalogue-layout">
            <div aria-live="polite" className="product-grid">
              {visibleProducts.map((product, index) => (
                (() => {
                  const quantity = cart[product.id] || 0;

                  return (
                    <article
                      className="product-card"
                      key={product.id}
                      style={{ animationDelay: `${index * 0.04}s` }}
                    >
                      <Image
                        alt={`${product.brand} ${product.name}`}
                        className="product-image"
                        height={1000}
                        src={product.image}
                        width={1000}
                      />
                      <div className="product-top">
                        <div>
                          <h3>{product.name}</h3>
                          <p className="product-meta">{product.brand}</p>
                        </div>
                        <span className="brand-pill" data-brand={product.brand}>
                          {product.brand}
                        </span>
                      </div>
                      <div className="product-bottom product-bottom-stack">
                        <div className="product-price-row">
                          <strong className="product-price">{formatPrice(product.price)}</strong>
                          {quantity > 0 ? (
                            <span className="in-cart-pill">{quantity} dans le panier</span>
                          ) : (
                            <span className="quick-pill">1 clic pour ajouter</span>
                          )}
                        </div>

                        {quantity === 0 ? (
                          <button
                            className="button primary full"
                            onClick={() => addToCart(product)}
                            type="button"
                          >
                            Ajouter au panier
                          </button>
                        ) : (
                          <div className="product-actions-row">
                            <div
                              aria-label={`Quantite ${product.name}`}
                              className="qty-controls qty-controls-wide"
                            >
                              <button
                                className="mini-button"
                                onClick={() => changeQuantity(product.id, -1)}
                                type="button"
                              >
                                -
                              </button>
                              <span className="qty-display">{quantity}</span>
                              <button
                                className="mini-button"
                                onClick={() => changeQuantity(product.id, 1)}
                                type="button"
                              >
                                +
                              </button>
                            </div>

                            <button
                              className="button secondary product-secondary"
                              onClick={openCartPanel}
                              type="button"
                            >
                              Voir le panier
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })()
              ))}
            </div>

          </div>
        </section>

        <section className="section install-section reveal" id="installer">
          <div className="install-heading">
            <div>
              <p className="eyebrow">Installer</p>
              <h2>Ajoute PicsouLand sur ton ecran d&apos;accueil</h2>
            </div>
            <p className="section-copy">
              C&apos;est simple : suis les petites etapes ci-dessous, puis valide.
            </p>
          </div>

          <div className="install-grid">
            <article className="install-card">
              <p className="eyebrow">Android</p>
              <h3>Chrome ou navigateur Android</h3>
              <ol className="install-steps">
                <li>Appuie sur le menu en haut a droite.</li>
                <li>Touche "Installer l&apos;application" ou "Ajouter a l&apos;ecran d&apos;accueil".</li>
                <li>Valide et l&apos;icone PicsouLand apparaitra sur le telephone.</li>
              </ol>
            </article>

            <article className="install-card">
              <p className="eyebrow">iPhone</p>
              <h3>Safari sur iOS</h3>
              <ol className="install-steps">
                <li>Appuie sur Partager dans Safari.</li>
                <li>Touche "Sur l&apos;ecran d&apos;accueil".</li>
                <li>Valide "Ajouter" pour garder PicsouLand comme une appli.</li>
              </ol>
            </article>
          </div>
        </section>

        <footer className="site-footer">
          <p>PicsouLand</p>
          <p>Catalogue digital reserve aux adultes.</p>
        </footer>
      </main>

      {isCartOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="cart-title"
            aria-modal="true"
            className="cart-sheet"
            role="dialog"
          >
            <div className="modal-top">
              <div>
                <p className="eyebrow">Commande</p>
                <h2 id="cart-title">Ton panier</h2>
              </div>
              <button className="modal-close" onClick={closeCartPanel} type="button">
                Fermer
              </button>
            </div>

            <div className="cart-head">
              <span className="cart-count">
                {cartCount} {cartCount > 1 ? "articles" : "article"}
              </span>
              <span className="cart-total-chip">{formatPrice(cartTotal)}</span>
            </div>

            {currentAccount ? (
              <div className="account-inline">
                <strong>{currentAccount.name}</strong>
                <span>{formatPhone(currentAccount.phone)}</span>
              </div>
            ) : null}

            {!cartEntries.length ? (
              <p className="cart-empty">
                Ajoute une ou plusieurs saveurs puis reviens ici pour commander.
              </p>
            ) : null}

            <div className="cart-items">
              {cartEntries.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div>
                    <strong>
                      {item.brand} - {item.name}
                    </strong>
                    <small>Quantite : {item.quantity}</small>
                  </div>
                  <strong>{formatPrice(item.subtotal)}</strong>
                </article>
              ))}
            </div>

            <div className="customer-fields">
              <label>
                Nom
                <input
                  onChange={(event) => updateCustomerField("name", event.target.value)}
                  placeholder="Ex : Mamadou"
                  type="text"
                  value={customer.name}
                />
              </label>
              <label>
                Quartier / ville
                <input
                  onChange={(event) => updateCustomerField("area", event.target.value)}
                  placeholder="Ex : Dakar, Parcelles Assainies"
                  type="text"
                  value={customer.area}
                />
              </label>
              <label>
                Telephone
                <input
                  onChange={(event) => updateCustomerField("phone", event.target.value)}
                  placeholder="Ex : 77 123 45 67"
                  type="tel"
                  value={customer.phone}
                />
              </label>
            </div>

            <div className="cart-total-row">
              <span>Total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <div className="cart-actions">
              <button className="button primary full" onClick={prepareOrder} type="button">
                Preparer ma commande
              </button>
              <button className="button secondary full" onClick={clearCart} type="button">
                Vider le panier
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isAccountOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="account-title"
            aria-modal="true"
            className="account-modal"
            role="dialog"
          >
            <div className="modal-top">
              <div>
                <p className="eyebrow">Compte</p>
                <h2 id="account-title">Mon espace PicsouLand</h2>
              </div>
              <button className="modal-close" onClick={closeAccountPanel} type="button">
                Fermer
              </button>
            </div>

            {currentAccount ? (
              <div className="account-summary">
                <div className="summary-card">
                  <span className="summary-label">Compte actif</span>
                  <strong>{currentAccount.name}</strong>
                  <span>{formatPhone(currentAccount.phone)}</span>
                </div>

                <p className="account-note">
                  Ce compte rapide est memorise sur cet appareil pour accelerer les
                  prochaines commandes.
                </p>

                <div className="modal-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      closeAccountPanel();
                    }}
                    type="button"
                  >
                    Continuer
                  </button>
                  <button className="button primary" onClick={handleLogout} type="button">
                    Deconnexion
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="tab-row">
                  <button
                    className={`tab-button ${authMode === "signup" ? "active" : ""}`}
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthStatus("");
                    }}
                    type="button"
                  >
                    Creer un compte
                  </button>
                  <button
                    className={`tab-button ${authMode === "login" ? "active" : ""}`}
                    onClick={() => {
                      setAuthMode("login");
                      setAuthStatus("");
                    }}
                    type="button"
                  >
                    Se connecter
                  </button>
                </div>

                {authMode === "signup" ? (
                  <form className="account-form" onSubmit={handleSignup}>
                    <label>
                      Nom
                      <input
                        onChange={(event) =>
                          setSignupForm((currentForm) => ({
                            ...currentForm,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Ex : Mamadou"
                        type="text"
                        value={signupForm.name}
                      />
                    </label>
                    <label>
                      Numero de telephone
                      <input
                        inputMode="tel"
                        onChange={(event) =>
                          setSignupForm((currentForm) => ({
                            ...currentForm,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="Ex : 76 166 86 36"
                        type="tel"
                        value={signupForm.phone}
                      />
                    </label>
                    <label>
                      Code PIN
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(event) =>
                          setSignupForm((currentForm) => ({
                            ...currentForm,
                            pin: event.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="4 chiffres"
                        type="password"
                        value={signupForm.pin}
                      />
                    </label>
                    <button className="button primary full" type="submit">
                      Creer mon compte
                    </button>
                  </form>
                ) : (
                  <form className="account-form" onSubmit={handleLogin}>
                    <label>
                      Numero de telephone
                      <input
                        inputMode="tel"
                        onChange={(event) =>
                          setLoginForm((currentForm) => ({
                            ...currentForm,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="Ex : 76 166 86 36"
                        type="tel"
                        value={loginForm.phone}
                      />
                    </label>
                    <label>
                      Code PIN
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(event) =>
                          setLoginForm((currentForm) => ({
                            ...currentForm,
                            pin: event.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="4 chiffres"
                        type="password"
                        value={loginForm.pin}
                      />
                    </label>
                    <button className="button primary full" type="submit">
                      Me connecter
                    </button>
                  </form>
                )}

                <p className="account-note">
                  Numero valide requis : format Senegal. Le compte reste memorise
                  seulement sur cet appareil.
                </p>
              </>
            )}

            <p className="account-status">{authStatus}</p>
          </section>
        </div>
      ) : null}

      {isInstallGuideOpen && deviceKind === "ios" && !isStandalone ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="ios-install-title"
            aria-modal="true"
            className="ios-install-modal"
            role="dialog"
          >
            <button
              aria-label="Fermer"
              className="ios-install-close"
              onClick={dismissInstallGuide}
              type="button"
            >
              Fermer
            </button>

            <div className="ios-install-hero">
              <span className="install-badge">Installer sur iPhone</span>
              <h2 id="ios-install-title">
                Ajoute PicsouLand sur ton ecran d&apos;accueil
              </h2>
              <p className="ios-install-intro">
                Tu vas pouvoir ouvrir la boutique en un clic comme une vraie
                application. Suis simplement les 3 etapes ci-dessous.
              </p>
            </div>

            <ol className="ios-steps">
              <li className="ios-step">
                <span className="ios-step-number">1</span>
                <div className="ios-step-body">
                  <strong>Touche le bouton Partager</strong>
                  <p>
                    Le petit carre avec une fleche qui monte, en bas de Safari.
                  </p>
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

            <div className="ios-install-actions">
              <button
                className="button primary full"
                onClick={dismissInstallGuide}
                type="button"
              >
                J&apos;ai compris
              </button>
            </div>

            <p className="ios-install-note">
              Astuce : ouvre ce site dans Safari si tu vois pas le bouton
              Partager. Dans les autres navigateurs il peut etre cache.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
