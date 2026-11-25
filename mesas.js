/* ===== Pedidos en mesa (solo rubro Comida) =====
   El cliente escanea el QR de su mesa (negocio?n=ID&mesa=5), pide con su nombre (sin cuenta) y paga al final en caja.
   Protección: debe estar cerca del local (GPS), la moza confirma el primer pedido de cada persona, el negocio puede bloquear
   un celular y hay un límite de pedidos por celular. Sin comisión de Apamuy (van en «pedidosMesa», no en «pedidos»). */
const MESA_DIST_KM = 0.15, MESA_LIMITE = 5, MESA_VENTANA = 30 * 60e3;
function mesaActual() { const m = (() => { try { return JSON.parse(sessionStorage.getItem("am_mesa") || "null"); } catch (e) { return null; } })(); return m && Date.now() - m.t < 3 * 3600e3 ? m : null; }
const mesaOk = n => n && n.estado === "activo" && (n.rubro || "comida") === "comida" && n.mesasActivo === true;
// Identidad del celular sin pedir cuenta: inicio anónimo de Firebase (o la cuenta de Google si ya entró)
async function uidMesa() {
  if (DEMO) { let u = store.get("am_anon", ""); if (!u) { u = "anon-" + Math.random().toString(36).slice(2, 10); store.set("am_anon", u); } return u; }
  const { au, auth } = await fb(); if (auth.currentUser) return auth.currentUser.uid;
  return (await au.signInAnonymously(auth)).user.uid;
}
let MESA_PARAR = [];
async function iniciarMesa() {
  const q = parseInt(params.get("mesa"), 10);
  if (q && NEG && mesaOk(NEG) && q >= 1 && q <= (+NEG.mesasN || 0)) sessionStorage.setItem("am_mesa", JSON.stringify({ nid: NEG.id, num: q, t: Date.now() }));
  if (params.get("mesa")) { try { const u = new URL(location.href); u.searchParams.delete("mesa"); history.replaceState(null, "", u.pathname + u.search); } catch (e) {} }
  const M = mesaActual(); if (!M || !NEG || M.nid !== NEG.id || !mesaOk(NEG)) return;
  let box = $("#mesaBox"); if (!box) { $("#negHead")?.insertAdjacentHTML("beforebegin", `<div id="mesaBox"></div>`); box = $("#mesaBox"); }
  MESA_PARAR.forEach(f => f && f()); MESA_PARAR = [];
  let MIOS = [], MD = null;
  const pintar = () => {
    const act = MIOS.filter(p => !["cerrado", "rechazado"].includes(p.estado)).sort((a, b) => String(a.creado).localeCompare(b.creado)), tot = act.reduce((s, p) => s + p.total, 0);
    const rech = MIOS.some(p => p.estado === "rechazado" && Date.now() - new Date(p.creado) < 30 * 60e3);
    const ET = { "por-confirmar": ["Esperando confirmación de la moza", "pc"], nuevo: ["En cocina", "co"], servido: ["Servido", "sv"] };
    box.innerHTML = `<div class="mesa-b"><span class="mesa-n">${M.num}</span><div><b>Mesa ${M.num}</b><small>Pedido para consumir aquí · sin delivery · pagas al final en caja</small></div><button type="button" class="mesa-x" data-salir>¿No estás en el local?<br><u>Pedir por delivery</u></button></div>
      ${act.length ? `<div class="mesa-c"><h3>Tus pedidos en esta mesa</h3>${act.map(p => `<div class="mesa-p"><span>${p.items.map(x => `${x.cant}× ${esc(x.n)}`).join(", ")}</span><em class="mp-${ET[p.estado]?.[1] || "co"}">${ET[p.estado]?.[0] || esc(p.estado)}</em></div>`).join("")}
        <div class="mesa-t"><span>Total de tu cuenta</span><b>${S(tot)}</b></div>
        <div class="mesa-a"><button type="button" class="btn btn-light" data-llama="moza" ${MD?.llamada === "moza" ? "disabled" : ""}>${MD?.llamada === "moza" ? "Ya viene la moza" : "Llamar a la moza"}</button><button type="button" class="btn btn-light" data-llama="cuenta" ${MD?.llamada === "cuenta" ? "disabled" : ""}>${MD?.llamada === "cuenta" ? "Ya te traen la cuenta" : "Pedir la cuenta"}</button></div></div>` : ""}
      ${rech ? `<p class="aviso sm">Uno de tus pedidos no fue aceptado. Si estás en el local, consulta con la moza.</p>` : ""}`;
  };
  box.onclick = async e => { if (e.target.closest("[data-salir]")) return salirMesa(); const b = e.target.closest("[data-llama]"); if (!b) return;
    try { await DB.set("mesas", `${NEG.id}_${M.num}`, { llamada: b.dataset.llama, llamadaEn: new Date().toISOString() }); toast(b.dataset.llama === "moza" ? "Avisamos a la moza" : "Pediste la cuenta"); }
    catch (x) { toast("No se pudo avisar. Llama a la moza con la mano 🙂", true); } };
  pintar();
  const uid = await uidMesa().catch(() => null); if (!uid) return;
  MESA_PARAR.push(DB.escucharLista("pedidosMesa", [["uid", "==", uid], ["negocioId", "==", NEG.id]], l => { MIOS = l.filter(p => p.mesa === M.num); pintar(); }));
  MESA_PARAR.push(DB.escuchar("mesas", `${NEG.id}_${M.num}`, m => { MD = m; pintar(); }));
}
// Hoja «Tu pedido» para la mesa (reemplaza al checkout de delivery)
function checkoutMesa(M) {
  const c = CART.get(), tot = CART.subtotal();
  if (!estaAbierto(NEG)) return toast(`${NEG.nombre} está cerrado ahora`, true);
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck mesa-ck"><span class="mesa-tag">MESA ${M.num} · Consumir aquí</span><h2>Tu pedido</h2><p class="muted">${esc(NEG.nombre)}</p>
    ${c.items.map(x => `<div class="ci"><div><b>${x.cant}× ${esc(x.n)}</b>${detItem(x).map(d => `<small>${esc(d)}</small>`).join("")}</div><span>${S(x.precio * x.cant)}</span></div>`).join("")}
    <label>Tu nombre<input id="mNom" maxlength="40" autocomplete="given-name" value="${esc(store.get("am_mesa_nom", ""))}" placeholder="Ej. Jordan"></label>
    <label>Nota para cocina (opcional)<textarea id="mNota" maxlength="200" rows="2" placeholder="Ej. una porción sin cremas"></textarea></label>
    <div class="resumen"><div class="t"><span>Total</span><b>${S(tot)}</b></div></div><p class="err" id="mErr" role="alert"></p>
    <button type="button" class="btn btn-red btn-lg" id="mOk">Enviar pedido a cocina</button><p class="muted sm mesa-pie">Pagas al final en caja · Yape, Plin o efectivo</p></div>`);
  $("#mOk", h).onclick = async () => {
    const nom = $("#mNom", h).value.trim(), err = $("#mErr", h), b = $("#mOk", h); err.textContent = "";
    if (nom.length < 2) { err.textContent = "Escribe tu nombre para que la moza sepa a quién llevarlo."; return $("#mNom", h).focus(); }
    // Límite por celular
    const hist = store.get("am_mesa_hist", []).filter(t => Date.now() - t < MESA_VENTANA); if (hist.length >= MESA_LIMITE) { err.textContent = "Hiciste muchos pedidos seguidos. Espera un momento o llama a la moza."; return; }
    b.disabled = true; b.textContent = "Comprobando que estás en el local…";
    // ¿Está en el local? (si no da ubicación, igual se envía pero marcado para que la moza revise)
    let dist = null, sinUbic = false;
    try { const q = await Promise.race([miUbicacion(), new Promise((_, no) => setTimeout(() => no(new Error("t")), 12000))]); dist = Math.round(distanciaKm(q, NEG.ubic) * 1000) / 1000; } catch (e) { sinUbic = true; }
    if (dist != null && NEG.ubic && dist > MESA_DIST_KM) { b.disabled = false; b.textContent = "Enviar pedido a cocina"; err.innerHTML = `Para pedir en mesa debes estar en ${esc(NEG.nombre)} (estás a ${dist < 1 ? Math.round(dist * 1000) + " m" : dist.toFixed(1) + " km"}). <button type="button" class="btn btn-light btn-sm" id="mDel">Pedir por delivery</button>`; $("#mDel", h).onclick = () => { cerrarHoja(); salirMesa(true); }; return; }
    b.textContent = "Enviando…";
    try {
      const uid = await uidMesa(), md = await DB.get("mesas", `${NEG.id}_${M.num}`).catch(() => null);
      if (NEG.mesaAbrir && !(md && ["abierta", "ocupada"].includes(md.estado))) throw Object.assign(new Error("cerrada"), { mesa: 1 });
      const conf = !!(md && md.estado !== "libre" && (md.confirmados || []).includes(uid));
      await DB.set("pedidosMesa", "M" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), {
        uid, negocioId: NEG.id, mesa: M.num, nombre: nom, nota: $("#mNota", h).value.trim(), estado: conf ? "nuevo" : "por-confirmar",
        items: c.items.map(x => ({ n: x.n, cant: x.cant, precio: x.precio, ...(detItem(x).length ? { det: detItem(x).join(" · ") } : {}) })), total: Math.round(tot * 100) / 100,
        dist: dist ?? -1, sinUbic, creado: new Date().toISOString() }, false);
      store.set("am_mesa_nom", nom); store.set("am_mesa_hist", [...hist, Date.now()]); CART.vaciar(); cerrarHoja();
      toast(conf ? "¡Pedido enviado a cocina!" : "¡Pedido enviado! La moza lo confirma en un momento"); scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) {
      console.error(x); b.disabled = false; b.textContent = "Enviar pedido a cocina";
      err.textContent = x.mesa ? "Esta mesa aún no está abierta. Pide a la moza que la abra y vuelve a intentar." : x.code === "permission-denied" ? "No se pudo enviar el pedido desde este celular. Consulta con la moza." : "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
    }
  };
}

// Salir del modo mesa: vuelve al pedido normal (delivery o recojo) sin perder el carrito
function salirMesa(abrir) { sessionStorage.removeItem("am_mesa"); MESA_PARAR.forEach(f => f && f()); MESA_PARAR = []; $("#mesaBox")?.remove(); toast("Listo: ahora tu pedido es por delivery o recojo"); if (abrir && CART.get().items.length) setTimeout(abrirCarrito, 300); }
