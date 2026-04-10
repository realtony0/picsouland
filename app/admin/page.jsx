"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";
const ADMIN_SESSION_KEY = "picsouland_admin_session";

const products = [
  { id: "rodman-allstar", name: "All Star", brand: "Rodman", price: 8000 },
  { id: "rodman-buzzerbeater", name: "Buzzer Beater", brand: "Rodman", price: 8000 },
  { id: "rodman-coolmint", name: "Cool Mint", brand: "Rodman", price: 8000 },
  { id: "rodman-peach-berry", name: "Peach Berry", brand: "Rodman", price: 8000 },
  { id: "rodman-pineapple-banana-ice", name: "Pineapple Banana Ice", brand: "Rodman", price: 8000 },
  { id: "rodman-red-bull", name: "Red Bull", brand: "Rodman", price: 8000 },
  { id: "coolbar-cola-ice", name: "Cola Ice", brand: "Coolbar", price: 7000 },
  { id: "coolbar-mix-berry", name: "Mix Berry", brand: "Coolbar", price: 7000 },
  { id: "coolbar-peach-ice", name: "Peach Ice", brand: "Coolbar", price: 7000 },
  { id: "coolbar-watermelon", name: "Watermelon", brand: "Coolbar", price: 7000 },
  { id: "hyperjoy-blue-razz", name: "Blue Razz", brand: "Hyperjoy", price: 8000 },
  { id: "hyperjoy-kiwi-passion-fruit-guava", name: "Kiwi Passion Fruit Guava", brand: "Hyperjoy", price: 8000 },
  { id: "hyperjoy-triple-berry", name: "Triple Berry", brand: "Hyperjoy", price: 8000 },
  { id: "hyperjoy-vimto", name: "Vimto", brand: "Hyperjoy", price: 8000 },
  { id: "hyperjoy-watermelon-bubble-gum", name: "Watermelon Bubble Gum", brand: "Hyperjoy", price: 8000 },
  { id: "hyperjoy-watermelon-ice", name: "Watermelon Ice", brand: "Hyperjoy", price: 8000 },
];

const formatter = new Intl.NumberFormat("fr-FR");

function formatPrice(value) {
  return `${formatter.format(value)} F CFA`;
}

function formatPhone(value) {
  const phone = (value || "").replace(/\D/g, "");

  if (!/^7\d{8}$/.test(phone)) {
    return value;
  }

  return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)}`;
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notice, setNotice] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedAdmin = window.sessionStorage.getItem(ADMIN_SESSION_KEY);

    if (savedAdmin) {
      setAdminPin(savedAdmin);
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    refreshData();
  }, [isAuthed]);

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      "x-admin-pin": adminPin,
    };
  }

  async function refreshData() {
    try {
      const [accRes, ordRes] = await Promise.all([
        fetch("/api/admin/accounts", { headers: apiHeaders() }),
        fetch("/api/admin/orders", { headers: apiHeaders() }),
      ]);

      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(
          data.map((row) => ({
            ...row,
            points: row.points ?? 0,
            totalEarned: row.total_earned ?? 0,
          })),
        );
      }

      if (ordRes.ok) {
        setOrders(await ordRes.json());
      }
    } catch {
      setNotice("Erreur de chargement des donnees.");
    }
  }

  function handleLogin(event) {
    event.preventDefault();

    if (pinInput.trim() === ADMIN_PIN) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, pinInput.trim());
      setAdminPin(pinInput.trim());
      setIsAuthed(true);
      setAuthError("");
      setPinInput("");
      return;
    }

    setAuthError("Code PIN incorrect.");
    setPinInput("");
  }

  function handleLogout() {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthed(false);
    setAdminPin("");
    setNotice("");
  }

  async function deleteAccount(phone) {
    const confirmed = window.confirm(
      `Supprimer le compte ${formatPhone(phone)} ? Cette action est irreversible.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fetch("/api/admin/accounts", {
        method: "DELETE",
        headers: apiHeaders(),
        body: JSON.stringify({ phone }),
      });

      setAccounts((prev) => prev.filter((a) => a.phone !== phone));
      setNotice(`Compte ${formatPhone(phone)} supprime.`);
    } catch {
      setNotice("Erreur lors de la suppression.");
    }
  }

  async function adjustPoints(phone) {
    const account = accounts.find((entry) => entry.phone === phone);

    if (!account) {
      return;
    }

    const input = window.prompt(
      `Picsou Points pour ${account.name}\nUtilise + ou - pour ajouter/retirer (ex : +50, -10) ou entre un nombre pour fixer le solde.`,
      "+10",
    );

    if (input === null) {
      return;
    }

    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    const isDelta = trimmed.startsWith("+") || trimmed.startsWith("-");
    const parsed = Number(trimmed);

    if (Number.isNaN(parsed)) {
      window.alert("Valeur invalide.");
      return;
    }

    try {
      const body = isDelta
        ? { phone, pointsDelta: parsed }
        : { phone, pointsAbsolute: parsed };

      const res = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setNotice("Erreur lors de la mise a jour.");
        return;
      }

      const updated = await res.json();
      setAccounts((prev) =>
        prev.map((a) =>
          a.phone === phone
            ? { ...a, points: updated.points, totalEarned: updated.total_earned ?? a.totalEarned }
            : a,
        ),
      );
      setNotice(`${account.name} : solde mis a jour (${updated.points} pts).`);
    } catch {
      setNotice("Erreur reseau.");
    }
  }

  const productStats = useMemo(() => {
    const stats = {};

    for (const product of products) {
      if (!stats[product.brand]) {
        stats[product.brand] = { count: 0, minPrice: product.price, maxPrice: product.price };
      }

      stats[product.brand].count += 1;
      stats[product.brand].minPrice = Math.min(stats[product.brand].minPrice, product.price);
      stats[product.brand].maxPrice = Math.max(stats[product.brand].maxPrice, product.price);
    }

    return stats;
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchBrand = brandFilter === "all" || product.brand === brandFilter;
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q);

      return matchBrand && matchSearch;
    });
  }, [brandFilter, search]);

  if (!isAuthed) {
    return (
      <main className="admin-gate">
        <section className="admin-gate-card">
          <span className="gate-badge">Espace admin</span>
          <h1>PicsouLand admin</h1>
          <p className="admin-gate-copy">
            Entre le code PIN administrateur pour acceder au tableau de bord.
          </p>
          <form className="admin-gate-form" onSubmit={handleLogin}>
            <label>
              Code PIN administrateur
              <input
                autoFocus
                inputMode="numeric"
                onChange={(event) => {
                  setPinInput(event.target.value);
                  setAuthError("");
                }}
                placeholder="****"
                type="password"
                value={pinInput}
              />
            </label>
            <button className="button primary full" type="submit">
              Entrer
            </button>
            {authError ? <p className="admin-error">{authError}</p> : null}
          </form>
          <p className="admin-gate-hint">
            Retour a la <a href="/">boutique</a>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h1>Admin PicsouLand</h1>
          <p className="admin-subtitle">
            Gestion des comptes clients et du catalogue.
          </p>
        </div>
        <div className="admin-header-actions">
          <a className="button secondary" href="/">
            Voir la boutique
          </a>
          <button className="button primary" onClick={handleLogout} type="button">
            Deconnexion
          </button>
        </div>
      </header>

      {notice ? <p className="admin-notice">{notice}</p> : null}

      <section className="admin-stats">
        <article className="stat-card">
          <span className="stat-label">Comptes clients</span>
          <strong className="stat-value">{accounts.length}</strong>
          <span className="stat-hint">memorises sur cet appareil</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Picsou Points en circulation</span>
          <strong className="stat-value">
            {accounts.reduce(
              (sum, account) =>
                sum + (typeof account.points === "number" ? account.points : 0),
              0,
            )}
          </strong>
          <span className="stat-hint">
            {accounts.reduce(
              (sum, account) =>
                sum +
                (typeof account.totalEarned === "number"
                  ? account.totalEarned
                  : 0),
              0,
            )}{" "}
            cumules depuis l&apos;ouverture
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Produits au catalogue</span>
          <strong className="stat-value">{products.length}</strong>
          <span className="stat-hint">{Object.keys(productStats).length} marques</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Commandes</span>
          <strong className="stat-value">{orders.length}</strong>
          <span className="stat-hint">enregistrees dans la base</span>
        </article>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Comptes clients</h2>
            <p className="admin-section-copy">
              Tous les comptes clients enregistres dans la base de donnees.
              Les donnees sont partagees entre tous les appareils.
            </p>
          </div>
          <div className="admin-section-actions">
            <button className="button secondary" onClick={refreshData} type="button">
              Rafraichir
            </button>
          </div>
        </div>

        {accounts.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Telephone</th>
                  <th>Points</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.phone}>
                    <td data-label="Nom">{account.name}</td>
                    <td data-label="Telephone">{formatPhone(account.phone)}</td>
                    <td data-label="Points">
                      <span className="points-chip">
                        {typeof account.points === "number" ? account.points : 0} pts
                      </span>
                    </td>
                    <td data-label="Inscrit le">
                      {account.created_at
                        ? new Date(account.created_at).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td data-label="Actions">
                      <div className="admin-row-actions">
                        <button
                          className="button secondary small"
                          onClick={() => adjustPoints(account.phone)}
                          type="button"
                        >
                          Points
                        </button>
                        <button
                          className="button danger small"
                          onClick={() => deleteAccount(account.phone)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            Aucun compte client memorise sur cet appareil.
          </p>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Catalogue produits</h2>
            <p className="admin-section-copy">
              Vue d&apos;ensemble du catalogue. Les prix et produits sont definis dans
              le code source (app/page.jsx).
            </p>
          </div>
        </div>

        <div className="admin-brand-stats">
          {Object.entries(productStats).map(([brand, info]) => (
            <article className="brand-stat" key={brand}>
              <span className="stat-label">{brand}</span>
              <strong>{info.count} produits</strong>
              <span className="stat-hint">
                {info.minPrice === info.maxPrice
                  ? formatPrice(info.minPrice)
                  : `${formatPrice(info.minPrice)} - ${formatPrice(info.maxPrice)}`}
              </span>
            </article>
          ))}
        </div>

        <div className="admin-filters">
          <div className="admin-filter-buttons">
            {["all", "Rodman", "Coolbar", "Hyperjoy"].map((brand) => (
              <button
                className={`filter-button ${brandFilter === brand ? "active" : ""}`}
                key={brand}
                onClick={() => setBrandFilter(brand)}
                type="button"
              >
                {brand === "all" ? "Tout voir" : brand}
              </button>
            ))}
          </div>
          <input
            className="admin-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit..."
            type="search"
            value={search}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Marque</th>
                <th>Prix</th>
                <th>Identifiant</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td data-label="Produit">{product.name}</td>
                  <td data-label="Marque">
                    <span className="brand-pill" data-brand={product.brand}>
                      {product.brand}
                    </span>
                  </td>
                  <td data-label="Prix">{formatPrice(product.price)}</td>
                  <td data-label="Identifiant">
                    <code>{product.id}</code>
                  </td>
                </tr>
              ))}
              {!filteredProducts.length ? (
                <tr>
                  <td colSpan={4}>
                    <p className="admin-empty">Aucun produit ne correspond.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="admin-footer">
        <p>
          Admin PicsouLand - les donnees sont stockees dans la base de donnees
          PostgreSQL (Neon) et partagees entre tous les appareils.
        </p>
      </footer>
    </main>
  );
}
