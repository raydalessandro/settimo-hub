/* =========================================================
   Settimo Hub — app.js
   Router, caricamento dati, filtri e azioni globali
   ========================================================= */

const STATE = {
  comuni: [],           // elenco comuni (da comuni.json)
  comuneSelezionato: null,
  shops: [],            // negozi del comune selezionato
  filtroTesto: "",
  filtroCategoria: ""
};

/* ------------------------ Utils ------------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function scrollToSelector(sel) {
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function buildWhatsAppLink(phoneE164, message) {
  const number = (phoneE164 || "").replace(/\s+/g, "");
  const text = encodeURIComponent(message || "Ciao! Ti contatto da Settimo Hub 👋");
  return `https://wa.me/${number.replace(/^\+/, "")}?text=${text}`;
}

function buildMapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
}

/* ------------------------ Router ------------------------ */
window.addEventListener("hashchange", route);
document.addEventListener("DOMContentLoaded", init);

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/shop\/([a-z0-9-]+)/i);
  if (match) {
    const shopId = match[1];
    renderShopViewById(shopId);
  } else {
    renderHomeView();
  }
}

/* ------------------------ Init ------------------------ */
async function init() {
  bindGlobalUI();
  await loadComuni();
  await selectComune(STATE.comuni?.[0]?.id); // pre-seleziona primo comune
  $("#year").textContent = new Date().getFullYear();
  route();
}

/* ------------------------ Bind UI ------------------------ */
function bindGlobalUI() {
  // Menu mobile toggle
  const menuBtn = $("#menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      $("#mobileMenu")?.classList.toggle("hidden");
    });
  }

  // Link con data-scroll
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("[data-scroll]");
    if (link) {
      e.preventDefault();
      scrollToSelector(link.getAttribute("data-scroll"));
    }
  });

  // Bottoni cerca/reset
  $("#btnSearch")?.addEventListener("click", () => {
    STATE.filtroTesto = ($("#search").value || "").trim().toLowerCase();
    applyFilters();
    scrollToSelector("#negozi");
  });
  $("#btnReset")?.addEventListener("click", () => {
    $("#search").value = "";
    STATE.filtroTesto = "";
    STATE.filtroCategoria = "";
    applyFilters();
  });

  // Ricerca live on Enter
  $("#search")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      STATE.filtroTesto = ($("#search").value || "").trim().toLowerCase();
      applyFilters();
      scrollToSelector("#negozi");
    }
  });

  // Selezione comune
  $("#comuneSelect")?.addEventListener("change", async (e) => {
    await selectComune(e.target.value);
    renderHomeView(); // re-render
  });

  // “Vedi tutte” categorie
  $("#btnAllCats")?.addEventListener("click", () => {
    STATE.filtroCategoria = "";
    applyFilters();
  });
}

/* ------------------------ Data loading ------------------------ */
async function loadComuni() {
  const res = await fetch("data/comuni.json");
  const comuni = await res.json();
  STATE.comuni = comuni || [];

  // Popola select
  const sel = $("#comuneSelect");
  if (sel) {
    sel.innerHTML = STATE.comuni
      .map((c) => `<option value="${c.id}">${c.nome}</option>`)
      .join("");
  }
}

async function selectComune(comuneId) {
  const comune = STATE.comuni.find((c) => c.id === comuneId);
  if (!comune) return;

  STATE.comuneSelezionato = comune;
  // Carica negozi del comune
  const res = await fetch(`data/shops/${comune.id}.json`);
  STATE.shops = await res.json();

  // Reset filtri
  STATE.filtroTesto = "";
  STATE.filtroCategoria = "";
  const search = $("#search");
  if (search) search.value = "";

  // Render blocchi dipendenti dal comune
  renderCategories();
  renderShopsGrid();
}

/* ------------------------ Render HOME ------------------------ */
function renderHomeView() {
  $("#shopView")?.classList.add("hidden");
  $("#homeView")?.classList.remove("hidden");
}

function renderCategories() {
  const catGrid = $("#catGrid");
  if (!catGrid || !STATE.comuneSelezionato) return;

  catGrid.innerHTML = "";
  STATE.comuneSelezionato.categorie.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4 text-left";
    btn.innerHTML = `
      <p class="text-sm font-semibold">${cat}</p>
      <p class="text-xs text-slate-600">Scopri</p>
    `;
    btn.addEventListener("click", () => {
      STATE.filtroCategoria = cat;
      applyFilters();
      scrollToSelector("#negozi");
    });
    catGrid.appendChild(btn);
  });
}

function renderShopsGrid() {
  const grid = $("#shopsGrid");
  if (!grid) return;

  grid.innerHTML = "";
  STATE.shops.forEach((s) => {
    const card = document.createElement("article");
    card.className = "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4";
    card.dataset.category = s.categoria;
    card.dataset.name = s.nome.toLowerCase();

    card.innerHTML = `
      <div class="aspect-video rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 border mb-3"></div>
      <h3 class="font-semibold">${s.nome}</h3>
      <p class="text-sm text-slate-600">${s.descrizione || ""}</p>
      <div class="mt-3 flex items-center justify-between text-xs">
        <span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100">${s.categoria}</span>
        <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Apri</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      location.hash = `#/shop/${s.id}`;
    });

    grid.appendChild(card);
  });

  applyFilters(); // applica eventuali filtri correnti
}

function applyFilters() {
  const q = ($("#search")?.value || "").trim().toLowerCase();
  STATE.filtroTesto = q;

  $$("#shopsGrid article").forEach((card) => {
    const name = card.dataset.name || "";
    const cat = card.dataset.category || "";
    const matchText = !STATE.filtroTesto || name.includes(STATE.filtroTesto);
    const matchCat = !STATE.filtroCategoria || cat === STATE.filtroCategoria;
    card.classList.toggle("hidden", !(matchText && matchCat));
  });
}

/* ------------------------ Render SHOP ------------------------ */
function renderShopViewById(shopId) {
  const shop = STATE.shops.find((s) => s.id === shopId);
  if (!shop) {
    location.hash = "#/";
    return;
  }

  $("#homeView")?.classList.add("hidden");
  $("#shopView")?.classList.remove("hidden");

  // Breadcrumb
  $("#bcComune").textContent = STATE.comuneSelezionato?.nome || "";
  $("#bcShop").textContent = shop.nome || "";

  // Header negozio
  $("#shopTitle").textContent = shop.nome || "";
  $("#shopDesc").textContent = shop.descrizione || "";
  $("#shopAddr").textContent = shop.indirizzo || "";
  $("#shopHours").textContent = shop.orari || "";
  $("#shopPhone").textContent = shop.telefono || "";
  $("#shopEmail").textContent = shop.email || "";
  $("#shopCat").textContent = shop.categoria || "";

  // CTA
  const msg = `Ciao! Ti contatto da Settimo Hub per informazioni su ${shop.nome}.`;
  $("#shopWhats").setAttribute("href", buildWhatsAppLink(shop.whatsapp || shop.telefono || "", msg));
  $("#shopMaps").setAttribute("href", buildMapsLink(shop.indirizzo || ""));

  // Prodotti / servizi
  renderProducts(shop.prodotti || []);

  // Scroll top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts(prodotti) {
  const grid = $("#prodGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!prodotti.length) {
    grid.innerHTML = `<div class="text-sm text-slate-600">Il negozio non ha ancora caricato prodotti/servizi. Contattalo su WhatsApp per info.</div>`;
    return;
  }

  prodotti.forEach((p) => {
    const card = document.createElement("article");
    card.className = "bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4";
    card.innerHTML = `
      <div class="aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border mb-3"></div>
      <h3 class="font-semibold">${p.nome}</h3>
      <p class="text-sm text-slate-600">${p.unita || ""}</p>
      <div class="mt-3 flex items-center justify-between text-sm">
        <span class="font-semibold">€ ${Number(p.prezzo || 0).toFixed(2)}</span>
        <a target="_blank" rel="noopener"
           class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">
           Scrivi su WhatsApp
        </a>
      </div>
    `;
    const a = card.querySelector("a");
    const msg = `Ciao! Ti contatto da Settimo Hub per "${p.nome}" (${p.unita || ""}).`;
    // usa telefono del negozio (non del prodotto)
    const shopPhone = ($("#shopPhone").textContent || "").trim();
    a.href = buildWhatsAppLink(shopPhone || "", msg);

    grid.appendChild(card);
  });
}
