/* =========================================================
   APAMUY — Web y app del cliente
   Negocios, carta, carrito, entrar con Google, direcciones con mapa,
   pago directo al negocio y seguimiento en vivo.
   ========================================================= */
const params = new URLSearchParams(location.search);
let YO = null, PERFIL = null;           // sesión y perfil del cliente (usuarios/{uid})
const IMGF = f => f || "";
const fotoP = (p, cls = "", ico = "🍽️") => p.foto ? `<img class="${cls}" src="${esc(p.foto)}" alt="${esc(p.nombre || "")}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph ${cls}&quot; aria-hidden=&quot;true&quot;>${ico}</div>'">` : `<div class="ph ${cls}" aria-hidden="true">${ico}</div>`;

/* ---------- Carrito (un solo negocio a la vez) ---------- */
const CART = {
  get: () => store.get("am_carrito", { negocio: "", nombre: "", items: [] }),
  set(c) { store.set("am_carrito", c); pintarBadge(); },
  add(neg, it) { let c = CART.get(); if (c.negocio && c.negocio !== neg.id && c.items.length) return false;
    if (c.negocio !== neg.id) c = { negocio: neg.id, nombre: neg.nombre, items: [] };
    const k = c.items.find(x => x.key === it.key); if (k) k.cant += it.cant; else c.items.push(it); CART.set(c); return true; },
  vaciar() { CART.set({ negocio: "", nombre: "", items: [] }); },
  subtotal: () => r2(CART.get().items.reduce((a, x) => a + x.precio * x.cant, 0)), cuenta: () => CART.get().items.reduce((a, x) => a + x.cant, 0)
};
function pintarBadge() { $$(".js-cnt").forEach(b => { const n = CART.cuenta(); b.textContent = n; b.hidden = !n; }); const f = $("#fab"); if (f) { const c = CART.get(); f.hidden = !CART.cuenta() || (window.NEG && c.negocio !== NEG.id); $(".js-sub", f) && ($(".js-sub", f).textContent = S(CART.subtotal())); } }

/* ---------- Dirección elegida para el pedido ---------- */
const DIR = { get: () => store.get("am_dir", null), set(d) { store.set("am_dir", d); pintarDir(); } };
function pintarDir() { const d = DIR.get(); $$(".js-dir").forEach(e => e.textContent = d ? (d.etiqueta ? d.etiqueta + " · " : "") + d.texto : "Elige tu dirección"); }

/* ---------- Hojas (ventanas que suben desde abajo) ---------- */
function hoja(html, cls = "") {
  cerrarHoja(); document.body.insertAdjacentHTML("beforeend", `<div class="hoja-bg" id="hoja"><div class="hoja ${cls}" role="dialog" aria-modal="true">${html}</div></div>`);
  const h = $("#hoja"); document.body.classList.add("no-scroll"); requestAnimationFrame(() => h.classList.add("on"));
  h.addEventListener("click", e => { if (e.target === h || e.target.closest("[data-cerrar]")) cerrarHoja(); }); return h;
}
function cerrarHoja() { $("#hoja")?.remove(); document.body.classList.remove("no-scroll"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarHoja(); });

/* ---------- Entrar con Google y completar el perfil ---------- */
function pedirEntrar(motivo = "Para hacer tu pedido entra con tu cuenta de Google. Es un toque.") {
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="entrar"><img src="favicon.svg" alt="" width="64" height="64"><h2>Entra a Apamuy</h2><p class="muted">${esc(motivo)}</p>
    <button class="btn btn-google btn-lg" id="gBtn"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>
    <p class="err" id="gErr" role="alert"></p><small class="muted">Al entrar aceptas que guardemos tu nombre, celular y direcciones para entregarte tus pedidos.</small></div>`);
  $("#gBtn", h).onclick = async () => { $("#gErr").textContent = ""; try { await Sesion.google(); } catch (e) { $("#gErr").textContent = errorAuth(e); } };
}
function formPerfil(alListo, titulo = "Completa tus datos") {
  const p = PERFIL || {};
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck" id="pfF" novalidate><h2>${esc(titulo)}</h2><p class="muted">Se los enviamos al negocio y al repartidor para entregarte tu pedido.</p>
    <label>Tu nombre *<input id="pfN" maxlength="60" autocomplete="name" value="${esc(p.nombre || YO.nombre || "")}"></label>
    <label>Celular (WhatsApp) *<input id="pfC" maxlength="12" inputmode="tel" autocomplete="tel" value="${esc(p.celular || "")}" placeholder="9 dígitos"></label>
    <p class="err" id="pfE" role="alert"></p><button class="btn btn-red btn-lg">Guardar</button></form>`);
  $("#pfF", h).onsubmit = async e => { e.preventDefault(); const n = $("#pfN").value.trim(), c = $("#pfC").value.replace(/\D/g, "");
    if (!n) return $("#pfE").textContent = "Escribe tu nombre."; if (c.length !== 9) return $("#pfE").textContent = "El celular debe tener 9 dígitos.";
    PERFIL = { nombre: n.slice(0, 60), celular: c, email: YO.email, direcciones: p.direcciones || [], creado: p.creado || new Date().toISOString() };
    await DB.set("usuarios", YO.uid, PERFIL); cerrarHoja(); toast("Datos guardados"); alListo && alListo(); };
}
async function asegurarCliente(alListo) {
  if (!YO) { store.set("am_seguir", 1); return pedirEntrar(); }
  if (!PERFIL || !PERFIL.celular) return formPerfil(alListo);
  alListo();
}

/* ---------- Elegir o agregar una dirección (con mapa) ---------- */
function elegirDireccion(alListo) {
  const ds = (PERFIL && PERFIL.direcciones) || [], act = DIR.get();
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>¿Dónde te lo llevamos?</h2>
    <div class="dirs">${ds.map((d, i) => `<label class="dir-i"><input type="radio" name="dirSel" value="${i}" ${act && act.lat === d.lat && act.lng === d.lng ? "checked" : ""}><span><b>${esc(d.etiqueta || "Dirección")}</b><small>${esc(d.texto)}${d.referencia ? " · " + esc(d.referencia) : ""}</small></span><button type="button" class="btn-link" data-editar="${i}">Mover</button></label>`).join("") || `<p class="muted">Aún no tienes direcciones guardadas.</p>`}</div>
    <button class="btn btn-light" id="dirNueva">📍 Agregar otra dirección</button>${ds.length ? `<button class="btn btn-red btn-lg" id="dirOk">Usar esta dirección</button>` : ""}</div>`);
  $("#dirNueva", h).onclick = () => editarDireccion(null, alListo);
  h.addEventListener("click", e => { const b = e.target.closest("[data-editar]"); if (b) { e.preventDefault(); editarDireccion(+b.dataset.editar, alListo); } });
  $("#dirOk", h)?.addEventListener("click", () => { const i = $('[name="dirSel"]:checked', h)?.value; if (i == null) return toast("Elige una dirección", true); DIR.set(ds[+i]); cerrarHoja(); alListo && alListo(); });
}
function editarDireccion(i, alListo) {
  const d = i != null ? PERFIL.direcciones[i] : { etiqueta: (PERFIL?.direcciones || []).length ? "Trabajo" : "Casa", texto: "", referencia: "" };
  let pos = d.lat != null ? { lat: d.lat, lng: d.lng } : null;
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck" id="dF" novalidate><h2>${i != null ? "Mover dirección" : "Nueva dirección"}</h2>
    <p class="muted">Mueve el pin hasta tu puerta exacta. El repartidor llegará a ese punto.</p>
    <div class="mapa" id="dMapa"></div><button type="button" class="btn btn-light btn-sm" id="dGPS">🎯 Usar mi ubicación actual</button>
    <div class="g2"><label>Nombre<select id="dEt">${["Casa", "Trabajo", "Pareja", "Familia", "Otro"].map(x => `<option ${d.etiqueta === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label>Dirección *<input id="dTx" maxlength="120" value="${esc(d.texto)}" placeholder="Calle, número, dpto."></label></div>
    <label>Referencia<input id="dRf" maxlength="120" value="${esc(d.referencia || "")}" placeholder="Ej. puerta verde, frente al parque"></label>
    <p class="err" id="dE" role="alert"></p><div class="g2">${i != null ? `<button type="button" class="btn btn-light" id="dDel">Eliminar</button>` : `<span></span>`}<button class="btn btn-red btn-lg">Guardar dirección</button></div></form>`, "h-alta");
  let M = null; mapaPin($("#dMapa", h), pos, q => pos = q).then(m => M = m);
  if (!pos) miUbicacion().then(q => { pos = q; M && M.mover(q); }).catch(() => {});
  $("#dGPS", h).onclick = () => miUbicacion().then(q => { pos = q; M && M.mover(q); toast("Ubicación encontrada"); }).catch(() => toast("Activa el GPS y da permiso de ubicación", true));
  $("#dDel", h)?.addEventListener("click", async () => { PERFIL.direcciones.splice(i, 1); await DB.set("usuarios", YO.uid, { direcciones: PERFIL.direcciones }); elegirDireccion(alListo); });
  $("#dF", h).onsubmit = async e => { e.preventDefault(); const tx = $("#dTx").value.trim();
    if (!tx) return $("#dE").textContent = "Escribe la dirección."; if (!pos) return $("#dE").textContent = "Marca tu ubicación en el mapa.";
    const nd = { etiqueta: $("#dEt").value, texto: tx, referencia: $("#dRf").value.trim(), lat: pos.lat, lng: pos.lng };
    PERFIL.direcciones = PERFIL.direcciones || []; if (i != null) PERFIL.direcciones[i] = nd; else PERFIL.direcciones.push(nd);
    await DB.set("usuarios", YO.uid, { direcciones: PERFIL.direcciones }); DIR.set(nd); cerrarHoja(); toast("Dirección guardada"); alListo && alListo(); };
}

/* ---------- Encabezado común ---------- */
function encabezado() {
  $$(".js-entrar").forEach(b => { b.hidden = !!YO; b.onclick = () => pedirEntrar("Entra para guardar tus direcciones y seguir tus pedidos."); });
  $$(".js-yo").forEach(b => { b.hidden = !YO; if (YO) b.innerHTML = YO.foto ? `<img src="${esc(YO.foto)}" alt="Mi perfil">` : esc((PERFIL?.nombre || YO.nombre || YO.email || "?")[0].toUpperCase()); });
  $$(".js-cambiarDir").forEach(b => b.onclick = () => YO ? asegurarCliente(() => elegirDireccion(() => { if (window.recalcular) window.recalcular(); })) : pedirEntrar("Entra para guardar tus direcciones."));
  pintarDir(); pintarBadge();
}

/* =========== INICIO: lista de negocios =========== */
let FILTRO = { tipo: "", q: "" };
async function paginaInicio() {
  const box = $("#negocios"); if (!box) return;
  const ns = (await DB.list("negocios", ["estado", "==", "activo"])).filter(n => n.nombre);
  const pintar = () => {
    const d = DIR.get(), q = norm(FILTRO.q);
    const l = ns.filter(n => (!FILTRO.tipo || n.tipo === FILTRO.tipo) && (!q || norm(n.nombre + " " + n.tipo + " " + (n.descripcion || "")).includes(q)))
      .map(n => ({ ...n, ab: estaAbierto(n), km: d ? distanciaKm(n.ubic, d) : null })).sort((a, b) => (b.ab - a.ab) || ((a.km ?? 99) - (b.km ?? 99)));
    const tipos = [...new Set(ns.map(n => n.tipo).filter(Boolean))];
    $("#tipos").innerHTML = `<button class="chip ${!FILTRO.tipo ? "on" : ""}" data-tipo="">Todos</button>` + tipos.map(t => `<button class="chip ${FILTRO.tipo === t ? "on" : ""}" data-tipo="${esc(t)}">${esc(t)}</button>`).join("");
    box.innerHTML = l.map(n => { const c = costoDelivery(n.km); return `<a class="neg ${n.ab ? "" : "cerr"}" href="negocio.html?n=${encodeURIComponent(n.id)}">
      <div class="neg-p">${n.portada ? `<img src="${esc(n.portada)}" alt="" loading="lazy" onerror="this.remove()">` : ""}${n.ab ? "" : `<span class="tag-c">Cerrado · abre ${esc(n.abre || "")}</span>`}</div>
      <div class="neg-b">${n.logo ? `<img class="neg-l" src="${esc(n.logo)}" alt="" loading="lazy">` : `<span class="neg-l ph">${esc((n.nombre || "?")[0])}</span>`}<div><h3>${esc(n.nombre)}</h3>
      <p>${esc(n.tipo || "")} · ⏱ ${esc(n.tiempo || "30-40 min")}${c == null ? "" : c < 0 ? " · <b class='neg-f'>Fuera de tu zona</b>" : ` · 🛵 ${S(c)}`}</p></div></div></a>`; }).join("")
      || `<div class="vacio">🔎<h2>No encontramos negocios</h2><p class="muted">Prueba con otra búsqueda.</p></div>`;
  };
  window.recalcular = pintar; pintar();
  $("#tipos").onclick = e => { const b = e.target.closest("[data-tipo]"); if (b) { FILTRO.tipo = b.dataset.tipo; pintar(); } };
  $("#buscar")?.addEventListener("input", e => { FILTRO.q = e.target.value; pintar(); });
}

/* =========== NEGOCIO: su carta =========== */
let NEG = null, CATS = [], PRODS = [];
async function paginaNegocio() {
  const box = $("#carta"); if (!box) return; const id = params.get("n");
  NEG = id ? await DB.get("negocios", id).catch(() => null) : null; window.NEG = NEG;
  if (!NEG || NEG.estado !== "activo") { box.innerHTML = `<div class="vacio">😕<h2>Este negocio no está disponible</h2><a class="btn btn-red" href="index.html">Ver otros negocios</a></div>`; return; }
  document.title = NEG.nombre + " · Apamuy";
  [CATS, PRODS] = await Promise.all([DB.list(`negocios/${id}/categorias`), DB.list(`negocios/${id}/productos`)]);
  CATS.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)); PRODS = PRODS.filter(p => p.activo !== false).sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
  const ab = estaAbierto(NEG), d = DIR.get(), km = d ? distanciaKm(NEG.ubic, d) : null, c = costoDelivery(km);
  $("#negHead").innerHTML = `<div class="nh-p">${NEG.portada ? `<img src="${esc(NEG.portada)}" alt="" onerror="this.remove()">` : ""}</div>
    <div class="nh-b">${NEG.logo ? `<img class="neg-l" src="${esc(NEG.logo)}" alt="">` : `<span class="neg-l ph">${esc(NEG.nombre[0])}</span>`}<div><h1>${esc(NEG.nombre)}</h1>
    <p class="muted">${esc(NEG.tipo || "")} · ${esc(NEG.direccion || "")}</p><p><span class="estado ${ab ? "on" : "off"}">${ab ? `Abierto hasta las ${esc(NEG.cierra)}` : `Cerrado · abre a las ${esc(NEG.abre)}`}</span> · ⏱ ${esc(NEG.tiempo || "30-40 min")}${c == null ? "" : c < 0 ? " · Fuera de tu zona de delivery" : ` · 🛵 Delivery ${S(c)}`}</p>
    ${NEG.descripcion ? `<p>${esc(NEG.descripcion)}</p>` : ""}</div></div>`;
  const cats = CATS.filter(k => PRODS.some(p => p.cat === k.id)), dest = PRODS.filter(p => p.destacado && !p.agotado);
  $("#chips").innerHTML = (dest.length ? `<a href="#c-dest" class="chip on">⭐ Favoritos</a>` : "") + cats.map(k => `<a href="#c-${esc(k.id)}" class="chip">${esc(k.nombre)}</a>`).join("");
  const card = p => `<article class="card ${p.agotado ? "agot" : ""}"><button type="button" class="card-b" data-p="${esc(p.id)}" ${p.agotado || !ab ? "disabled" : ""} aria-label="${esc(p.nombre)}">
    <div class="card-img">${fotoP(p)}${p.agotado ? `<span class="tag-ag">Agotado</span>` : p.destacado ? `<span class="tag-st">⭐ Favorito</span>` : ""}</div>
    <div class="card-t"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc || "")}</p><div class="card-f"><b>${S(p.precio)}</b>${p.agotado || !ab ? "" : `<span class="add">+</span>`}</div></div></button></article>`;
  box.innerHTML = (ab ? "" : `<div class="aviso">🔒 Ahora está cerrado. Puedes ver la carta y pedir desde las ${esc(NEG.abre)}.</div>`)
    + (dest.length ? `<section class="sec" id="c-dest"><h2>⭐ Favoritos</h2><div class="grid">${dest.map(card).join("")}</div></section>` : "")
    + cats.map(k => `<section class="sec" id="c-${esc(k.id)}"><h2>${esc(k.nombre)}</h2><div class="grid">${PRODS.filter(p => p.cat === k.id).map(card).join("")}</div></section>`).join("")
    + (PRODS.filter(p => !cats.some(k => k.id === p.cat)).length ? `<section class="sec"><h2>Más</h2><div class="grid">${PRODS.filter(p => !cats.some(k => k.id === p.cat)).map(card).join("")}</div></section>` : "");
  box.onclick = e => { const b = e.target.closest("[data-p]"); if (b) abrirProducto(b.dataset.p); };
  window.recalcular = () => paginaNegocio(); pintarBadge();
}
function abrirProducto(id) {
  const p = PRODS.find(x => x.id === id); if (!p || p.agotado) return;
  const grupos = p.opciones || [], extras = p.extrasGratis ? (NEG.extrasGratis || []) : [];
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="hp-img">${fotoP(p)}</div>
    <form class="hp" id="hpF" novalidate><h2>${esc(p.nombre)}</h2><p class="muted">${esc(p.desc || "")}</p><b class="hp-pr">${S(p.precio)}</b>
      ${grupos.map((g, gi) => `<fieldset class="op" data-g="${gi}"><legend>${esc(g.titulo)} ${g.req ? `<em>Obligatorio</em>` : `<small>Opcional</small>`}</legend>
        ${(g.items || []).map((it, ii) => `<label class="op-i"><input type="${g.tipo === "varios" ? "checkbox" : "radio"}" name="g${gi}" value="${ii}" ${g.tipo !== "varios" && g.req && ii === 0 ? "checked" : ""}><span>${esc(it.n)}</span>${+it.p ? `<b>+ ${S(it.p)}</b>` : ""}</label>`).join("")}</fieldset>`).join("")}
      ${extras.length ? `<fieldset class="op"><legend>Extras gratis <small>Elige los que quieras</small></legend><div class="cremas">${extras.map(c => `<label class="cr"><input type="checkbox" name="extra" value="${esc(c)}"><span>${esc(c)}</span></label>`).join("")}</div></fieldset>` : ""}
      <label class="op-n">¿Alguna indicación? <small>(opcional)</small><textarea name="nota" rows="2" maxlength="140" placeholder="Ej. sin cebolla, bien cocido"></textarea></label>
      <div class="hp-f"><div class="qty"><button type="button" data-q="-1" aria-label="Menos">−</button><b id="qN">1</b><button type="button" data-q="1" aria-label="Más">+</button></div>
        <button class="btn btn-red" id="hpAdd">Agregar · <span id="hpTot">${S(p.precio)}</span></button></div></form>`, "hp-h");
  let cant = 1;
  const calc = () => { let x = +p.precio; grupos.forEach((g, gi) => $$(`[name="g${gi}"]:checked`, h).forEach(i => x += +(g.items[+i.value].p || 0))); return r2(x); };
  const rep = () => { $("#qN", h).textContent = cant; $("#hpTot", h).textContent = S(calc() * cant); };
  h.addEventListener("change", rep);
  h.addEventListener("click", e => { const q = e.target.closest("[data-q]"); if (q) { cant = Math.max(1, Math.min(30, cant + +q.dataset.q)); rep(); } });
  $("#hpF", h).onsubmit = e => { e.preventDefault();
    const falta = grupos.findIndex((g, gi) => g.req && !$(`[name="g${gi}"]:checked`, h)); if (falta >= 0) return toast(`Elige: ${grupos[falta].titulo}`, true);
    const opts = grupos.map((g, gi) => $$(`[name="g${gi}"]:checked`, h).map(i => g.items[+i.value].n).join(", ")).filter(Boolean).join(" · ");
    const ex = $$('[name="extra"]:checked', h).map(i => i.value).join(", "), nota = $('[name="nota"]', h).value.trim().slice(0, 140);
    const it = { key: [p.id, opts, ex, nota].join("|"), id: p.id, n: p.nombre, precio: calc(), cant, opts, extras: ex, nota, cat: p.cat };
    if (!CART.add(NEG, it)) { const c = CART.get();
      return hoja(`<div class="vacio">🛒<h2>Ya tienes un pedido en ${esc(c.nombre)}</h2><p class="muted">Cada pedido es de un solo negocio. ¿Empezamos uno nuevo en ${esc(NEG.nombre)}?</p>
        <button class="btn btn-red" id="nuevoC">Sí, vaciar y empezar aquí</button><button class="btn btn-light" data-cerrar>No, mantener</button></div>`).querySelector("#nuevoC").onclick = () => { CART.vaciar(); CART.add(NEG, it); cerrarHoja(); toast(`✓ ${it.n} agregado`); }; }
    cerrarHoja(); toast(`✓ ${cant}× ${p.nombre} agregado`);
    const esBeb = x => /bebida|gaseosa|refresco|jugo/.test(norm((CATS.find(k => k.id === x.cat) || {}).nombre));
    if (p.sugerirBebida && !CART.get().items.some(esBeb)) sugerirBebida(esBeb);
  };
}
function sugerirBebida(esBeb) {
  const beb = PRODS.filter(p => esBeb(p) && !p.agotado).slice(0, 6); if (!beb.length) return;
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="up"><h2>🥤 ¿Le agregas una bebida?</h2><div class="up-l">${beb.map(b => `<button type="button" class="up-i" data-b="${esc(b.id)}">${fotoP(b, "mini")}<span><b>${esc(b.nombre)}</b><small>desde ${S(b.precio)}</small></span><em>Elegir</em></button>`).join("")}</div>
    <button type="button" class="btn btn-light" data-cerrar>No, gracias</button></div>`);
  h.addEventListener("click", e => { const b = e.target.closest("[data-b]"); if (b) abrirProducto(b.dataset.b); });
}

/* ---------- Carrito ---------- */
function abrirCarrito() {
  const c = CART.get();
  if (!c.items.length) return hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="vacio">🛒<h2>Tu pedido está vacío</h2><a class="btn btn-red" href="index.html">Ver negocios</a></div>`);
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="cart"><h2>Tu pedido</h2><p class="muted">en <b>${esc(c.nombre)}</b></p><div id="cartL"></div>
    <div class="cart-f"><div class="tot"><span>Subtotal</span><b class="js-subt">${S(CART.subtotal())}</b></div><button class="btn btn-red btn-lg" id="irPago">Continuar</button>
    ${window.NEG && NEG.id === c.negocio ? `<button class="btn btn-light" data-cerrar>Seguir agregando</button>` : `<a class="btn btn-light" href="negocio.html?n=${encodeURIComponent(c.negocio)}">Volver a ${esc(c.nombre)}</a>`}</div></div>`);
  const pintar = () => { const l = CART.get().items; if (!l.length) { CART.vaciar(); return abrirCarrito(); }
    $("#cartL", h).innerHTML = l.map((x, i) => `<div class="ci"><div><b>${esc(x.n)}</b>${detItem(x).map(d => `<small>${esc(d)}</small>`).join("")}<span>${S(x.precio * x.cant)}</span></div>
      <div class="qty sm"><button type="button" data-i="${i}" data-d="-1" aria-label="Menos">${x.cant === 1 ? "🗑" : "−"}</button><b>${x.cant}</b><button type="button" data-i="${i}" data-d="1" aria-label="Más">+</button></div></div>`).join("");
    $(".js-subt", h).textContent = S(CART.subtotal()); pintarBadge(); };
  pintar();
  h.addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (!b) return; const cc = CART.get(), x = cc.items[+b.dataset.i]; x.cant += +b.dataset.d; if (x.cant <= 0) cc.items.splice(+b.dataset.i, 1); CART.set(cc); pintar(); });
  $("#irPago", h).onclick = () => asegurarCliente(checkout);
}

/* ---------- Finalizar pedido ---------- */
async function checkout() {
  const c = CART.get(), neg = (window.NEG && NEG.id === c.negocio) ? NEG : await DB.get("negocios", c.negocio);
  if (!neg || neg.estado !== "activo") return toast("Este negocio no está disponible ahora", true);
  if (!estaAbierto(neg)) return toast(`${neg.nombre} está cerrado. Abre a las ${neg.abre}.`, true);
  let entrega = neg.delivery !== false ? "delivery" : "recojo";
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck" id="ckF" novalidate><h2>Finalizar pedido</h2><p class="muted">en <b>${esc(neg.nombre)}</b></p>
    <div class="seg">${neg.delivery !== false ? `<button type="button" data-e="delivery">🛵 Delivery</button>` : ""}${neg.recojo !== false ? `<button type="button" data-e="recojo">🏪 Recojo</button>` : ""}</div>
    <div id="ckD"><div class="dir-b"><div><small>Entregar en</small><b class="js-dir"></b></div><button type="button" class="btn btn-light btn-sm" id="ckDir">Cambiar</button></div></div>
    <div id="ckR" class="ck-local">🏪 Recoges en <b>${esc(neg.direccion || "")}</b>${neg.referencia ? " (" + esc(neg.referencia) + ")" : ""}.</div>
    <div class="quien">👤 <b>${esc(PERFIL.nombre)}</b> · 📱 ${esc(PERFIL.celular)} <button type="button" class="btn-link" id="ckYo">Cambiar</button></div>
    <label>Nota para el pedido<input id="ckNota" maxlength="140" placeholder="Ej. tocar el timbre, sin cubiertos"></label>
    <div class="resumen" id="ckRes"></div><h3>Pago de la comida <small class="muted">· directo a ${esc(neg.nombre)}</small></h3><div id="pagoBox"></div>
    <p class="err" id="ckErr" role="alert"></p><button class="btn btn-red btn-lg" id="ckBtn">Hacer pedido</button></form>`, "ck-h");
  pintarDir();
  const pago = Pago($("#pagoBox", h), neg, { contraEntrega: neg.contraEntrega !== false, onChange: () => resumen() });
  const km = () => entrega === "delivery" ? distanciaKm(neg.ubic, DIR.get()) : 0, envio = () => entrega === "delivery" ? costoDelivery(km()) : 0;
  const efectivo = () => pago.estado.met === "Efectivo";
  function resumen() {
    const e = envio(), sub = CART.subtotal(), tot = r2(sub + Math.max(0, e || 0));
    $("#ckRes", h).innerHTML = `<div><span>Comida</span><b>${S(sub)}</b></div>${entrega === "delivery" ? `<div><span>Delivery ${km() != null ? `(${km().toFixed(1)} km)` : ""}</span><b>${e == null ? "Elige tu dirección" : e < 0 ? "Fuera de zona" : S(e)}</b></div>` : ""}
      <div class="t"><span>Total</span><b>${S(tot)}</b></div>${entrega === "delivery" && e > 0 && !efectivo() ? `<p class="nota">🛵 El delivery (${S(e)}) se paga en efectivo al repartidor al recibir.</p>` : ""}
      ${entrega === "delivery" && sub < (+neg.pedidoMinimo || 0) ? `<p class="err">El pedido mínimo para delivery es ${S(neg.pedidoMinimo)}.</p>` : ""}`;
    pago.setMonto(efectivo() ? tot : sub);
  }
  const modo = () => { $$("[data-e]", h).forEach(b => b.classList.toggle("on", b.dataset.e === entrega)); $("#ckD", h).hidden = entrega !== "delivery"; $("#ckR", h).hidden = entrega !== "recojo"; resumen(); };
  h.addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { entrega = b.dataset.e; modo(); } });
  $("#ckDir", h).onclick = () => elegirDireccion(checkout);
  $("#ckYo", h).onclick = () => formPerfil(checkout, "Tus datos");
  await pago.pintar(); modo();
  if (entrega === "delivery" && !DIR.get()) elegirDireccion(checkout);
  $("#ckF", h).onsubmit = async e => {
    e.preventDefault(); const err = $("#ckErr", h); err.textContent = "";
    const d = DIR.get(), env = envio(), sub = CART.subtotal();
    if (entrega === "delivery") { if (!d) return err.textContent = "Elige la dirección de entrega."; if (env < 0) return err.textContent = "Tu dirección está fuera de la zona de delivery de este negocio.";
      if (sub < (+neg.pedidoMinimo || 0)) return err.textContent = `El pedido mínimo para delivery es ${S(neg.pedidoMinimo)}.`; }
    const pe = pago.validar(); if (pe) return err.textContent = pe;
    const pd = pago.datos(), cod = codigo("AP"), b = $("#ckBtn", h); b.disabled = true; b.textContent = "Enviando pedido…";
    try {
      const captura = pd.captura ? await subirFoto(`capturas/${YO.uid}/${cod}.jpg`, pd.captura) : "";
      const ped = { codigo: cod, negocioId: neg.id, negocio: { nombre: neg.nombre, logo: neg.logo || "", telefono: neg.telefono || "", whatsapp: neg.whatsapp || "", direccion: neg.direccion || "", ubic: neg.ubic || null },
        clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, items: CART.get().items.map(x => ({ id: x.id, n: x.n, cant: x.cant, precio: x.precio, opts: x.opts || "", extras: x.extras || "", nota: x.nota || "" })),
        subtotal: sub, envio: entrega === "delivery" ? env : 0, km: entrega === "delivery" ? r2(km()) : 0, total: r2(sub + (entrega === "delivery" ? env : 0)), entrega,
        destino: entrega === "delivery" ? { texto: d.texto, referencia: d.referencia || "", lat: d.lat, lng: d.lng } : null, nota: $("#ckNota", h).value.trim(),
        pago: pd.pago, operacion: pd.operacion, montoLeido: pd.montoLeido, coincide: pd.coincide, fechaOk: pd.fechaOk, pagaCon: pd.pagaCon, captura,
        estado: pd.pago === "Efectivo" ? "nuevo" : "por-validar", dia: HOY(), mes: HOY().slice(0, 7), creado: new Date().toISOString() };
      await DB.set("pedidos", cod, ped, false);
      CART.vaciar(); cerrarHoja(); location.href = `pedido.html?c=${encodeURIComponent(cod)}&nuevo=1`;
    } catch (x) { console.error(x); b.disabled = false; b.textContent = "Hacer pedido"; err.textContent = "No se pudo enviar el pedido. Revisa tu conexión e inténtalo otra vez."; }
  };
}

/* =========== SEGUIMIENTO =========== */
const PASOS = { delivery: [["nuevo", "Recibido", "📝"], ["cocina", "Preparando", "🔥"], ["camino", "En camino", "🛵"], ["entregado", "Entregado", "✅"]],
  recojo: [["nuevo", "Recibido", "📝"], ["cocina", "Preparando", "🔥"], ["listo", "Listo para recoger", "🛍️"], ["entregado", "Entregado", "✅"]] };
const ORDEN = { "por-validar": 0, nuevo: 0, cocina: 1, listo: 2, camino: 2, entregado: 3 };
async function paginaPedido() {
  const box = $("#pedidoBox"); if (!box) return; const c = params.get("c");
  if (!c) { box.innerHTML = `<div class="vacio">🔎<h2>Sigue tu pedido</h2><a class="btn btn-red" href="mis-pedidos.html">Ver mis pedidos</a></div>`; return; }
  if (!YO) { box.innerHTML = `<div class="vacio">🔒<h2>Entra para ver tu pedido</h2><button class="btn btn-red js-entrar2">Entrar con Google</button></div>`; $(".js-entrar2").onclick = () => pedirEntrar("Entra con la misma cuenta con la que pediste."); return; }
  let M = null, ult = "";
  DB.escuchar("pedidos", c, async p => {
    if (!p) { box.innerHTML = `<div class="vacio">😕<h2>No encontramos el pedido ${esc(c)}</h2><a href="mis-pedidos.html">Ver mis pedidos</a></div>`; return; }
    const firma = p.estado + (p.tiempo || "") + (p.repartidor ? p.repartidor.nombre : ""); if (ult && ult !== firma) { navigator.vibrate?.(250); toast("Tu pedido se actualizó"); } ult = firma;
    const pasos = PASOS[p.entrega] || PASOS.delivery, idx = ORDEN[p.estado] ?? -1, malo = ["rechazado", "anulado"].includes(p.estado), r = p.repartidor || null;
    const titulo = { "por-validar": "Estamos validando tu pago", nuevo: "¡El negocio recibió tu pedido!", cocina: "Tu pedido se está preparando 🔥", listo: p.entrega === "recojo" ? "¡Listo para recoger!" : "Listo, esperando al repartidor", camino: "Tu pedido va en camino 🛵", entregado: "¡Entregado! Buen provecho", rechazado: "No se pudo validar tu pago", anulado: "Tu pedido fue anulado" }[p.estado] || p.estado;
    box.innerHTML = `${params.get("nuevo") ? `<div class="ok-top">✓ Pedido enviado a <b>${esc(p.negocio.nombre)}</b> · código <b>${esc(p.codigo)}</b></div>` : ""}
      <div class="trk"><small>${esc(p.negocio.nombre)} · ${fmtFH(p.creado)}</small><h1>${esc(titulo)}</h1>
        ${p.estado === "cocina" && p.tiempo ? `<p class="eta">⏱ Listo en aprox. <b>${esc(p.tiempo)} min</b></p>` : ""}
        ${r ? `<div class="rep">${r.foto ? `<img src="${esc(r.foto)}" alt="">` : `<span>🛵</span>`}<div><b>${esc(r.nombre)}</b><small>Tu repartidor${r.placa ? " · " + esc(r.placa) : ""}</small></div>${r.celular ? `<a class="btn btn-light btn-sm" href="tel:${esc(r.celular)}">Llamar</a>` : ""}</div>` : ""}
        ${malo ? `<div class="bad">${p.motivo ? esc(p.motivo) + ". " : ""}Escríbele al negocio para ayudarte.</div>` : `<ol class="pasos">${pasos.map(([k, t, ic], i) => `<li class="${i < idx || p.estado === "entregado" ? "done" : i === idx ? "now" : ""}"><i>${ic}</i><span>${t}</span></li>`).join("")}</ol>`}</div>
      ${p.entrega === "delivery" && !malo && p.estado !== "entregado" ? `<div class="mapa trk-m" id="trkMapa"></div><p class="muted sm">🏪 negocio · 🏠 tu dirección${r && r.ubic ? " · 🛵 repartidor en vivo" : ""}</p>` : ""}
      <div class="det"><h3>Tu pedido</h3>${(p.items || []).map(x => `<div class="ci"><div><b>${x.cant}× ${esc(x.n)}</b>${detItem(x).map(d => `<small>${esc(d)}</small>`).join("")}</div><span>${S(x.precio * x.cant)}</span></div>`).join("")}
        <div class="resumen"><div><span>Comida</span><b>${S(p.subtotal)}</b></div>${p.envio ? `<div><span>Delivery</span><b>${S(p.envio)}</b></div>` : ""}<div class="t"><span>Total</span><b>${S(p.total)}</b></div></div>
        <p class="muted">${p.entrega === "delivery" ? `🏠 ${esc(p.destino?.texto || "")}${p.destino?.referencia ? " · " + esc(p.destino.referencia) : ""}` : `🏪 Recojo en ${esc(p.negocio.direccion || "")}`}<br>💳 ${esc(p.pago)}${p.pagaCon ? ` · pagas con ${S(p.pagaCon)} (vuelto ${S(p.pagaCon - p.total)})` : ""}</p></div>
      <div class="acts">${p.negocio.whatsapp ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(wa(p.negocio.whatsapp, `Hola ${p.negocio.nombre} 👋 consulto por mi pedido ${p.codigo} de Apamuy.`))}">Escribir a ${esc(p.negocio.nombre)}</a>` : ""}<a class="btn btn-light" href="index.html">Volver al inicio</a></div>`;
    const el = $("#trkMapa"); if (el) { M = null; M = await mapaPuntos(el, [p.negocio.ubic && { ...p.negocio.ubic, color: "#E63946", txt: "🏪" }, p.destino && { ...p.destino, color: "#1A1430", txt: "🏠" }, r && r.ubic && { ...r.ubic, color: "#FFC21A", txt: "🛵" }]); }
  });
}

/* =========== MIS PEDIDOS =========== */
async function paginaMisPedidos() {
  const box = $("#misBox"); if (!box) return;
  if (!YO) { box.innerHTML = `<div class="vacio">🧾<h2>Entra para ver tus pedidos</h2><button class="btn btn-red" id="mpE">Entrar con Google</button></div>`; $("#mpE").onclick = () => pedirEntrar("Entra para ver tus pedidos."); return; }
  const ps = (await DB.list("pedidos", ["clienteUid", "==", YO.uid])).sort((a, b) => String(b.creado).localeCompare(a.creado)).slice(0, 50);
  const E = { "por-validar": "Validando pago", nuevo: "Recibido", cocina: "Preparando", listo: "Listo", camino: "En camino", entregado: "Entregado", rechazado: "Rechazado", anulado: "Anulado" };
  box.innerHTML = ps.map(p => `<a class="mp" href="pedido.html?c=${encodeURIComponent(p.codigo)}"><div><b>${esc(p.negocio.nombre)}</b><small>${fmtFH(p.creado)} · ${p.entrega === "delivery" ? "Delivery" : "Recojo"} · ${esc(p.codigo)}</small>
    <small>${esc((p.items || []).map(x => `${x.cant}× ${x.n}`).join(", "))}</small></div><div><span class="e e-${esc(p.estado)}">${esc(E[p.estado] || p.estado)}</span><b>${S(p.total)}</b></div></a>`).join("")
    || `<div class="vacio">🧾<h2>Aún no tienes pedidos</h2><a class="btn btn-red" href="index.html">Pedir ahora</a></div>`;
}

/* =========== MI PERFIL =========== */
function paginaPerfil() {
  const box = $("#perfilBox"); if (!box) return;
  if (!YO) { box.innerHTML = `<div class="vacio">👤<h2>Entra a tu cuenta</h2><button class="btn btn-red" id="pE">Entrar con Google</button></div>`; $("#pE").onclick = () => pedirEntrar("Entra para ver tu perfil."); return; }
  const p = PERFIL || {}, ds = p.direcciones || [];
  box.innerHTML = `<div class="det"><div class="yo">${YO.foto ? `<img src="${esc(YO.foto)}" alt="">` : ""}<div><h2>${esc(p.nombre || YO.nombre || "")}</h2><p class="muted">${esc(YO.email)}<br>📱 ${esc(p.celular || "sin celular")}</p></div><button class="btn btn-light btn-sm" id="pfEd">Editar</button></div></div>
    <div class="det"><h3>Mis direcciones</h3>${ds.map((d, i) => `<div class="ci"><div><b>${esc(d.etiqueta)}</b><small>${esc(d.texto)}${d.referencia ? " · " + esc(d.referencia) : ""}</small></div><button class="btn btn-light btn-sm" data-ed="${i}">Mover</button></div>`).join("") || `<p class="muted">Aún no tienes direcciones.</p>`}
      <button class="btn btn-light" id="pfDir">📍 Agregar dirección</button></div>
    <div class="acts"><a class="btn btn-light" href="${esc(AP.panel || "#")}">🏪 ¿Tienes un negocio? Véndelo en Apamuy</a><button class="btn btn-light" id="pfSalir">Cerrar sesión</button></div>`;
  $("#pfEd").onclick = () => formPerfil(paginaPerfil, "Tus datos"); $("#pfDir").onclick = () => editarDireccion(null, paginaPerfil); $("#pfSalir").onclick = () => Sesion.salir();
  box.onclick = e => { const b = e.target.closest("[data-ed]"); if (b) editarDireccion(+b.dataset.ed, paginaPerfil); };
}

/* ---------- App instalable ---------- */
let instalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar = e; $$(".js-instalar").forEach(b => b.hidden = false); });
document.addEventListener("click", async e => {
  if (e.target.closest(".js-carrito")) { e.preventDefault(); abrirCarrito(); }
  const b = e.target.closest(".js-instalar"); if (!b) return;
  if (instalar) { instalar.prompt(); await instalar.userChoice; instalar = null; b.hidden = true; }
  else hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>Instala Apamuy en tu iPhone</h2><ol class="pasos-ios"><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadrado con la flecha ↑).</li><li>Elige <b>«Agregar a inicio»</b> y toca <b>Agregar</b>.</li><li>Abre Apamuy desde el ícono nuevo y <b>permite las notificaciones</b> para saber cuándo llega tu pedido.</li></ol><button class="btn btn-red" data-cerrar>Entendido</button></div>`);
});
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $$(".js-instalar").forEach(b => b.hidden = false);

/* ---------- Arranque ---------- */
(async () => {
  await cargarConfig().catch(() => {});
  let iniciado = false;
  Sesion.alCambiar(async u => {
    if (iniciado) return location.reload();      // entró o salió: recargar con la nueva sesión
    iniciado = true; YO = u; PERFIL = u ? await DB.get("usuarios", u.uid).catch(() => null) : null;
    if (u && !PERFIL) PERFIL = { nombre: u.nombre, email: u.email, direcciones: [] };
    if (u && !DIR.get() && PERFIL.direcciones?.length) store.set("am_dir", PERFIL.direcciones[0]);
    encabezado(); paginaInicio(); paginaNegocio(); paginaPedido(); paginaMisPedidos(); paginaPerfil();
    $$(".js-anio").forEach(e => e.textContent = new Date().getFullYear());
    if (u && store.get("am_seguir", 0)) { store.del("am_seguir"); if (CART.cuenta()) abrirCarrito(); }
  });
})();
