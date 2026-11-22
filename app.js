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
    <p class="err js-auth-err" id="gErr" role="alert"></p><small class="muted">Al entrar aceptas que guardemos tu nombre, celular y direcciones para entregarte tus pedidos.</small></div>`);
  errorAuthGuardado($("#gErr", h));
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
  $("#dirOk", h)?.addEventListener("click", () => { const i = $('[name="dirSel"]:checked', h)?.value; if (i == null) return toast("Elige una dirección", true); DIR.set(ds[+i]); cerrarHoja();
    const cc = ciudadCercana(ds[+i]); if (cc) { const a = CIUDAD.get(); if (a.prov !== cc.prov) { CIUDAD.set(cc); if ($("#negocios")) return location.reload(); } } alListo && alListo(); });
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
    await DB.set("usuarios", YO.uid, { direcciones: PERFIL.direcciones }); DIR.set(nd); cerrarHoja(); toast("Dirección guardada");
    const cc = ciudadCercana(pos); if (cc) { const a = CIUDAD.get(); if (a.prov !== cc.prov || a.dep !== cc.dep) { CIUDAD.set(cc); if ($("#negocios")) return location.reload(); } }
    alListo && alListo(); };
}

/* ---------- Encabezado común ---------- */
function encabezado() {
  $$(".js-entrar").forEach(b => { b.hidden = !!YO; b.onclick = () => pedirEntrar("Entra para guardar tus direcciones y seguir tus pedidos."); });
  $$(".js-yo").forEach(b => { b.hidden = !YO; if (YO) b.innerHTML = YO.foto ? `<img src="${esc(YO.foto)}" alt="Mi perfil">` : esc((PERFIL?.nombre || YO.nombre || YO.email || "?")[0].toUpperCase()); });
  $$(".js-cambiarDir").forEach(b => b.onclick = () => YO ? asegurarCliente(() => elegirDireccion(() => { if (window.recalcular) window.recalcular(); })) : pedirEntrar("Entra para guardar tus direcciones."));
  $$(".js-ciudad").forEach(b => { b.textContent = CIUDAD.get().prov + " ▾"; b.onclick = () => elegirCiudad(); });
  pintarDir(); pintarBadge();
}

/* =========== CIUDAD (provincia) que ve el cliente =========== */
const CIUDAD = { get: () => store.get("am_ciudad", null) || CONF.ciudadInicial || { dep: "Cusco", prov: "Cusco" },
  set(c) { const a = CIUDAD.get(); store.set("am_ciudad", { dep: c.dep, prov: c.prov }); if (a.dep !== c.dep || a.prov !== c.prov) { sessionStorage.removeItem("am_dest"); toast(`Ahora ves los negocios de ${c.prov}`); } } };
function elegirCiudad(alListo) {
  const c = CIUDAD.get(), deps = Object.keys(window.UBIGEO || {}).sort((a, b) => a.localeCompare(b));
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>¿En qué ciudad estás?</h2><p class="muted">Te mostramos los negocios de toda tu provincia.</p>
    <button class="btn btn-light" id="cGPS">🎯 Usar mi ubicación</button>
    <div class="g2"><label>Departamento<select id="cDep">${deps.map(d => `<option ${d === c.dep ? "selected" : ""}>${esc(d)}</option>`).join("")}</select></label><label>Provincia<select id="cProv"></select></label></div>
    <button class="btn btn-red btn-lg" id="cOk">Ver negocios</button></div>`);
  const provs = () => { const d = $("#cDep", h).value; $("#cProv", h).innerHTML = Object.keys(UBIGEO[d] || {}).sort((a, b) => a.localeCompare(b)).map(p => `<option ${p === c.prov ? "selected" : ""}>${esc(p)}</option>`).join(""); };
  provs(); $("#cDep", h).onchange = provs;
  $("#cGPS", h).onclick = () => miUbicacion().then(q => { const x = ciudadCercana(q); if (!x) return; $("#cDep", h).value = x.dep; provs(); $("#cProv", h).value = x.prov; toast(`Estás en ${x.dis}, ${x.prov}`); }).catch(() => toast("Activa el GPS y da permiso de ubicación", true));
  $("#cOk", h).onclick = () => { CIUDAD.set({ dep: $("#cDep", h).value, prov: $("#cProv", h).value }); cerrarHoja(); alListo ? alListo() : location.reload(); };
}
let NEGS_CIUDAD = null;
async function negociosCiudad() {
  if (NEGS_CIUDAD) return NEGS_CIUDAD; const c = CIUDAD.get(), k = provKey(c.dep, c.prov);
  NEGS_CIUDAD = (await rapido("negs_" + k, () => DB.list("negocios", ["estado", "==", "activo"], ["prov", "==", k]), l => { NEGS_CIUDAD = l.filter(n => n.nombre && !n.bloqueoCobro); repintarInicio(); })).filter(n => n.nombre && !n.bloqueoCobro);   // bloqueoCobro: no pagó su comisión → oculto
  return NEGS_CIUDAD;
}
// Productos destacados (⭐) de los negocios de la ciudad. Se guardan 5 min para gastar pocas lecturas.
async function destacadosCiudad(ns) {
  const c = CIUDAD.get(), k = provKey(c.dep, c.prov), g = MEM.get("dest_" + k);
  const traer = async () => { const l = (await Promise.all(ns.slice(0, 30).map(n => DB.list(`negocios/${n.id}/productos`, ["destacado", "==", true]).then(ps => ps.filter(p => p.activo !== false && !p.agotado).slice(0, 4)
    .map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio, precioAntes: p.precioAntes || null, foto: p.foto || "", neg: n.id, negNombre: n.nombre, rubro: n.rubro || "comida", estrellasSum: n.estrellasSum || 0, estrellasN: n.estrellasN || 0 }))).catch(() => [])))).flat(); MEM.set("dest_" + k, l); return l; };
  // Se actualizan como máximo cada 5 min (cuestan lecturas); mientras tanto se muestran los guardados
  if (!DEMO && g !== undefined) { const t = (JSON.parse(localStorage.getItem("am_c_dest_" + k) || "{}").t) || 0; if (Date.now() - t > 300000) traer().then(l => { if (JSON.stringify(l) !== JSON.stringify(g)) repintarInicio(); }).catch(() => {}); return g; }
  return traer();
}

/* =========== INICIO y RUBROS =========== */
let FILTRO = { tipo: "", q: "" };
const enlaceBanner = b => b.enlace === "panel" ? (AP.panel || "#") : String(b.enlace || "").startsWith("rubro:") ? `./?r=${encodeURIComponent(b.enlace.slice(6))}` : String(b.enlace || "").startsWith("negocio:") ? `negocio?n=${encodeURIComponent(b.enlace.slice(8))}` : (b.enlace || "#");
async function paginaInicio() {
  const box = $("#negocios"); if (!box) return;
  const W = CONF.web, rid = params.get("r"), c = CIUDAD.get();
  $("#hTit").textContent = W.titulo; $("#hSub").textContent = W.subtitulo; $("#buscar").placeholder = W.buscador;
  if (W.anuncio) { $("#anuncio").hidden = false; $("#anuncio").textContent = W.anuncio; }
  const [ns, banners] = await Promise.all([negociosCiudad(), W.mostrarBanners && !rid ? rapido("banners", () => DB.list("banners"), () => repintarInicio()).catch(() => []) : []]);
  const R = rid ? rubroDe(rid) : null;
  // Rubros con imagen
  $("#rubros").innerHTML = rid ? `<div class="rb-h"><a href="./" class="btn btn-light btn-sm">← Inicio</a>${R.imagen ? `<img src="${esc(imgUrl(R.imagen))}" alt="">` : ""}<h1>${esc(R.nombre)}</h1></div>${R.aviso ? `<p class="aviso">${esc(R.aviso)}</p>` : ""}`
    : RUBROS.map(r => `<a class="rb" href="./?r=${encodeURIComponent(r.id)}" style="--rb:${esc(r.color || "#FFF1E6")}">${r.imagen ? `<img src="${esc(imgUrl(r.imagen))}" alt="" loading="lazy">` : ""}<span>${esc(r.nombre)}</span></a>`).join("");
  // Banners de la ciudad
  const bs = banners.filter(b => b.activo !== false && (!b.prov || b.prov === provKey(c.dep, c.prov))).sort((a, b) => (a.orden ?? 9) - (b.orden ?? 9));
  $("#banners").innerHTML = bs.map(b => `<a class="bn" href="${esc(enlaceBanner(b))}" style="--bn:${esc(b.color || "#E63946")}"><div><b>${esc(b.titulo || "")}</b><p>${esc(b.texto || "")}</p>${b.boton ? `<span>${esc(b.boton)} →</span>` : ""}</div>${b.imagen ? `<img src="${esc(imgUrl(b.imagen))}" alt="" loading="lazy" onerror="this.remove()">` : ""}</a>`).join("");
  $("#banners").hidden = !bs.length;
  window.bloqueBuscar && bloqueBuscar(ns, rid);
  // Carrusel de accesos: paquete y repartidor solo en el inicio; repuestos/auxilio también dentro de su categoría
  const pr = $(".promos"); if (pr) { const W2 = CONF.web, env = $("#prEnv"), rep = $("#prRep");
    if (env) { env.hidden = !!rid || !W2.btnEnvio; $("#prEnvT").textContent = W2.envTit; $("#prEnvX").textContent = W2.envTxt; }
    if (rep) { rep.hidden = !!rid || !W2.btnRep; $("#prRepT").textContent = W2.repTit; $("#prRepX").textContent = W2.repTxt; }
    pr.style.display = $$(".promo", pr).some(x => !x.hidden && !x.closest("[hidden]")) ? "" : "none"; }
  const base = ns.filter(n => !rid || (n.rubro || "comida") === rid);
  let dest = []; if (W.mostrarDestacados) $("#destTit").textContent = W.tituloDestacados;   // los destacados llegan después: no frenan la lista
  const pintar = () => {
    const d = DIR.get(), q = norm(FILTRO.q);
    const l = base.filter(n => (!FILTRO.tipo || n.tipo === FILTRO.tipo) && (!q || norm([n.nombre, n.tipo, n.descripcion, rubroDe(n.rubro).nombre].join(" ")).includes(q)))
      .map(n => ({ ...n, ab: estaAbierto(n), km: d ? distanciaKm(n.ubic, d) : null })).sort((a, b) => (b.ab - a.ab) || ((a.km ?? 99) - (b.km ?? 99)));
    const tipos = [...new Set(base.map(n => n.tipo).filter(Boolean))];
    $("#tipos").innerHTML = rid && tipos.length > 1 ? `<button class="chip ${!FILTRO.tipo ? "on" : ""}" data-tipo="">Todos</button>` + tipos.map(t => `<button class="chip ${FILTRO.tipo === t ? "on" : ""}" data-tipo="${esc(t)}">${esc(t)}</button>`).join("") : "";
    $("#tipos").hidden = !$("#tipos").innerHTML;
    const ids = new Set(l.map(n => n.id)), ds = dest.filter(p => ids.has(p.neg) && (!q || norm(p.nombre + " " + p.negNombre).includes(q)));
    $("#destBox").hidden = !ds.length;
    // Ofertas primero (las que tienen «precio antes»)
    $("#dest").innerHTML = ds.slice().sort((a, b) => dtoDe(b) - dtoDe(a)).map(p => `<a class="dp" href="negocio?n=${encodeURIComponent(p.neg)}&p=${encodeURIComponent(p.id)}"><div class="dp-f">${fotoP(p)}<span class="dp-add" aria-hidden="true">+</span></div>
      ${precioHTML(p, rubroDe(p.rubro).modo === "servicios")}<b>${esc(p.nombre)}</b><small>${esc(p.negNombre)} · ${estrellasNeg(p)}</small></a>`).join("");
    const nomR = rid ? R.nombre : "", vacio = `<div class="vacio">🔎<h2>Aún no hay negocios${rid ? " de " + esc(nomR.toLowerCase()) : ""} en ${esc(c.prov)}</h2><p class="muted">Prueba con otra categoría o cambia de ciudad.</p><button class="btn btn-light js-ciudad2">Cambiar de ciudad</button></div>`;
    const tarjeta = (n, lejos) => { const rr = rubroDe(n.rubro), serv = rr.modo === "servicios", cd = d && !serv ? costoNeg(n, n.km) : null;
      const info = serv ? " · 🔧 Servicio" : lejos ? ` · 📍 ${n.km.toFixed(0)} km · ${n.recojo !== false ? "<b class='neg-f'>Solo recojo</b>" : "<b class='neg-f'>No llega a tu zona</b>"}`
        : n.delivery === false ? ` · ⏱ ${esc(n.tiempo || "30-40 min")} · 🏪 Solo recojo` : ` · ⏱ ${esc(d ? tiempoEst(n, n.km) : (n.tiempo || "30-40 min"))}${cd > 0 ? ` · 🛵 ${S(cd)}` : ""}`;
      return `<a class="neg ${n.ab ? "" : "cerr"} ${lejos ? "lejos" : ""}" href="negocio?n=${encodeURIComponent(n.id)}">
      <div class="neg-p">${n.portada ? `<img src="${esc(n.portada)}" alt="" loading="lazy" onerror="this.remove()">` : ""}${n.ab ? "" : `<span class="tag-c">Cerrado · abre ${esc(n.abre || "")}</span>`}${n.demo ? `<span class="tag-e">Ejemplo</span>` : ""}</div>
      <div class="neg-b">${n.logo ? `<img class="neg-l" src="${esc(n.logo)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="neg-l ph">${esc((n.nombre || "?")[0])}</span>`}<div><h3>${esc(n.nombre)} ${estrellasNeg(n)}</h3>
      <p>${esc(n.tipo || rr.nombre)}${info}${n.distrito ? ` · ${esc(n.distrito)}` : ""}</p></div></div></a>`; };
    if (!d || !l.length) {   // sin dirección todavía: una sola lista
      $("#negTit").textContent = rid ? `${nomR} en ${c.prov}` : CONF.web.tituloNegocios;
      box.innerHTML = l.map(n => tarjeta(n)).join("") || vacio;
    } else {
      // Cerca de ti: les llega el delivery (según el radio de cada negocio). Más lejos: solo para recoger.
      const lejos = n => rubroDe(n.rubro).modo !== "servicios" && n.km != null && n.km > radioNeg(n);
      const cerca = l.filter(n => !lejos(n)), lej = l.filter(lejos);
      $("#negTit").textContent = rid ? `${nomR} cerca de ti` : "Cerca de ti";
      box.innerHTML = (cerca.map(n => tarjeta(n)).join("") || `<div class="negs-sep vacio-s">🛵 <span>Aún no hay negocios${rid ? " de " + esc(nomR.toLowerCase()) : ""} con delivery hasta tu dirección.${lej.length ? " Mira abajo los que puedes recoger." : ""}</span></div>`)
        + (lej.length ? `<div class="negs-sep"><h2 class="h2">Más lejos · solo para recoger</h2><p class="muted">Su delivery no llega hasta tu dirección. Puedes pedir y recogerlo en el local.</p></div>${lej.map(n => tarjeta(n, true)).join("")}` : "");
    }
    $(".js-ciudad2")?.addEventListener("click", () => elegirCiudad());
  };
  window.recalcular = pintar; pintar();
  if (W.mostrarDestacados) destacadosCiudad(ns).then(l => { dest = l; pintar(); }).catch(() => {});
  $("#tipos").onclick = e => { const b = e.target.closest("[data-tipo]"); if (b) { FILTRO.tipo = b.dataset.tipo; pintar(); } };
  $("#buscar").oninput = e => { FILTRO.q = e.target.value; pintar(); };
}

// Si llegó información nueva (negocios, banners, portada), se vuelve a pintar el inicio sin recargar
let REPINTA = null;
function repintarInicio() { if (!$("#negocios")) return; clearTimeout(REPINTA); REPINTA = setTimeout(() => { aplicarTextos(); paginaInicio(); }, 150); }
function aplicarTextos() { $$(".js-pie").forEach(e => e.textContent = CONF.web.pie);
  $$(".js-redes").forEach(e => e.innerHTML = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"]].filter(([k]) => CONF.web[k]).map(([k, t]) => `<a href="${esc(CONF.web[k])}" target="_blank" rel="noopener">${t}</a>`).join(" · ")); }

/* =========== NEGOCIO: su carta =========== */
let NEG = null, CATS = [], PRODS = [];
async function paginaNegocio() {
  const box = $("#carta"); if (!box) return; const id = params.get("n");
  NEG = id ? await DB.get("negocios", id).catch(() => null) : null; window.NEG = NEG;
  if (!NEG || NEG.estado !== "activo" || NEG.bloqueoCobro) { box.innerHTML = `<div class="vacio">😕<h2>Este negocio no está disponible</h2><a class="btn btn-red" href="./">Ver otros negocios</a></div>`; return; }
  document.title = NEG.nombre + " · Apamuy";
  [CATS, PRODS] = await Promise.all([DB.list(`negocios/${id}/categorias`), DB.list(`negocios/${id}/productos`)]);
  CATS.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)); PRODS = PRODS.filter(p => p.activo !== false).sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
  const RB = rubroDe(NEG.rubro || "comida"), SERV = RB.modo === "servicios"; window.SERV = SERV;
  if (RB.mayorEdad && !sessionStorage.getItem("am_18")) confirmar18();
  const ab = estaAbierto(NEG), d = DIR.get(), km = d ? distanciaKm(NEG.ubic, d) : null, c = NEG.delivery === false ? null : costoNeg(NEG, km);
  $("#negHead").innerHTML = `<div class="nh-p">${NEG.portada ? `<img src="${esc(NEG.portada)}" alt="" onerror="this.remove()">` : ""}</div>
    <div class="nh-b">${NEG.logo ? `<img class="neg-l" src="${esc(NEG.logo)}" alt="">` : `<span class="neg-l ph">${esc(NEG.nombre[0])}</span>`}<div><h1>${esc(NEG.nombre)}</h1><p class="nh-rt">${estrellasNeg(NEG)}</p>
    <p class="muted">${esc(NEG.tipo || "")} · ${esc(NEG.direccion || "")}</p><p><span class="estado ${ab ? "on" : "off"}">${ab ? `Abierto hasta las ${esc(NEG.cierra)}` : `Cerrado · abre a las ${esc(NEG.abre)}`}</span> · ⏱ ${esc(c > 0 ? tiempoEst(NEG, km) : (NEG.tiempo || "30-40 min"))}${NEG.delivery === false ? " · 🏪 Solo recojo" : c == null ? "" : c < 0 ? "" : ` · 🛵 Delivery ${S(c)}`}</p>
    ${c != null && c < 0 && !SERV ? `<p class="aviso sm">📍 Estás a ${km.toFixed(0)} km. Su delivery llega hasta ${radioNeg(NEG)} km${NEG.recojo !== false ? ": puedes pedir y <b>recogerlo en el local</b>." : "."}</p>` : ""}
    ${NEG.descripcion ? `<p>${esc(NEG.descripcion)}</p>` : ""}${RB.aviso ? `<p class="aviso sm">${esc(RB.aviso)}</p>` : ""}${NEG.demo ? `<p class="aviso sm">🧪 Tienda de ejemplo para mostrar cómo funciona Apamuy.</p>` : ""}</div></div>`;
  const cats = CATS.filter(k => PRODS.some(p => p.cat === k.id)), dest = PRODS.filter(p => p.destacado && !p.agotado);
  $("#chips").innerHTML = (dest.length ? `<a href="#c-dest" class="chip on">⭐ Favoritos</a>` : "") + cats.map(k => `<a href="#c-${esc(k.id)}" class="chip">${esc(k.nombre)}</a>`).join("");
  const card = p => `<article class="card ${p.agotado ? "agot" : ""}"><button type="button" class="card-b" data-p="${esc(p.id)}" ${p.agotado || !ab ? "disabled" : ""} aria-label="${esc(p.nombre)}">
    <div class="card-img">${fotoP(p)}${p.agotado ? `<span class="tag-ag">Agotado</span>` : dtoDe(p) ? `<span class="tag-dto">-${dtoDe(p)}%</span>` : p.destacado ? `<span class="tag-st">⭐ Favorito</span>` : ""}</div>
    <div class="card-t"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc || "")}</p><div class="card-f">${precioHTML(p, SERV)}${p.agotado || !ab ? "" : SERV ? `<span class="add sol">Solicitar</span>` : `<span class="add">+</span>`}</div></div></button></article>`;
  box.innerHTML = (ab ? "" : `<div class="aviso">🔒 Ahora está cerrado. Puedes ver la carta y pedir desde las ${esc(NEG.abre)}.</div>`)
    + (dest.length ? `<section class="sec" id="c-dest"><h2>⭐ Favoritos</h2><div class="grid">${dest.map(card).join("")}</div></section>` : "")
    + cats.map(k => `<section class="sec" id="c-${esc(k.id)}"><h2>${esc(k.nombre)}</h2><div class="grid">${PRODS.filter(p => p.cat === k.id).map(card).join("")}</div></section>`).join("")
    + (PRODS.filter(p => !cats.some(k => k.id === p.cat)).length ? `<section class="sec"><h2>Más</h2><div class="grid">${PRODS.filter(p => !cats.some(k => k.id === p.cat)).map(card).join("")}</div></section>` : "");
  box.onclick = e => { const b = e.target.closest("[data-p]"); if (b) SERV ? solicitarServicio(b.dataset.p) : abrirProducto(b.dataset.p); };
  window.recalcular = () => paginaNegocio(); pintarBadge();
  const pp = params.get("p"); if (pp && ab && !window._pAbierto) { window._pAbierto = 1; SERV ? solicitarServicio(pp) : abrirProducto(pp); }
}
function abrirProducto(id) {
  const p = PRODS.find(x => x.id === id); if (!p || p.agotado) return;
  const grupos = p.opciones || [], extras = p.extrasGratis ? (NEG.extrasGratis || []) : [];
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="hp-img">${fotoP(p)}</div>
    <form class="hp" id="hpF" novalidate><h2>${esc(p.nombre)}</h2><p class="muted">${esc(p.desc || "")}</p><div class="hp-pr">${precioHTML(p)}</div>
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

/* ---------- Licorería: solo mayores de 18 ---------- */
function confirmar18() {
  const h = hoja(`<div class="vacio">🔞<h2>¿Eres mayor de 18 años?</h2><p class="muted">Esta tienda vende bebidas alcohólicas. La venta a menores de edad está prohibida.</p>
    <button class="btn btn-red" id="si18">Sí, soy mayor de 18</button><a class="btn btn-light" href="./">No, volver</a></div>`);
  h.onclick = e => { if (e.target === h) location.href = "./"; };
  $("#si18", h).onclick = () => { sessionStorage.setItem("am_18", "1"); cerrarHoja(); };
}

/* ---------- Talleres: solicitar un servicio ---------- */
function solicitarServicio(id) {
  const p = PRODS.find(x => x.id === id); if (!p) return;
  asegurarCliente(() => {
    const d = DIR.get();
    const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck" id="svF" novalidate><h2>Solicitar: ${esc(p.nombre)}</h2><p class="muted">en <b>${esc(NEG.nombre)}</b> · desde ${S(p.precio)}. El precio final lo confirma el taller.</p>
      <label>¿Qué necesitas? *<textarea id="svDet" rows="3" maxlength="400" placeholder="Ej. mi moto no enciende, llanta pinchada en la avenida…"></textarea></label>
      <div class="seg"><button type="button" data-l="taller" class="on">🔧 Lo llevo al taller</button><button type="button" data-l="domicilio">🏠 Que vengan a mí</button></div>
      <div id="svDir" hidden><div class="dir-b"><div><small>Dirección</small><b class="js-dir"></b></div><button type="button" class="btn btn-light btn-sm" id="svCambiar">Cambiar</button></div></div>
      <label>¿Cuándo? <small>(opcional)</small><input id="svF2" type="datetime-local"></label>
      <p class="err" id="svE" role="alert"></p><button class="btn btn-red btn-lg">Enviar solicitud</button></form>`);
    let lugar = "taller"; pintarDir();
    h.addEventListener("click", e => { const b = e.target.closest("[data-l]"); if (b) { lugar = b.dataset.l; $$("[data-l]", h).forEach(x => x.classList.toggle("on", x === b)); $("#svDir", h).hidden = lugar !== "domicilio"; } });
    $("#svCambiar", h).onclick = () => elegirDireccion(() => solicitarServicio(id));
    $("#svF", h).onsubmit = async e => { e.preventDefault(); const det = $("#svDet", h).value.trim(), dd = DIR.get();
      if (!det) return $("#svE").textContent = "Cuéntanos qué necesitas."; if (lugar === "domicilio" && !dd) return $("#svE").textContent = "Elige tu dirección.";
      const cod = codigo("AP"), b = $("button.btn-red", h); b.disabled = true; b.textContent = "Enviando…";
      try {
        await DB.set("pedidos", cod, { codigo: cod, negocioId: NEG.id, negocio: { nombre: NEG.nombre, logo: NEG.logo || "", telefono: NEG.telefono || "", whatsapp: NEG.whatsapp || "", direccion: NEG.direccion || "", ubic: NEG.ubic || null },
          clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, items: [{ id: p.id, n: p.nombre, cant: 1, precio: p.precio, opts: "", extras: "", nota: det.slice(0, 140) }],
          subtotal: p.precio, envio: 0, km: 0, total: p.precio, entrega: "servicio", destino: lugar === "domicilio" ? { texto: dd.texto, referencia: dd.referencia || "", lat: dd.lat, lng: dd.lng } : null, nota: "",
          servicio: { detalle: det, lugar, fecha: $("#svF2", h).value || "" }, pago: "A coordinar", estado: "nuevo", dia: HOY(), mes: HOY().slice(0, 7), creado: new Date().toISOString() }, false);
        const tel = NEG.telefono || "", w = NEG.whatsapp || "";
        hoja(`<div class="vacio">✅<h2>Solicitud enviada</h2><p class="muted">${esc(NEG.nombre)} la recibió. Llámalos para coordinar más rápido.</p>
          ${tel ? `<a class="btn btn-red btn-lg" href="tel:${esc(tel)}">📞 Llamar al taller</a>` : ""}${w ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(wa(w, `Hola ${NEG.nombre} 👋 te envié una solicitud por Apamuy (${cod}): ${p.nombre}. ${det}`))}">Escribir por WhatsApp</a>` : ""}
          <a class="btn btn-light" href="pedido?c=${encodeURIComponent(cod)}">Ver mi solicitud</a></div>`);
      } catch (x) { console.error(x); b.disabled = false; b.textContent = "Enviar solicitud"; $("#svE").textContent = "No se pudo enviar. Revisa tu conexión."; }
    };
  });
}

/* ---------- Carrito ---------- */
function abrirCarrito() {
  const c = CART.get();
  if (!c.items.length) return hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="vacio">🛒<h2>Tu pedido está vacío</h2><a class="btn btn-red" href="./">Ver negocios</a></div>`);
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="cart"><h2>Tu pedido</h2><p class="muted">en <b>${esc(c.nombre)}</b></p><div id="cartL"></div>
    <div class="cart-f"><div class="tot"><span>Subtotal</span><b class="js-subt">${S(CART.subtotal())}</b></div><button class="btn btn-red btn-lg" id="irPago">Continuar</button>
    ${window.NEG && NEG.id === c.negocio ? `<button class="btn btn-light" data-cerrar>Seguir agregando</button>` : `<a class="btn btn-light" href="negocio?n=${encodeURIComponent(c.negocio)}">Volver a ${esc(c.nombre)}</a>`}</div></div>`);
  const pintar = () => { const l = CART.get().items; if (!l.length) { CART.vaciar(); return abrirCarrito(); }
    $("#cartL", h).innerHTML = l.map((x, i) => `<div class="ci"><div><b>${esc(x.n)}</b>${detItem(x).map(d => `<small>${esc(d)}</small>`).join("")}<span>${S(x.precio * x.cant)}</span></div>
      <div class="qty sm"><button type="button" data-i="${i}" data-d="-1" aria-label="Menos">${x.cant === 1 ? "🗑" : "−"}</button><b>${x.cant}</b><button type="button" data-i="${i}" data-d="1" aria-label="Más">+</button></div></div>`).join("");
    $(".js-subt", h).textContent = S(CART.subtotal()); pintarBadge(); };
  pintar();
  h.addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (!b) return; const cc = CART.get(), x = cc.items[+b.dataset.i]; x.cant += +b.dataset.d; if (x.cant <= 0) cc.items.splice(+b.dataset.i, 1); CART.set(cc); pintar(); });
  $("#irPago", h).onclick = () => asegurarCliente(checkout);
}

/* ---------- Finalizar pedido ---------- */
/* ---------- 🧾 Boleta o factura (la emite el NEGOCIO con su RUC; Apamuy solo le pasa los datos) ----------
   Boleta: DNI opcional (obligatorio desde S/ 700, como pide SUNAT). Factura: RUC → razón social y dirección solas. */
function Comprobante(box, total) {
  const g = store.get("am_comp", {}); let tipo = g.tipo === "factura" ? "factura" : "boleta", V = { ...g }, abierto = !!g.tipo;
  const pintar = () => {
    box.innerHTML = !abierto ? `<button type="button" class="ck-row" id="cmpAb">${icoW("receipt")}<div><b>Boleta con DNI o factura</b><small>Opcional · la emite el negocio</small></div><span>Agregar</span></button>`
      : `<div class="cmp"><div class="cmp-h"><b>¿Qué comprobante necesitas?</b><button type="button" class="btn-link" id="cmpX">Quitar</button></div>
      <div class="seg sm"><button type="button" data-cmp="boleta" class="${tipo === "boleta" ? "on" : ""}">Boleta</button><button type="button" data-cmp="factura" class="${tipo === "factura" ? "on" : ""}">Factura</button></div>
      ${tipo === "boleta" ? `<div class="cmp-r"><input id="cmpDoc" inputmode="numeric" maxlength="8" placeholder="DNI${total() >= 700 ? "" : " (opcional)"}" value="${esc(V.tipo === "boleta" ? V.doc || "" : "")}">${CONF.verificarDni ? `<button type="button" class="btn btn-light" id="cmpBus">Buscar</button>` : ""}</div>
        <input id="cmpNom" maxlength="120" placeholder="Nombre completo" value="${esc(V.tipo === "boleta" ? V.nombre || "" : PERFIL.nombre || "")}">`
      : `<div class="cmp-r"><input id="cmpDoc" inputmode="numeric" maxlength="11" placeholder="RUC (11 números)" value="${esc(V.tipo === "factura" ? V.doc || "" : "")}">${CONF.verificarDni ? `<button type="button" class="btn btn-light" id="cmpBus">Buscar</button>` : ""}</div>
        <input id="cmpNom" maxlength="160" placeholder="Razón social" value="${esc(V.tipo === "factura" ? V.nombre || "" : "")}"><input id="cmpDirF" maxlength="200" placeholder="Dirección fiscal" value="${esc(V.tipo === "factura" ? V.direccion || "" : "")}">`}
      <small id="cmpM" class="${V.verificado && V.tipo === tipo ? "ok-t" : "muted"}">${V.verificado && V.tipo === tipo ? `✓ Verificado${V.estado ? ` · ${esc(V.estado)}${V.condicion ? " · " + esc(V.condicion) : ""}` : ""}` : `La emite el negocio.${CONF.verificarDni ? (tipo === "factura" ? " Toca «Buscar» y se llenan los datos solos." : " Con tu DNI, toca «Buscar» y se llena tu nombre.") : ""}`}</small></div>`;
  };
  pintar();
  box.addEventListener("click", async e => {
    if (e.target.closest("#cmpAb")) { abierto = true; return pintar(); }
    if (e.target.closest("#cmpX")) { abierto = false; store.set("am_comp", {}); V = {}; return pintar(); }
    const t = e.target.closest("[data-cmp]"); if (t) { tipo = t.dataset.cmp; return pintar(); }
    if (e.target.closest("#cmpBus")) {
      const doc = $("#cmpDoc", box).value.replace(/\D/g, ""), m = $("#cmpM", box), b = $("#cmpBus", box);
      if (tipo === "boleta" ? !/^\d{8}$/.test(doc) : !rucOk(doc)) { m.className = "err"; m.textContent = tipo === "boleta" ? "El DNI tiene 8 números." : "El RUC tiene 11 números y empieza con 10 o 20."; return; }
      b.disabled = true; b.textContent = "…"; m.className = "muted"; m.textContent = tipo === "boleta" ? "Consultando en RENIEC…" : "Consultando en SUNAT…";
      try {
        if (tipo === "boleta") { const r = await llamarServidor("verificarDni", { dni: doc, para: "comprobante" }); V = { tipo, doc, nombre: r.nombre, verificado: true }; }
        else { const r = await llamarServidor("verificarRuc", { ruc: doc, para: "comprobante" }); V = { tipo, doc, nombre: r.razonSocial, direccion: r.direccion, estado: r.estado, condicion: r.condicion, verificado: true }; }
        pintar();
        if (tipo === "factura" && V.estado && V.estado !== "ACTIVO") { const m2 = $("#cmpM", box); m2.className = "err"; m2.textContent = `Este RUC figura como «${V.estado}» en SUNAT: no se le puede emitir factura.`; }
      } catch (x) { V = { tipo, doc }; m.className = "err"; m.textContent = errConsulta(x, tipo === "boleta" ? "ese DNI" : "ese RUC"); }
      b.disabled = false; b.textContent = "Buscar";
    }
  });
  box.addEventListener("input", e => { if (e.target.id === "cmpDoc") { e.target.value = e.target.value.replace(/\D/g, ""); if (V.doc !== e.target.value) V = { tipo }; } });
  const leer = () => !abierto ? null : { tipo, doc: $("#cmpDoc", box).value.replace(/\D/g, ""), nombre: $("#cmpNom", box).value.trim(), direccion: tipo === "factura" ? $("#cmpDirF", box).value.trim() : "",
    verificado: !!(V.verificado && V.doc === $("#cmpDoc", box).value.replace(/\D/g, "")), ...(tipo === "factura" && V.estado ? { estado: V.estado, condicion: V.condicion || "" } : {}) };
  return {
    validar() { const c = leer(); if (!c) return "";
      if (c.tipo === "boleta") { if (c.doc && !/^\d{8}$/.test(c.doc)) return "El DNI de la boleta tiene 8 números."; if (total() >= 700 && !c.doc) return "Para boletas desde S/ 700, SUNAT pide el DNI."; if (c.doc && !c.nombre) return "Escribe el nombre para la boleta."; }
      else { if (!rucOk(c.doc)) return "Escribe un RUC válido para la factura (11 números)."; if (!c.nombre) return "Falta la razón social (toca «Buscar»)."; if (!c.direccion) return "Falta la dirección fiscal de la factura."; if (c.estado && c.estado !== "ACTIVO") return "Ese RUC no está activo en SUNAT."; }
      store.set("am_comp", c); return ""; },
    datos: () => { const c = leer(); return c && (c.tipo === "factura" || c.doc) ? c : c ? { tipo: "boleta", doc: "", nombre: "" } : null; }
  };
}

async function checkout() {
  const c = CART.get(), neg = (window.NEG && NEG.id === c.negocio) ? NEG : await DB.get("negocios", c.negocio);
  if (!neg || neg.estado !== "activo" || neg.bloqueoCobro) return toast("Este negocio no está disponible ahora", true);
  if (!estaAbierto(neg)) return toast(`${neg.nombre} está cerrado. Abre a las ${neg.abre}.`, true);
  // Si su delivery no llega hasta la dirección del cliente, empieza en «Recojo»
  const kmIni = DIR.get() ? distanciaKm(neg.ubic, DIR.get()) : null;
  let entrega = neg.delivery !== false && !(neg.recojo !== false && kmIni != null && kmIni > radioNeg(neg)) ? "delivery" : "recojo";
  const nItems = CART.get().items.reduce((t, x) => t + (+x.cant || 0), 0), esComida = (neg.rubro || "comida") === "comida";
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck ck2" id="ckF" novalidate>
    <div class="ck-head"><span class="ck-logo ph">${esc((neg.nombre || "?")[0])}${neg.logo ? `<img src="${esc(neg.logo)}" alt="" onerror="this.remove()">` : ""}</span><div><h2>Finalizar pedido</h2><p>${esc(neg.nombre)} · ${nItems} producto${nItems === 1 ? "" : "s"}</p></div></div>
    <section class="ck-s"><h4>${icoW("bike")} Entrega</h4>
      <div class="seg">${neg.delivery !== false ? `<button type="button" data-e="delivery">${icoW("bike")} Delivery</button>` : ""}${neg.recojo !== false ? `<button type="button" data-e="recojo">${icoW("store")} Recojo en tienda</button>` : ""}</div>
      <div id="ckD"><button type="button" class="ck-row" id="ckDir">${icoW("pin")}<div><small>Entregar en</small><b class="js-dir"></b></div><span>Cambiar</span></button></div>
      <div id="ckR"><div class="ck-row">${icoW("store")}<div><small>Recoges en</small><b>${esc(neg.direccion || "")}</b>${neg.referencia ? `<small>${esc(neg.referencia)}</small>` : ""}</div></div></div></section>
    <section class="ck-s"><h4>${icoW("user")} Tus datos</h4>
      <button type="button" class="ck-row" id="ckYo">${icoW("user")}<div><small>${esComida ? "Recibe" : "A nombre de"}</small><b>${esc(PERFIL.nombre)} · ${esc(PERFIL.celular)}</b></div><span>Cambiar</span></button>
      <label class="ck-nota">${icoW("edit")}<input id="ckNota" maxlength="140" placeholder="${esComida ? "Nota (opcional): sin cubiertos, tocar timbre…" : "Nota para el negocio (opcional)"}"></label>
      ${rubroDe(neg.rubro).mayorEdad ? `<label class="chk18"><input type="checkbox" id="ck18"> <span>Confirmo que soy <b>mayor de 18 años</b> y mostraré mi DNI al recibir.</span></label>` : ""}</section>
    <section class="ck-s"><h4>${icoW("receipt")} Comprobante</h4><div id="ckComp"></div></section>
    <section class="ck-s"><h4>${icoW("bag")} Resumen</h4><div class="resumen" id="ckRes"></div></section>
    <section class="ck-s"><h4>${icoW("wallet")} Pago <small>· directo a ${esc(neg.nombre)}</small></h4><div id="pagoBox"></div></section>
    <div class="ck-foot"><p class="err" id="ckErr" role="alert"></p><div class="ck-fr"><div class="ck-tot"><small>Total a pagar</small><b id="ckTot"></b></div><button class="btn btn-red btn-lg" id="ckBtn">Hacer pedido</button></div>
      <p class="ck-seg">${icoW("lock")} Pagas directo a ${esc(neg.nombre)} con Yape, Plin o efectivo.</p></div></form>`, "ck-h");
  pintarDir();
  const pago = Pago($("#pagoBox", h), neg, { contraEntrega: neg.contraEntrega !== false, onChange: () => resumen() });
  const comp = Comprobante($("#ckComp", h), () => CART.subtotal() + Math.max(0, envio() || 0));
  const km = () => entrega === "delivery" ? distanciaKm(neg.ubic, DIR.get()) : 0, envio = () => entrega === "delivery" ? costoNeg(neg, km()) : 0;
  const efectivo = () => pago.estado.met === "Efectivo";
  function resumen() {
    const e = envio(), sub = CART.subtotal(), tot = r2(sub + Math.max(0, e || 0));
    const tt = $("#ckTot", h); if (tt) tt.textContent = S(tot);
    $("#ckRes", h).innerHTML = `<div><span>${esComida ? "Comida" : "Productos"} <small>(${nItems})</small></span><b>${S(sub)}</b></div>${entrega === "delivery" ? `<div><span>Delivery ${km() >= .1 ? `<small>(${km().toFixed(1)} km)</small>` : ""}</span><b>${e == null ? "Elige tu dirección" : e < 0 ? `No llega (máx. ${radioNeg(neg)} km)` : S(e)}</b></div>` : ""}
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
    if ($("#ck18", h) && !$("#ck18", h).checked) return err.textContent = "Confirma que eres mayor de 18 años.";
    const ce = comp.validar(); if (ce) return err.textContent = ce;
    const pe = pago.validar(); if (pe) return err.textContent = pe;
    const pd = pago.datos(), cod = codigo("AP"), b = $("#ckBtn", h); b.disabled = true; b.textContent = "Enviando pedido…";
    try {
      const captura = pd.captura ? await subirFoto(`capturas/${YO.uid}/${cod}.jpg`, pd.captura) : "";
      const ped = { codigo: cod, negocioId: neg.id, negocio: { nombre: neg.nombre, rubro: neg.rubro || "comida", logo: neg.logo || "", telefono: neg.telefono || "", whatsapp: neg.whatsapp || "", direccion: neg.direccion || "", ubic: neg.ubic || null },
        clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, items: CART.get().items.map(x => ({ id: x.id, n: x.n, cant: x.cant, precio: x.precio, opts: x.opts || "", extras: x.extras || "", nota: x.nota || "" })),
        subtotal: sub, envio: entrega === "delivery" ? env : 0, km: entrega === "delivery" ? r2(km()) : 0, total: r2(sub + (entrega === "delivery" ? env : 0)), entrega,
        destino: entrega === "delivery" ? { texto: d.texto, referencia: d.referencia || "", lat: d.lat, lng: d.lng } : null, nota: $("#ckNota", h).value.trim(),
        pago: pd.pago, operacion: pd.operacion, montoLeido: pd.montoLeido, coincide: pd.coincide, fechaOk: pd.fechaOk, pagaCon: pd.pagaCon, captura,
        ...($("#ck18", h) ? { mayorEdad: true } : {}), ...(CART.get().solicitud ? { solicitud: CART.get().solicitud } : {}), ...(comp.datos() ? { comprobante: comp.datos() } : {}), estado: pd.pago === "Efectivo" ? "nuevo" : "por-validar", dia: HOY(), mes: HOY().slice(0, 7), creado: new Date().toISOString() };
      // Si viene de «Buscar repuesto», la búsqueda queda como elegida en la misma operación
      await DB.batch([{ op: "set", col: "pedidos", id: cod, merge: false, data: ped }, ...(ped.solicitud ? [{ op: "set", col: "solicitudes", id: ped.solicitud, data: { estado: "elegida", elegida: neg.id, pedido: cod, actualizado: ped.creado } }] : [])]);
      if (ped.solicitud && store.get("am_busq", null)?.id === ped.solicitud) store.set("am_busq", null);
      CART.vaciar(); cerrarHoja(); location.href = `pedido?c=${encodeURIComponent(cod)}&nuevo=1`;
    } catch (x) { console.error(x); b.disabled = false; b.textContent = "Hacer pedido"; err.textContent = "No se pudo enviar el pedido. Revisa tu conexión e inténtalo otra vez."; }
  };
}

/* =========== SEGUIMIENTO =========== */
const PASOS = { servicio: [["nuevo", "Solicitud enviada", "📝"], ["cocina", "Aceptado", "🔧"], ["entregado", "Terminado", "✅"]], delivery: [["nuevo", "Recibido", "📝"], ["cocina", "Preparando", "🔥"], ["camino", "En camino", "🛵"], ["entregado", "Entregado", "✅"]],
  recojo: [["nuevo", "Recibido", "📝"], ["cocina", "Preparando", "🔥"], ["listo", "Listo para recoger", "🛍️"], ["entregado", "Entregado", "✅"]] };
// Comida → «Preparando… ¡Buen provecho!». Ferretería, repuestos, farmacia… → «Alistando… ¡Gracias por tu compra!»
const pasosDe = (p, comida) => (PASOS[p.entrega] || PASOS.delivery).map(([k, t, ic]) => k === "cocina" && !comida && p.entrega !== "servicio" ? [k, "Alistando", "📦"] : [k, t, ic]);
const ORDEN = { "por-validar": 0, nuevo: 0, cocina: 1, listo: 2, camino: 2, entregado: 3 };
async function paginaPedido() {
  const box = $("#pedidoBox"); if (!box) return; const c = params.get("c");
  if (!c) { box.innerHTML = `<div class="vacio">🔎<h2>Sigue tu pedido</h2><a class="btn btn-red" href="mis-pedidos">Ver mis pedidos</a></div>`; return; }
  if (!YO) { box.innerHTML = `<div class="vacio">🔒<h2>Entra para ver tu pedido</h2><button class="btn btn-red js-entrar2">Entrar con Google</button></div>`; $(".js-entrar2").onclick = () => pedirEntrar("Entra con la misma cuenta con la que pediste."); return; }
  let M = null, ult = "";
  DB.escuchar("pedidos", c, async p => {
    if (!p) { box.innerHTML = `<div class="vacio">😕<h2>No encontramos el pedido ${esc(c)}</h2><a href="mis-pedidos">Ver mis pedidos</a></div>`; return; }
    const firma = p.estado + (p.tiempo || "") + (p.repartidor ? p.repartidor.nombre : ""); if (ult && ult !== firma) { navigator.vibrate?.(250); toast("Tu pedido se actualizó"); } ult = firma;
    const comida = (p.negocio?.rubro || "") === "comida" || (!p.negocio?.rubro && (p.items || []).some(x => x.extras || /plato|menú|combo|pollo|porción/i.test(x.n || "")));
    const pasos = pasosDe(p, comida), idx = p.entrega === "servicio" ? ({ nuevo: 0, cocina: 1, entregado: 2 }[p.estado] ?? -1) : (ORDEN[p.estado] ?? -1), malo = ["rechazado", "anulado"].includes(p.estado), r = p.repartidor || null;
    const titulo = p.entrega === "servicio" ? ({ nuevo: "Enviamos tu solicitud al taller", cocina: "El taller aceptó tu solicitud 🔧", entregado: "Servicio terminado" }[p.estado] || (p.estado === "anulado" ? "El taller no pudo atenderte" : p.estado)) : { "por-validar": "Estamos validando tu pago", nuevo: "¡El negocio recibió tu pedido!", cocina: comida ? "Tu pedido se está preparando 🔥" : "Están alistando tu pedido 📦", listo: p.entrega === "recojo" ? "¡Listo para recoger!" : r ? "¡Listo! Tu repartidor va a recogerlo" : "Listo, esperando al repartidor", camino: "Tu pedido va en camino 🛵", entregado: comida ? "¡Entregado! Buen provecho 😋" : "¡Entregado! Gracias por tu compra 🙌", rechazado: "No se pudo validar tu pago", anulado: "Tu pedido fue anulado" }[p.estado] || p.estado;
    box.innerHTML = `${params.get("nuevo") ? `<div class="ok-top">✓ Pedido enviado a <b>${esc(p.negocio.nombre)}</b> · código <b>${esc(p.codigo)}</b></div>` : ""}
      <div class="trk"><small>${esc(p.negocio.nombre)} · ${fmtFH(p.creado)}</small><h1>${esc(titulo)}</h1>
        ${p.estado === "cocina" && p.tiempo ? `<p class="eta">⏱ ${comida ? "Listo" : "Listo para entregar"} en aprox. <b>${esc(p.tiempo)} min</b></p>` : ""}
        ${r ? `<p class="rep-est">${p.estado === "camino" ? "🛵 Tu repartidor va hacia ti" : p.estado === "entregado" ? "Te lo llevó" : "🛵 Tu repartidor va al negocio por tu pedido"}</p>${tarjetaRep(r, { contacto: p.estado !== "entregado" })}`
          : p.entrega === "delivery" && p.oferta && ["cocina", "listo"].includes(p.estado) ? `<p class="eta">🔎 Buscando un repartidor cerca…</p>` : ""}
        ${malo ? `<div class="bad">${p.motivo ? esc(p.motivo) + ". " : ""}Escríbele al negocio para ayudarte.</div>` : `<ol class="pasos">${pasos.map(([k, t, ic], i) => `<li class="${i < idx || p.estado === "entregado" ? "done" : i === idx ? "now" : ""}"><i>${ic}</i><span>${t}</span></li>`).join("")}</ol>`}</div>
      ${p.entrega === "delivery" && !malo && p.estado !== "entregado" ? `<div class="mapa trk-m" id="trkMapa"></div><p class="muted sm">🏪 negocio · 🏠 tu dirección${r && r.ubic ? " · 🛵 repartidor en vivo" : ""}</p>
        <button class="btn btn-dark btn-lg" id="trkShare">${icoW("share")} Compartir seguimiento</button>` : ""}
      ${p.estado === "entregado" ? `<div id="trkCalN"></div>` : ""}${p.estado === "entregado" && r ? `<div id="trkCal"></div>` : ""}${!["entregado", "anulado", "rechazado"].includes(p.estado) ? `<div id="trkAv"></div>` : ""}
      <div class="det"><h3>Tu pedido</h3>${(p.items || []).map(x => `<div class="ci"><div><b>${x.cant}× ${esc(x.n)}</b>${detItem(x).map(d => `<small>${esc(d)}</small>`).join("")}</div><span>${S(x.precio * x.cant)}</span></div>`).join("")}
        <div class="resumen"><div><span>${comida ? "Comida" : "Productos"}</span><b>${S(p.subtotal)}</b></div>${p.envio ? `<div><span>Delivery</span><b>${S(p.envio)}</b></div>` : ""}<div class="t"><span>Total</span><b>${S(p.total)}</b></div></div>
        <p class="muted">${p.entrega === "delivery" ? `🏠 ${esc(p.destino?.texto || "")}${p.destino?.referencia ? " · " + esc(p.destino.referencia) : ""}` : `🏪 Recojo en ${esc(p.negocio.direccion || "")}`}<br>💳 ${esc(p.pago)}${p.pagaCon ? ` · pagas con ${S(p.pagaCon)} (vuelto ${S(p.pagaCon - p.total)})` : ""}</p></div>
      ${p.comprobante ? `<div class="det cmp-d"><h3>🧾 ${p.comprobante.tipo === "factura" ? "Factura" : "Boleta"}</h3><p>${p.comprobante.doc ? `${p.comprobante.tipo === "factura" ? "RUC" : "DNI"} ${esc(p.comprobante.doc)} · ${esc(p.comprobante.nombre)}` : "Boleta simple"}</p>
        ${p.comprobanteEmitido ? `<p class="ok-t">✅ Emitida: <b>${esc(p.comprobanteEmitido.numero)}</b></p>${p.comprobanteEmitido.url ? `<a class="btn btn-light btn-sm" href="${esc(p.comprobanteEmitido.url)}" target="_blank" rel="noopener">📄 Ver / descargar</a>` : ""}` : `<p class="muted">${esc(p.negocio?.nombre || "El negocio")} te la enviará aquí cuando la emita.</p>`}</div>` : ""}
      ${p.servicio ? `<div class="det"><h3>Tu solicitud</h3><p>${esc(p.servicio.detalle)}</p><p class="muted">${p.servicio.auxilio ? `🚨 Auxilio mecánico${p.servicio.llegaMin ? ` · llega en ~${p.servicio.llegaMin} min` : ""}` : p.servicio.lugar === "domicilio" ? "🏠 A domicilio" : "🔧 En el taller"}${p.servicio.fecha ? " · " + fmtFH(p.servicio.fecha) : ""}</p>${p.negocio.telefono ? `<a class="btn btn-red" href="tel:${esc(p.negocio.telefono)}">📞 Llamar al taller</a>` : ""}</div>` : ""}
      <div class="acts">${p.negocio.whatsapp ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(wa(p.negocio.whatsapp, `Hola ${p.negocio.nombre} 👋 consulto por mi pedido ${p.codigo} de Apamuy.`))}">Escribir a ${esc(p.negocio.nombre)}</a>` : ""}<a class="btn btn-light" href="./">Volver al inicio</a></div>`;
    cajaAvisos($("#trkAv"));
    $("#trkShare")?.addEventListener("click", async () => { let tk = p.rastreo;
      if (!tk) { tk = tokenRastreo(); try { await DB.batch([{ op: "set", col: "rastreo", id: tk, merge: false, data: { uid: YO.uid, col: "pedidos", ref: p.codigo, tipo: "pedido", titulo: p.negocio.nombre, estado: p.estado, origen: p.negocio.ubic ? { ...p.negocio.ubic, texto: p.negocio.nombre } : null, destino: p.destino ? { lat: p.destino.lat, lng: p.destino.lng, texto: p.destino.texto } : null, repartidor: r ? { ...r, ubic: null } : null, ubic: r?.ubic || null, creado: new Date().toISOString() } }, { op: "set", col: "pedidos", id: p.codigo, data: { rastreo: tk } }]); } catch (x) { return toast("No se pudo crear el enlace: " + (x.code || x.message), true); } }
      compartirRuta(tk, `🛵 Mi pedido de ${p.negocio.nombre} va en camino con Apamuy.`); });
    // El enlace compartido se mantiene al día con el estado y el repartidor
    if (p.rastreo && p.clienteUid === YO.uid) { const sig = p.estado + "|" + (r ? r.uid : ""); if (store.get("am_rs_" + p.codigo, "") !== sig) { store.set("am_rs_" + p.codigo, sig); DB.set("rastreo", p.rastreo, { estado: p.estado, repartidor: r ? { ...r, ubic: null } : null }).catch(() => {}); } }
    if ($("#trkCal")) cajaCalificar($("#trkCal"), "pedidos", p.codigo, r);
    if ($("#trkCalN") && p.clienteUid === YO.uid) cajaCalNeg($("#trkCalN"), p);
    const el = $("#trkMapa"); if (el) { M = null; M = await mapaPuntos(el, [p.negocio.ubic && { ...p.negocio.ubic, color: "#E63946", txt: "🏪" }, p.destino && { ...p.destino, color: "#1A1430", txt: "🏠" }, r && r.ubic && { ...r.ubic, color: "#FFC21A", txt: "🛵" }]); }
  });
}

/* ---------- ⭐ El cliente califica al negocio (una vez por pedido entregado) ----------
   El servidor suma las estrellas al negocio; así nadie puede inflar su promedio. */
async function cajaCalNeg(el, p) {
  const ya = await DB.get("calificacionesNeg", p.codigo).catch(() => null), neg = p.negocio?.nombre || "el negocio";
  if (ya) { el.innerHTML = `<div class="cal ok"><b>Calificaste a ${esc(neg)}</b><span class="cal-e">${"★".repeat(ya.estrellas)}${"☆".repeat(5 - ya.estrellas)}</span></div>`; return; }
  let n = 0; const TX = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];
  el.innerHTML = `<div class="cal"><b>¿Qué tal tu compra en ${esc(neg)}?</b><small class="muted">Tu calificación ayuda a otros clientes a elegir.</small>
    <div class="cal-s" role="radiogroup" aria-label="Estrellas">${[1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${i} estrella${i > 1 ? "s" : ""}" data-e="${i}">${icoW("star")}</button>`).join("")}</div><small class="cal-t" id="cnT"></small>
    <textarea id="cnC" maxlength="200" rows="2" placeholder="¿Qué te gustó o qué pueden mejorar? (opcional)"></textarea><button class="btn btn-red" id="cnB" disabled>Enviar calificación</button></div>`;
  const pinta = () => { $$("[data-e]", el).forEach(b => { b.classList.toggle("on", +b.dataset.e <= n); b.setAttribute("aria-checked", +b.dataset.e === n); }); $("#cnT", el).textContent = TX[n] || ""; };
  $(".cal-s", el).onclick = e => { const b = e.target.closest("[data-e]"); if (!b) return; n = +b.dataset.e; pinta(); $("#cnB", el).disabled = false; };
  $("#cnB", el).onclick = async () => { $("#cnB", el).disabled = true;
    try {
      const cal = { negocioId: p.negocioId, clienteUid: YO.uid, cliente: String(PERFIL.nombre || "").split(" ")[0], estrellas: n, comentario: $("#cnC", el).value.trim().slice(0, 200), creado: new Date().toISOString() };
      await DB.set("calificacionesNeg", p.codigo, cal, false);
      if (DEMO) { const ng = await DB.get("negocios", p.negocioId); if (ng) await DB.set("negocios", p.negocioId, { estrellasSum: (+ng.estrellasSum || 0) + n, estrellasN: (+ng.estrellasN || 0) + 1 }); }   // en Firebase lo suma el servidor
      toast("¡Gracias por calificar! ⭐"); cajaCalNeg(el, p);
    } catch (x) { console.error(x); toast("No se pudo enviar: " + (x.code || x.message), true); $("#cnB", el).disabled = false; } };
}

/* =========== MIS PEDIDOS =========== */
async function paginaMisPedidos() {
  const box = $("#misBox"); if (!box) return;
  if (!YO) { box.innerHTML = `<div class="vacio">🧾<h2>Entra para ver tus pedidos</h2><button class="btn btn-red" id="mpE">Entrar con Google</button></div>`; $("#mpE").onclick = () => pedirEntrar("Entra para ver tus pedidos."); return; }
  const [ps, es] = await Promise.all([DB.list("pedidos", ["clienteUid", "==", YO.uid]), DB.list("envios", ["clienteUid", "==", YO.uid]).catch(() => [])]);
  const E = { "por-validar": "Validando pago", nuevo: "Recibido", cocina: "Preparando", listo: "Listo", camino: "En camino", entregado: "Entregado", rechazado: "Rechazado", anulado: "Anulado", buscando: "Buscando", asignado: "Asignado", cancelado: "Cancelado" };
  let T = params.get("t") || "todos";
  const pinta = () => { const l = [...(T !== "envios" ? ps.map(p => ({ ...p, _t: "p" })) : []), ...(T !== "pedidos" ? es.map(e => ({ ...e, _t: "e" })) : [])].sort((a, b) => String(b.creado).localeCompare(a.creado)).slice(0, 60);
    box.innerHTML = `<div class="seg3">${[["todos", "Todo"], ["pedidos", "Pedidos"], ["envios", "Envíos"]].map(([k, t]) => `<button class="${T === k ? "on" : ""}" data-mt="${k}">${t}</button>`).join("")}</div>`
      + (l.map(x => x._t === "p" ? `<a class="mp" href="pedido?c=${encodeURIComponent(x.codigo)}"><span class="mp-i">${icoW(x.entrega === "delivery" ? "bike" : "store")}</span><div><b>${esc(x.negocio.nombre)}</b><small>${fmtFH(x.creado)} · ${x.entrega === "delivery" ? "Delivery" : x.entrega === "servicio" ? "Servicio" : "Recojo"}</small>
          <small>${esc((x.items || []).map(i => `${i.cant}× ${i.n}`).join(", "))}</small></div><div><span class="e e-${esc(x.estado)}">${esc(E[x.estado] || x.estado)}</span><b>${S(x.total)}</b></div></a>`
        : `<a class="mp" href="envio?c=${encodeURIComponent(x.codigo)}"><span class="mp-i env">${icoW("box")}</span><div><b>Envío a ${esc(x.destino.dis || x.destino.texto)}</b><small>${fmtFH(x.creado)} · ${esc(TAM[x.tamano]?.[0] || "")}</small><small>${esc(x.contenido)}</small></div>
          <div><span class="e e-${esc(x.estado)}">${esc(E[x.estado] || x.estado)}</span><b>${S(x.precio ?? x.oferta)}</b></div></a>`).join("")
      || `<div class="vacio">${icoW(T === "envios" ? "box" : "receipt", "xl")}<h2>Aún no tienes ${T === "envios" ? "envíos" : "pedidos"}</h2><div class="acts"><a class="btn btn-red" href="./">Pedir ahora</a><a class="btn btn-light" href="enviar">Enviar un paquete</a></div></div>`); };
  pinta(); box.onclick = e => { const b = e.target.closest("[data-mt]"); if (b) { T = b.dataset.mt; pinta(); } };
}

/* =========== MI PERFIL =========== */
async function paginaPerfil() {
  const box = $("#perfilBox"); if (!box) return;
  const fila = (ic, t, sub, attrs, cls = "") => `<${attrs.startsWith("href") ? "a" : "button type=\"button\""} class="pf-row ${cls}" ${attrs}><span class="pf-ic">${icoW(ic)}</span><span class="pf-tx"><b>${t}</b>${sub ? `<small>${sub}</small>` : ""}</span>${icoW("chev", "pf-ch")}</${attrs.startsWith("href") ? "a" : "button"}>`;
  const extra = `<section class="pf-sec"><h3>Gana con Apamuy</h3>${fila("bike", "Quiero ser repartidor", "Inscripción gratis · tú eliges tus horarios", `href="${esc(AP.reparto || "https://reparto.apamuy.app")}"`)}${fila("store", "¿Tienes un negocio?", "Vende en Apamuy a toda tu ciudad", `href="${esc(AP.panel || "#")}"`)}</section>
    <section class="pf-sec"><h3>Ayuda</h3>${CONF.soporte ? fila("help", "Soporte por WhatsApp", "Te respondemos rápido", `href="${esc(wa(CONF.soporte, "Hola Apamuy, necesito ayuda"))}" target="_blank" rel="noopener"`) : ""}${matchMedia("(display-mode: standalone)").matches ? "" : fila("download", "Instalar la app", "Pide más rápido desde tu pantalla de inicio", 'id="pfInst"')}</section>`;
  if (!YO) { box.innerHTML = `<div class="pf-head invitado"><span class="pf-av">${icoW("user")}</span><div><h1>Hola 👋</h1><p>Entra para pedir, enviar paquetes y guardar tus direcciones.</p></div></div><button class="btn btn-google btn-lg" id="pE">Entrar con Google</button>${extra}`;
    $("#pE").onclick = () => pedirEntrar("Entra para ver tu perfil."); $("#pfInst")?.addEventListener("click", () => instalarApp()); return; }
  const p = PERFIL || {}, ds = p.direcciones || [], nom = p.nombre || YO.nombre || "";
  const [nP, nE] = await Promise.all([DB.list("pedidos", ["clienteUid", "==", YO.uid]).then(l => l.length).catch(() => 0), DB.list("envios", ["clienteUid", "==", YO.uid]).then(l => l.length).catch(() => 0)]);
  box.innerHTML = `<div class="pf-head">${YO.foto ? `<img class="pf-av" src="${esc(YO.foto)}" alt="">` : `<span class="pf-av">${esc((nom || "?")[0].toUpperCase())}</span>`}<div><h1>${esc(nom)}</h1><p>${esc(YO.email)}</p><p>${icoW("phone")} ${esc(p.celular || "Agrega tu celular")}</p></div><button class="btn btn-light btn-sm" id="pfEd">${icoW("edit")} Editar</button></div>
    <div class="pf-stats"><a href="mis-pedidos?t=pedidos"><b>${nP}</b><span>Pedidos</span></a><a href="mis-pedidos?t=envios"><b>${nE}</b><span>Envíos</span></a><a href="#pfDirs"><b>${ds.length}</b><span>Direcciones</span></a></div>
    <section class="pf-sec" id="pfDirs"><h3>Mis direcciones</h3>${ds.map((d, i) => fila("pin", esc(d.etiqueta || "Dirección"), esc(d.texto) + (d.referencia ? " · " + esc(d.referencia) : ""), `data-ed="${i}"`)).join("")}${fila("plus", "Agregar dirección", "", 'id="pfDir"', "pf-add")}</section>
    ${["pendiente", "bloqueado", "ios"].includes(estadoAvisos()) ? `<section class="pf-sec"><h3>Avisos</h3>${fila("clock", "Activar avisos al celular", "Te avisamos cuando tu pedido sale y llega", 'id="pfAv"')}</section>` : ""}
    <section class="pf-sec"><h3>Mi actividad</h3>${fila("receipt", "Mis pedidos", "Sigue y repite tus pedidos", 'href="mis-pedidos?t=pedidos"')}${fila("box", "Enviar un paquete", "Tú pones el precio", 'href="enviar"')}</section>
    ${extra}<button class="btn btn-light btn-lg pf-out" id="pfSalir">${icoW("logout")} Cerrar sesión</button>`;
  $("#pfEd").onclick = () => formPerfil(paginaPerfil, "Tus datos"); $("#pfDir").onclick = () => editarDireccion(null, paginaPerfil); $("#pfSalir").onclick = () => Sesion.salir();
  $("#pfInst")?.addEventListener("click", instalarApp);
  $("#pfAv")?.addEventListener("click", async () => { const r = await activarAvisos("web"); toast(textoAvisos(r), r !== "ok"); paginaPerfil(); });
  box.onclick = e => { const b = e.target.closest("[data-ed]"); if (b) editarDireccion(+b.dataset.ed, paginaPerfil); };
}

/* ---------- App instalable ---------- */
let instalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar = e; $$(".js-instalar").forEach(b => b.hidden = false); });
document.addEventListener("click", async e => {
  if (e.target.closest(".js-carrito")) { e.preventDefault(); abrirCarrito(); }
  const b = e.target.closest(".js-instalar"); if (!b) return; instalarApp(b);
});
async function instalarApp(b) {
  if (instalar) { instalar.prompt(); await instalar.userChoice; instalar = null; if (b) b.hidden = true; }
  else hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>Instala Apamuy en tu iPhone</h2><ol class="pasos-ios"><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadrado con la flecha ↑).</li><li>Elige <b>«Agregar a inicio»</b> y toca <b>Agregar</b>.</li><li>Abre Apamuy desde el ícono nuevo y <b>permite las notificaciones</b> para saber cuándo llega tu pedido.</li></ol><button class="btn btn-red" data-cerrar>Entendido</button></div>`);
}
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $$(".js-instalar").forEach(b => b.hidden = false);

/* ---------- Arranque ---------- */
(async () => {
  pintarTabbar(); pintarBadge(); $$(".js-ciudad").forEach(b => b.textContent = CIUDAD.get().prov + " ▾"); pintarDir();
  await Promise.all([cargarConfig(repintarInicio).catch(() => {}), cargarRubros(false, repintarInicio).catch(() => {})]);
  aplicarTextos();
  // La portada no necesita la sesión: se muestra ya (con lo guardado de la última visita) mientras se conecta Google
  const portada = $("#negocios") ? paginaInicio() : null;
  let iniciado = false;
  Sesion.alCambiar(async u => {
    if (iniciado) return location.reload();      // entró o salió: recargar con la nueva sesión
    iniciado = true; YO = u; PERFIL = u ? await DB.get("usuarios", u.uid).catch(() => null) : null;
    if (u && !PERFIL) PERFIL = { nombre: u.nombre, email: u.email, direcciones: [] };
    const dirNueva = u && !DIR.get() && PERFIL.direcciones?.length; if (dirNueva) store.set("am_dir", PERFIL.direcciones[0]);
    if (u && window.Notification?.permission === "granted") activarAvisos("web", true);
    encabezado(); if (dirNueva && portada) portada.then(() => window.recalcular && window.recalcular()); paginaNegocio(); paginaPedido(); paginaMisPedidos(); paginaPerfil(); paginaEnviar(); paginaEnvio(); paginaRastreo(); paginaLibro(); window.paginaBuscar && paginaBuscar();
    $$(".js-reparto").forEach(a => a.href = AP.reparto || "https://reparto.apamuy.app");
    $$(".js-anio").forEach(e => e.textContent = new Date().getFullYear());
    if (u && store.get("am_seguir", 0)) { store.del("am_seguir"); if (CART.cuenta()) abrirCarrito(); }
  });
})();
