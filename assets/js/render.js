/* =========================================================
   Settimo Hub — render.js
   Helper di presentazione (template/formatter)
   Espone window.RENDER senza toccare la logica dell’app
   ========================================================= */

/* ---------- Utility base ---------- */
function _el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") node.className = v;
    else if (k === "dataset" && v && typeof v === "object") {
      Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv));
    } else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.substring(2).toLowerCase(), v);
    } else {
      node.setAttribute(k, v);
    }
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

function _fmtPrice(value) {
  const n = Number(value || 0);
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _chip(text) {
  return _el("span", {
    className: "inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
  }, text);
}

/* ---------- Componenti / Template ---------- */

/**
 * Bottone categoria (card compatta)
 * @param {string} nomeCategoria
 * @param {function} onClick
 * @returns {HTMLButtonElement}
 */
function createCategoryButton(nomeCategoria, onClick) {
  const btn = _el("button", {
    className: "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
  }, [
    _el("p", { className: "text-sm font-semibold" }, nomeCategoria),
    _el("p", { className: "text-xs text-slate-600" }, "Scopri")
  ]);
  if (typeof onClick === "function") btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Card negozio per griglia home
 * @param {object} shop  // { id, nome, descrizione, categoria }
 * @param {function} onOpen  // callback all click su “Apri”
 * @returns {HTMLElement}
 */
function createShopCard(shop, onOpen) {
  const card = _el("article", {
    className: "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4",
    dataset: { category: shop.categoria || "", name: (shop.nome || "").toLowerCase() }
  }, [
    _el("div", { className: "aspect-video rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 border mb-3" }),
    _el("h3", { className: "font-semibold" }, shop.nome || ""),
    _el("p", { className: "text-sm text-slate-600" }, shop.descrizione || ""),
    _el("div", { className: "mt-3 flex items-center justify-between text-xs" }, [
      _chip(shop.categoria || ""),
      _el("button", { className: "px-3 py-1.5 rounded-lg bg-emerald-600 text-white" }, "Apri")
    ])
  ]);

  const btn = card.querySelector("button");
  if (btn && typeof onOpen === "function") {
    btn.addEventListener("click", () => onOpen(shop));
  }

  return card;
}

/**
 * Card prodotto/servizio nella pagina negozio
 * @param {object} product // { nome, unita, prezzo }
 * @param {string} shopPhoneE164  // telefono del negozio in formato E.164
 * @param {function} buildWhatsAppLink // funzione util per creare link wa.me
 * @returns {HTMLElement}
 */
function createProductCard(product, shopPhoneE164, buildWhatsAppLink) {
  const card = _el("article", {
    className: "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4"
  }, [
    _el("div", { className: "aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border mb-3" }),
    _el("h3", { className: "font-semibold" }, product.nome || ""),
    _el("p", { className: "text-sm text-slate-600" }, product.unita || ""),
    _el("div", { className: "mt-3 flex items-center justify-between text-sm" }, [
      _el("span", { className: "font-semibold" }, `€ ${_fmtPrice(product.prezzo)}`),
      _el("a", {
        className: "px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm",
        target: "_blank",
        rel: "noopener",
        href: buildWhatsAppLink ? buildWhatsAppLink(shopPhoneE164, `Ciao! Ti contatto da Settimo Hub per "${product.nome}" (${product.unita || ""}).`) : "#"
      }, "Scrivi su WhatsApp")
    ])
  ]);
  return card;
}

/* ---------- API globale ---------- */
window.RENDER = {
  el: _el,
  chip: _chip,
  formatPrice: _fmtPrice,
  createCategoryButton,
  createShopCard,
  createProductCard
};
