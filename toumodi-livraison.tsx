import React, { useState, useMemo, useRef } from "react";
import { Flame, MapPin, Clock, Plus, Minus, ChevronLeft, Bike, CheckCircle2, ShoppingBag, User, Package } from "lucide-react";

// ---------------------------------------------------------------------------
// Données — Toumodi, ville-carrefour connue pour son poulet braisé au rond-point
// ---------------------------------------------------------------------------
const QUARTIERS = ["Centre-ville", "Carrefour", "N'zuessy", "Kokrenou", "Andokoi"];

const MAQUIS = [
  {
    id: "meme",
    nom: "Chez Mémé Poulet",
    quartier: "Carrefour",
    specialite: "Poulet braisé",
    temps: "20-30 min",
    emoji: "🍗",
    plats: [
      { id: "m1", nom: "Poulet braisé entier", prix: 6000 },
      { id: "m2", nom: "Demi poulet braisé", prix: 3500 },
      { id: "m3", nom: "Alloco (portion)", prix: 1000 },
      { id: "m4", nom: "Piment + oignon", prix: 500 },
    ],
  },
  {
    id: "carrefour",
    nom: "Maquis Le Carrefour",
    quartier: "Carrefour",
    specialite: "Grillades & braise",
    temps: "25-35 min",
    emoji: "🔥",
    plats: [
      { id: "c1", nom: "Brochettes de bœuf (5)", prix: 2500 },
      { id: "c2", nom: "Poisson braisé", prix: 3000 },
      { id: "c3", nom: "Attiéké poisson", prix: 2000 },
      { id: "c4", nom: "Bissap glacé", prix: 500 },
    ],
  },
  {
    id: "marche",
    nom: "Attiéké Marché Central",
    quartier: "Centre-ville",
    specialite: "Attiéké & garba",
    temps: "15-20 min",
    emoji: "🍚",
    plats: [
      { id: "a1", nom: "Garba (thon + attiéké)", prix: 500 },
      { id: "a2", nom: "Attiéké + poulet fumé", prix: 1500 },
      { id: "a3", nom: "Sauce graine + riz", prix: 1000 },
    ],
  },
  {
    id: "kokrenou",
    nom: "Chez Tantie Kokrenou",
    quartier: "Kokrenou",
    specialite: "Cuisine maison",
    temps: "20-30 min",
    emoji: "🍲",
    plats: [
      { id: "k1", nom: "Kedjenou de poulet", prix: 2500 },
      { id: "k2", nom: "Foutou banane + sauce", prix: 2000 },
      { id: "k3", nom: "Jus de gingembre", prix: 500 },
    ],
  },
];

const ETAPES = ["Commande reçue", "En préparation", "Sur la braise", "En route", "Livrée"];

const fmt = (n) => n.toLocaleString("fr-FR") + " F";

// ---------------------------------------------------------------------------
// Jauge de braise — élément signature : la progression se lit comme des braises
// qui s'allument une à une, en écho au poulet braisé de Toumodi.
// ---------------------------------------------------------------------------
function JaugeBraise({ etapeIndex }) {
  return (
    <div className="braise-jauge">
      {ETAPES.slice(1).map((etape, i) => {
        const actif = i <= etapeIndex - 1;
        const courant = i === etapeIndex - 1;
        return (
          <div key={etape} className="braise-item">
            <div className={`braise-dot ${actif ? "actif" : ""} ${courant ? "courant" : ""}`}>
              <Flame size={13} strokeWidth={2.5} />
            </div>
            <span className={`braise-label ${actif ? "actif" : ""}`}>{etape}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ToumodiLivraison() {
  const [mode, setMode] = useState("client"); // 'client' | 'livreur'
  const [vue, setVue] = useState("accueil"); // accueil | menu | commande | suivi
  const [maquisActif, setMaquisActif] = useState(null);
  const [panier, setPanier] = useState({});
  const [quartier, setQuartier] = useState(QUARTIERS[0]);
  const [orders, setOrders] = useState([]);
  const orderIdRef = useRef(1);

  const totalPanier = useMemo(() => {
    if (!maquisActif) return 0;
    return Object.entries(panier).reduce((sum, [id, qte]) => {
      const plat = maquisActif.plats.find((p) => p.id === id);
      return plat ? sum + plat.prix * qte : sum;
    }, 0);
  }, [panier, maquisActif]);

  const nbArticles = Object.values(panier).reduce((a, b) => a + b, 0);

  function ouvrirMaquis(m) {
    setMaquisActif(m);
    setPanier({});
    setVue("menu");
  }

  function ajuster(id, delta) {
    setPanier((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  function passerCommande() {
    const lignes = Object.entries(panier).map(([id, qte]) => {
      const plat = maquisActif.plats.find((p) => p.id === id);
      return { nom: plat.nom, qte, prix: plat.prix };
    });
    const nouvelle = {
      id: orderIdRef.current++,
      maquis: maquisActif.nom,
      emoji: maquisActif.emoji,
      quartier,
      lignes,
      total: totalPanier,
      etapeIndex: 1,
      heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setOrders((prev) => [nouvelle, ...prev]);
    setPanier({});
    setVue("suivi");
  }

  function avancerEtape(orderId) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, etapeIndex: Math.min(o.etapeIndex + 1, ETAPES.length - 1) } : o
      )
    );
  }

  const commandesClient = orders;
  const commandesLivreur = orders;

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

        * { box-sizing: border-box; }
        .app-shell {
          --charcoal: #17140F;
          --charcoal-2: #221D17;
          --charcoal-3: #2C2519;
          --ember: #E85D2C;
          --ember-dim: #7A3620;
          --gold: #E9B44C;
          --cream: #F5EEE3;
          --route: #6B8F5C;
          --route-dim: #3A4A34;
          font-family: 'Work Sans', sans-serif;
          background: var(--charcoal);
          color: var(--cream);
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
          padding-bottom: 90px;
          overflow-x: hidden;
        }
        .display { font-family: 'Anton', sans-serif; letter-spacing: 0.01em; text-transform: uppercase; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* Badge toggle client/livreur */
        .badge-toggle {
          display: flex; gap: 6px; padding: 14px 16px 8px;
          position: sticky; top: 0; z-index: 20; background: var(--charcoal);
          border-bottom: 1px solid rgba(245,238,227,0.08);
        }
        .badge-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 10px; border-radius: 999px; border: 1.5px solid rgba(245,238,227,0.15);
          background: transparent; color: rgba(245,238,227,0.55); font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all 0.2s ease;
        }
        .badge-btn.actif.client { background: var(--ember); border-color: var(--ember); color: var(--charcoal); }
        .badge-btn.actif.livreur { background: var(--route); border-color: var(--route); color: var(--charcoal); }

        .header-hero {
          padding: 18px 18px 14px;
        }
        .eyebrow { font-size: 11px; letter-spacing: 0.14em; color: var(--gold); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
        .titre-ville { font-size: 34px; line-height: 0.95; color: var(--cream); }
        .titre-ville span { color: var(--ember); }
        .sous-titre { font-size: 13px; color: rgba(245,238,227,0.6); margin-top: 6px; }

        .liste-maquis { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
        .maquis-card {
          background: var(--charcoal-2); border-radius: 14px; padding: 14px;
          display: flex; gap: 12px; align-items: center; cursor: pointer;
          border: 1px solid rgba(245,238,227,0.06); transition: border-color 0.15s ease;
        }
        .maquis-card:active { border-color: var(--ember); }
        .maquis-emoji { font-size: 30px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
          background: var(--charcoal-3); border-radius: 10px; flex-shrink: 0; }
        .maquis-nom { font-weight: 700; font-size: 15px; color: var(--cream); }
        .maquis-meta { font-size: 12px; color: rgba(245,238,227,0.55); margin-top: 3px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .maquis-meta .item { display: flex; align-items: center; gap: 3px; }

        /* Menu view */
        .topbar { display: flex; align-items: center; gap: 10px; padding: 14px 16px; position: sticky; top: 0; background: var(--charcoal); z-index: 15; }
        .back-btn { background: var(--charcoal-2); border: none; color: var(--cream); width: 34px; height: 34px; border-radius: 999px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .topbar-titre { font-weight: 700; font-size: 15px; }
        .topbar-sub { font-size: 11px; color: rgba(245,238,227,0.5); }

        .plat-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(245,238,227,0.06); }
        .plat-nom { font-size: 14px; font-weight: 600; color: var(--cream); }
        .plat-prix { font-size: 12.5px; color: var(--gold); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .qte-ctrl { display: flex; align-items: center; gap: 10px; }
        .qte-btn { width: 28px; height: 28px; border-radius: 8px; border: none; background: var(--charcoal-3); color: var(--cream); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .qte-btn.plus { background: var(--ember); color: var(--charcoal); }
        .qte-val { min-width: 16px; text-align: center; font-weight: 700; font-size: 13px; }

        .panier-bar {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px;
          background: var(--ember); color: var(--charcoal); padding: 14px 18px;
          display: flex; align-items: center; justify-content: space-between; cursor: pointer;
          font-weight: 700; box-shadow: 0 -4px 16px rgba(0,0,0,0.3); z-index: 25;
        }

        /* Checkout */
        .section-pad { padding: 16px; }
        .label-petit { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(245,238,227,0.5); margin-bottom: 8px; font-weight: 600; }
        .quartier-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .quartier-chip { padding: 8px 14px; border-radius: 999px; border: 1.5px solid rgba(245,238,227,0.15); background: transparent; color: var(--cream); font-size: 13px; cursor: pointer; }
        .quartier-chip.actif { background: var(--gold); border-color: var(--gold); color: var(--charcoal); font-weight: 700; }
        .recap-ligne { display: flex; justify-content: space-between; font-size: 13.5px; padding: 7px 0; color: rgba(245,238,227,0.85); }
        .recap-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding: 12px 0; border-top: 1px solid rgba(245,238,227,0.12); margin-top: 6px; color: var(--gold); }
        .cta-btn { width: 100%; background: var(--ember); color: var(--charcoal); border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 14.5px; cursor: pointer; margin-top: 8px; }

        /* Suivi de commande */
        .commande-card { background: var(--charcoal-2); border-radius: 14px; padding: 16px; margin-bottom: 14px; border: 1px solid rgba(245,238,227,0.06); }
        .commande-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .commande-maquis { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; }
        .commande-id { font-size: 11px; color: rgba(245,238,227,0.4); }

        .braise-jauge { display: flex; flex-direction: column; gap: 10px; margin: 10px 0 4px; }
        .braise-item { display: flex; align-items: center; gap: 10px; }
        .braise-dot { width: 24px; height: 24px; border-radius: 999px; background: var(--charcoal-3); color: rgba(245,238,227,0.25);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s ease; }
        .braise-dot.actif { background: var(--ember-dim); color: var(--gold); }
        .braise-dot.courant { background: var(--ember); color: var(--charcoal); box-shadow: 0 0 0 4px rgba(232,93,44,0.2); animation: pulse 1.6s infinite; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 4px rgba(232,93,44,0.2); } 50% { box-shadow: 0 0 0 7px rgba(232,93,44,0.08); } }
        .braise-label { font-size: 12.5px; color: rgba(245,238,227,0.4); }
        .braise-label.actif { color: var(--cream); font-weight: 600; }

        /* Livreur mode */
        .livreur-header { padding: 18px 16px 10px; }
        .liv-card { background: var(--charcoal-2); border-radius: 14px; padding: 14px; margin: 0 16px 12px; border: 1px solid rgba(245,238,227,0.06); }
        .liv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .liv-adresse { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--route); font-weight: 600; }
        .liv-lignes { font-size: 12px; color: rgba(245,238,227,0.6); margin: 6px 0 10px; }
        .liv-action { width: 100%; padding: 11px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; }
        .liv-action.route { background: var(--route); color: var(--charcoal); }
        .liv-action.done { background: rgba(245,238,227,0.08); color: rgba(245,238,227,0.4); }
        .vide { text-align: center; padding: 60px 24px; color: rgba(245,238,227,0.4); font-size: 13.5px; }
        .vide-icon { margin-bottom: 12px; opacity: 0.5; }
      `}</style>

      <div className="badge-toggle">
        <button
          className={`badge-btn client ${mode === "client" ? "actif" : ""}`}
          onClick={() => { setMode("client"); setVue("accueil"); }}
        >
          <User size={14} /> Client
        </button>
        <button
          className={`badge-btn livreur ${mode === "livreur" ? "actif" : ""}`}
          onClick={() => setMode("livreur")}
        >
          <Bike size={14} /> Livreur
        </button>
      </div>

      {mode === "client" && vue === "accueil" && (
        <>
          <div className="header-hero">
            <div className="eyebrow">Rond-point du poulet braisé</div>
            <h1 className="titre-ville display">Toumodi<span>.</span></h1>
            <p className="sous-titre">Les maquis et grilloirs de la ville, livrés chez toi.</p>
          </div>
          <div className="liste-maquis">
            {MAQUIS.map((m) => (
              <div key={m.id} className="maquis-card" onClick={() => ouvrirMaquis(m)}>
                <div className="maquis-emoji">{m.emoji}</div>
                <div>
                  <div className="maquis-nom">{m.nom}</div>
                  <div className="maquis-meta">
                    <span className="item">{m.specialite}</span>
                    <span className="item"><MapPin size={11} /> {m.quartier}</span>
                    <span className="item"><Clock size={11} /> {m.temps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orders.length > 0 && (
            <div className="section-pad" style={{ paddingTop: 0 }}>
              <button className="cta-btn" style={{ background: "var(--charcoal-2)", color: "var(--cream)", border: "1px solid rgba(245,238,227,0.15)" }} onClick={() => setVue("suivi")}>
                Suivre mes commandes ({orders.length})
              </button>
            </div>
          )}
        </>
      )}

      {mode === "client" && vue === "menu" && maquisActif && (
        <>
          <div className="topbar">
            <button className="back-btn" onClick={() => setVue("accueil")}><ChevronLeft size={18} /></button>
            <div>
              <div className="topbar-titre">{maquisActif.emoji} {maquisActif.nom}</div>
              <div className="topbar-sub">{maquisActif.quartier} · {maquisActif.temps}</div>
            </div>
          </div>
          <div>
            {maquisActif.plats.map((p) => (
              <div className="plat-row" key={p.id}>
                <div>
                  <div className="plat-nom">{p.nom}</div>
                  <div className="plat-prix">{fmt(p.prix)}</div>
                </div>
                <div className="qte-ctrl">
                  <button className="qte-btn" onClick={() => ajuster(p.id, -1)}><Minus size={14} /></button>
                  <span className="qte-val">{panier[p.id] || 0}</span>
                  <button className="qte-btn plus" onClick={() => ajuster(p.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          {nbArticles > 0 && (
            <div className="panier-bar" onClick={() => setVue("commande")}>
              <span>{nbArticles} article{nbArticles > 1 ? "s" : ""}</span>
              <span>{fmt(totalPanier)} · Commander →</span>
            </div>
          )}
        </>
      )}

      {mode === "client" && vue === "commande" && maquisActif && (
        <>
          <div className="topbar">
            <button className="back-btn" onClick={() => setVue("menu")}><ChevronLeft size={18} /></button>
            <div className="topbar-titre">Finaliser la commande</div>
          </div>
          <div className="section-pad">
            <div className="label-petit">Livrer au quartier</div>
            <div className="quartier-grid">
              {QUARTIERS.map((q) => (
                <button key={q} className={`quartier-chip ${quartier === q ? "actif" : ""}`} onClick={() => setQuartier(q)}>
                  {q}
                </button>
              ))}
            </div>
            <div className="label-petit">Récapitulatif</div>
            {Object.entries(panier).map(([id, qte]) => {
              const plat = maquisActif.plats.find((p) => p.id === id);
              return (
                <div className="recap-ligne" key={id}>
                  <span>{qte} × {plat.nom}</span>
                  <span className="mono">{fmt(plat.prix * qte)}</span>
                </div>
              );
            })}
            <div className="recap-total">
              <span>Total</span>
              <span className="mono">{fmt(totalPanier)}</span>
            </div>
            <button className="cta-btn" onClick={passerCommande}>Confirmer la commande</button>
          </div>
        </>
      )}

      {mode === "client" && vue === "suivi" && (
        <>
          <div className="topbar">
            <button className="back-btn" onClick={() => setVue("accueil")}><ChevronLeft size={18} /></button>
            <div className="topbar-titre">Mes commandes</div>
          </div>
          <div className="section-pad">
            {commandesClient.length === 0 && (
              <div className="vide">
                <ShoppingBag className="vide-icon" size={32} />
                <div>Aucune commande pour le moment.</div>
              </div>
            )}
            {commandesClient.map((o) => (
              <div className="commande-card" key={o.id}>
                <div className="commande-head">
                  <div>
                    <div className="commande-maquis">{o.emoji} {o.maquis}</div>
                    <div className="commande-id mono">#{String(o.id).padStart(3, "0")} · {o.heure} · {o.quartier}</div>
                  </div>
                  <div className="mono" style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13 }}>{fmt(o.total)}</div>
                </div>
                <JaugeBraise etapeIndex={o.etapeIndex} />
              </div>
            ))}
          </div>
        </>
      )}

      {mode === "livreur" && (
        <>
          <div className="livreur-header">
            <div className="eyebrow" style={{ color: "var(--route)" }}>Espace livreur</div>
            <h1 className="titre-ville display" style={{ fontSize: 26 }}>Courses en cours</h1>
          </div>
          {commandesLivreur.length === 0 && (
            <div className="vide">
              <Package className="vide-icon" size={32} />
              <div>Aucune course à livrer pour l'instant.</div>
            </div>
          )}
          {commandesLivreur.map((o) => {
            const termine = o.etapeIndex >= ETAPES.length - 1;
            const prochaine = ETAPES[o.etapeIndex + 1] || null;
            return (
              <div className="liv-card" key={o.id}>
                <div className="liv-top">
                  <div className="commande-maquis">{o.emoji} {o.maquis}</div>
                  <div className="commande-id mono">#{String(o.id).padStart(3, "0")}</div>
                </div>
                <div className="liv-adresse"><MapPin size={12} /> {o.quartier}</div>
                <div className="liv-lignes">{o.lignes.map((l) => `${l.qte}× ${l.nom}`).join(", ")}</div>
                <div style={{ marginBottom: 10, fontSize: 12, color: "rgba(245,238,227,0.5)" }}>
                  Étape actuelle : <strong style={{ color: "var(--cream)" }}>{ETAPES[o.etapeIndex]}</strong>
                </div>
                {!termine ? (
                  <button className="liv-action route" onClick={() => avancerEtape(o.id)}>
                    Marquer « {prochaine} »
                  </button>
                ) : (
                  <button className="liv-action done" disabled>
                    <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Livrée
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
