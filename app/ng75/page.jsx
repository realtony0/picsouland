"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";
const ADMIN_SESSION_KEY = "picsouland_admin_session";

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
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [newPromo, setNewPromo] = useState({
    label: "",
    discountPercent: "",
    brandFilter: "",
    endsAt: "",
  });
  const [notice, setNotice] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "Rodman",
    price: "",
    imageFile: null,
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

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
      const [accRes, ordRes, prodRes, promoRes] = await Promise.all([
        fetch("/api/admin/accounts", { headers: apiHeaders() }),
        fetch("/api/admin/orders", { headers: apiHeaders() }),
        fetch("/api/products"),
        fetch("/api/admin/promotions", { headers: apiHeaders() }),
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

      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }

      if (promoRes.ok) {
        setPromos(await promoRes.json());
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

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "x-admin-pin": adminPin },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload echoue");
    }

    const data = await res.json();
    return data.url;
  }

  async function addProduct(event) {
    event.preventDefault();

    if (!newProduct.name.trim() || !newProduct.brand.trim() || !newProduct.price) {
      setNotice("Nom, marque et prix requis pour ajouter un produit.");
      return;
    }

    setUploading(true);
    setNotice(newProduct.imageFile ? "Upload de la photo..." : "Ajout du produit...");

    try {
      let imageUrl = "";

      if (newProduct.imageFile) {
        try {
          imageUrl = await uploadImage(newProduct.imageFile);
        } catch (uploadErr) {
          setNotice("Upload echoue : " + uploadErr.message);
          setUploading(false);
          return;
        }
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          name: newProduct.name.trim(),
          brand: newProduct.brand.trim(),
          price: Number(newProduct.price),
          image: imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "Erreur lors de l'ajout.");
        return;
      }

      setProducts((prev) => [...prev, data]);
      setNewProduct({ name: "", brand: newProduct.brand, price: "", imageFile: null });
      setNotice(`Produit "${data.name}" ajoute.`);
    } catch (err) {
      setNotice("Erreur : " + (err.message || "reseau indisponible"));
    } finally {
      setUploading(false);
    }
  }

  async function addPromo(event) {
    event.preventDefault();

    if (!newPromo.label || !newPromo.discountPercent || !newPromo.endsAt) {
      setNotice("Nom, pourcentage et date de fin requis.");
      return;
    }

    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          label: newPromo.label,
          discountPercent: Number(newPromo.discountPercent),
          brandFilter: newPromo.brandFilter || null,
          endsAt: new Date(newPromo.endsAt).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "Erreur lors de la creation.");
        return;
      }

      setPromos((prev) => [data, ...prev]);
      setNewPromo({ label: "", discountPercent: "", brandFilter: "", endsAt: "" });
      setNotice(`Promo "${data.label}" creee.`);
    } catch {
      setNotice("Erreur reseau.");
    }
  }

  async function deletePromo(id) {
    try {
      await fetch("/api/admin/promotions", {
        method: "DELETE",
        headers: apiHeaders(),
        body: JSON.stringify({ id }),
      });

      setPromos((prev) => prev.filter((p) => p.id !== id));
      setNotice("Promo supprimee.");
    } catch {
      setNotice("Erreur reseau.");
    }
  }

  async function toggleStock(id, currentStock) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ id, in_stock: currentStock === false }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === data.id ? data : p)),
        );
      }
    } catch {
      setNotice("Erreur reseau.");
    }
  }

  async function deleteProduct(id) {
    const product = products.find((p) => p.id === id);
    const confirmed = window.confirm(
      `Supprimer le produit "${product?.name || id}" ? Cette action est irreversible.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fetch("/api/admin/products", {
        method: "DELETE",
        headers: apiHeaders(),
        body: JSON.stringify({ id }),
      });

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice(`Produit "${product?.name || id}" supprime.`);
    } catch {
      setNotice("Erreur lors de la suppression.");
    }
  }

  const [editingProduct, setEditingProduct] = useState(null);

  function startEditProduct(product) {
    setEditingProduct({ ...product });
  }

  function cancelEditProduct() {
    setEditingProduct(null);
  }

  async function saveEditProduct() {
    if (!editingProduct) {
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingProduct.image;

      if (editingProduct.newImageFile) {
        imageUrl = await uploadImage(editingProduct.newImageFile);
      }

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({
          id: editingProduct.id,
          name: editingProduct.name,
          brand: editingProduct.brand,
          price: Number(editingProduct.price),
          image: imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "Erreur lors de la modification.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === data.id ? data : p)),
      );
      setEditingProduct(null);
      setNotice(`Produit "${data.name}" modifie.`);
    } catch {
      setNotice("Erreur reseau.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmOrder(orderId) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "Erreur lors de la confirmation.");
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "confirmed" } : o,
        ),
      );

      if (data.account) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.phone === data.account.phone
              ? {
                  ...a,
                  points: data.account.points,
                  totalEarned: data.account.total_earned ?? a.totalEarned,
                }
              : a,
          ),
        );
      }

      setNotice(`Commande #${orderId} confirmee. Points credites.`);
    } catch {
      setNotice("Erreur reseau.");
    }
  }

  const pendingOrders = orders.filter((o) => o.status === "pending");

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
  }, [products]);

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
  }, [products, brandFilter, search]);

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

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
          type="button"
        >
          Dashboard
        </button>
        <button
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
          type="button"
        >
          Commandes
          {pendingOrders.length > 0 ? (
            <span className="tab-badge">{pendingOrders.length}</span>
          ) : null}
        </button>
        <button
          className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
          type="button"
        >
          Produits
        </button>
        <button
          className={`admin-tab ${activeTab === "promos" ? "active" : ""}`}
          onClick={() => setActiveTab("promos")}
          type="button"
        >
          Promos
        </button>
        <button
          className={`admin-tab ${activeTab === "clients" ? "active" : ""}`}
          onClick={() => setActiveTab("clients")}
          type="button"
        >
          Clients
        </button>
      </nav>

      {activeTab === "dashboard" ? (
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
      ) : null}

      {activeTab === "clients" ? (
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
      ) : null}

      {activeTab === "promos" ? (
      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Promotions flash</h2>
            <p className="admin-section-copy">
              Cree des promos temporaires. La reduction s&apos;applique automatiquement sur la boutique.
            </p>
          </div>
        </div>

        <form className="admin-add-form" onSubmit={addPromo}>
          <strong>Nouvelle promo</strong>
          <div className="admin-add-fields">
            <input
              onChange={(e) => setNewPromo((p) => ({ ...p, label: e.target.value }))}
              placeholder="Nom (ex : Weekend Rodman)"
              required
              type="text"
              value={newPromo.label}
            />
            <input
              min="1"
              max="99"
              onChange={(e) => setNewPromo((p) => ({ ...p, discountPercent: e.target.value }))}
              placeholder="% (ex : 20)"
              required
              type="number"
              value={newPromo.discountPercent}
            />
            <select
              onChange={(e) => setNewPromo((p) => ({ ...p, brandFilter: e.target.value }))}
              value={newPromo.brandFilter}
            >
              <option value="">Tous les produits</option>
              <option value="Rodman">Rodman uniquement</option>
              <option value="Coolbar">Coolbar uniquement</option>
              <option value="Hyperjoy">Hyperjoy uniquement</option>
            </select>
            <input
              onChange={(e) => setNewPromo((p) => ({ ...p, endsAt: e.target.value }))}
              required
              type="datetime-local"
              value={newPromo.endsAt}
            />
            <button className="button primary" type="submit">
              Creer
            </button>
          </div>
        </form>

        {promos.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Promo</th>
                  <th>Reduction</th>
                  <th>Cible</th>
                  <th>Fin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => {
                  const isActive = new Date(promo.ends_at) > new Date();
                  return (
                    <tr className={isActive ? "" : "row-out-of-stock"} key={promo.id}>
                      <td data-label="Promo">{promo.label}</td>
                      <td data-label="Reduction">
                        <span className="promo-badge">-{promo.discount_percent}%</span>
                      </td>
                      <td data-label="Cible">
                        {promo.brand_filter || "Tout"}
                      </td>
                      <td data-label="Fin">
                        {new Date(promo.ends_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {!isActive ? " (expiree)" : ""}
                      </td>
                      <td data-label="Actions">
                        <button
                          className="button danger small"
                          onClick={() => deletePromo(promo.id)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Aucune promotion active.</p>
        )}
      </section>
      ) : null}

      {activeTab === "products" ? (
      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Catalogue produits</h2>
            <p className="admin-section-copy">
              Ajoute ou supprime des produits. Les changements sont visibles
              immediatement sur la boutique.
            </p>
          </div>
        </div>

        <form className="admin-add-form" onSubmit={addProduct}>
          <strong>Ajouter un produit</strong>
          <div className="admin-add-fields">
            <input
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Nom (ex : Grape Ice)"
              required
              type="text"
              value={newProduct.name}
            />
            <select
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, brand: e.target.value }))
              }
              value={newProduct.brand}
            >
              <option value="Rodman">Rodman</option>
              <option value="Coolbar">Coolbar</option>
              <option value="Hyperjoy">Hyperjoy</option>
            </select>
            <input
              min="1"
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="Prix (ex : 8000)"
              required
              type="number"
              value={newProduct.price}
            />
            <label className="file-upload-label">
              {newProduct.imageFile
                ? newProduct.imageFile.name
                : "Photo du produit"}
              <input
                accept="image/*"
                onChange={(e) =>
                  setNewProduct((p) => ({
                    ...p,
                    imageFile: e.target.files[0] || null,
                  }))
                }
                type="file"
              />
            </label>
            <button
              className="button primary"
              disabled={uploading}
              type="submit"
            >
              {uploading ? "Upload..." : "Ajouter"}
            </button>
          </div>
        </form>

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
            {["all", ...Array.from(new Set(products.map((p) => p.brand)))].map(
              (brand) => (
                <button
                  className={`filter-button ${brandFilter === brand ? "active" : ""}`}
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  type="button"
                >
                  {brand === "all" ? "Tout voir" : brand}
                </button>
              ),
            )}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) =>
                editingProduct && editingProduct.id === product.id ? (
                  <tr className="editing-row" key={product.id}>
                    <td data-label="Produit">
                      <input
                        className="edit-input"
                        onChange={(e) =>
                          setEditingProduct((p) => ({ ...p, name: e.target.value }))
                        }
                        value={editingProduct.name}
                      />
                    </td>
                    <td data-label="Marque">
                      <select
                        className="edit-input"
                        onChange={(e) =>
                          setEditingProduct((p) => ({ ...p, brand: e.target.value }))
                        }
                        value={editingProduct.brand}
                      >
                        <option value="Rodman">Rodman</option>
                        <option value="Coolbar">Coolbar</option>
                        <option value="Hyperjoy">Hyperjoy</option>
                      </select>
                    </td>
                    <td data-label="Prix">
                      <input
                        className="edit-input"
                        min="1"
                        onChange={(e) =>
                          setEditingProduct((p) => ({ ...p, price: e.target.value }))
                        }
                        type="number"
                        value={editingProduct.price}
                      />
                    </td>
                    <td data-label="Actions">
                      <label className="file-upload-label small">
                        {editingProduct.newImageFile
                          ? editingProduct.newImageFile.name
                          : "Changer photo"}
                        <input
                          accept="image/*"
                          onChange={(e) =>
                            setEditingProduct((p) => ({
                              ...p,
                              newImageFile: e.target.files[0] || null,
                            }))
                          }
                          type="file"
                        />
                      </label>
                      <div className="admin-row-actions">
                        <button
                          className="button primary small"
                          disabled={uploading}
                          onClick={saveEditProduct}
                          type="button"
                        >
                          {uploading ? "..." : "OK"}
                        </button>
                        <button
                          className="button secondary small"
                          onClick={cancelEditProduct}
                          type="button"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    className={product.in_stock === false ? "row-out-of-stock" : ""}
                    key={product.id}
                  >
                    <td data-label="Produit">
                      {product.name}
                      {product.in_stock === false ? (
                        <span className="out-of-stock-badge">Rupture</span>
                      ) : null}
                    </td>
                    <td data-label="Marque">
                      <span className="brand-pill" data-brand={product.brand}>
                        {product.brand}
                      </span>
                    </td>
                    <td data-label="Prix">{formatPrice(product.price)}</td>
                    <td data-label="Actions">
                      <div className="admin-row-actions">
                        <button
                          className={`button small ${product.in_stock === false ? "primary" : "secondary"}`}
                          onClick={() => toggleStock(product.id, product.in_stock)}
                          type="button"
                        >
                          {product.in_stock === false ? "Remettre" : "Rupture"}
                        </button>
                        <button
                          className="button secondary small"
                          onClick={() => startEditProduct(product)}
                          type="button"
                        >
                          Modifier
                        </button>
                        <button
                          className="button danger small"
                          onClick={() => deleteProduct(product.id)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
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
      ) : null}

      {activeTab === "orders" ? (
      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>
              Commandes
              {pendingOrders.length > 0 ? (
                <span className="pending-badge">{pendingOrders.length} en attente</span>
              ) : null}
            </h2>
            <p className="admin-section-copy">
              Confirme les commandes pour crediter les Picsou Points aux clients.
            </p>
          </div>
          <div className="admin-section-actions">
            <button className="button secondary" onClick={refreshData} type="button">
              Rafraichir
            </button>
          </div>
        </div>

        {orders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Points</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    className={order.status === "pending" ? "order-pending" : ""}
                    key={order.id}
                  >
                    <td data-label="#">{order.id}</td>
                    <td data-label="Client">
                      {order.account_name || "Anonyme"}
                      {order.account_phone ? (
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {formatPhone(order.account_phone)}
                        </small>
                      ) : null}
                    </td>
                    <td data-label="Articles">
                      {Array.isArray(order.items)
                        ? order.items
                            .map((item) => `${item.brand} ${item.name} x${item.quantity}`)
                            .join(", ")
                        : "-"}
                    </td>
                    <td data-label="Total">{formatPrice(order.grand_total)}</td>
                    <td data-label="Points">
                      {order.points_earned > 0 ? (
                        <span className="points-chip">+{order.points_earned}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td data-label="Statut">
                      {order.status === "confirmed" ? (
                        <span className="status-chip status-active">Confirmee</span>
                      ) : (
                        <span className="status-chip status-pending">En attente</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      {order.status === "pending" ? (
                        <button
                          className="button primary small"
                          onClick={() => confirmOrder(order.id)}
                          type="button"
                        >
                          Confirmer
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("fr-FR")
                            : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Aucune commande enregistree.</p>
        )}
      </section>
      ) : null}

      <footer className="admin-footer">
        <p>
          Admin PicsouLand - les donnees sont stockees dans la base de donnees
          PostgreSQL (Neon) et partagees entre tous les appareils.
        </p>
      </footer>
    </main>
  );
}
