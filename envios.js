/* =========================================================
   APAMUY — Envíos de paquetes (el cliente pone el precio, los
   repartidores aceptan o contraofertan), rastreo público para
   compartir y calificación del repartidor con estrellas.
   ========================================================= */
const BUSQUEDA_MIN = 10;     // minutos que dura una búsqueda antes de pedir subir la oferta

/* ---------- Íconos de línea (estilo app) ---------- */
const IW = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  receipt: '<path d="M6 2h12a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  chev: '<path d="m9 6 6 6-6 6"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>', bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h3l-3 11.5M5.5 17.5 9 10h7M12 6h2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  wa: '<path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.6z"/><path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1.2-1.2 2 .8v1.6c-4 .5-8.7-4.2-8.2-8.2h1.6l.8 2z"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M5 12l5 5L20 7"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', truck: '<path d="M1 4h14v12H1zM15 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>'
};
const icoW = (n, c = "") => `<svg class="iw ${c}" viewBox="0 0 24 24" aria-hidden="true">${IW[n] || IW.check}</svg>`;
const TAM_I = { sobre: "doc", pequeno: "box", grande: "truck" };

/* ---------- Barra inferior con íconos ---------- */
function pintarTabbar() {
  const pg = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  const act = { index: "inicio", negocio: "inicio", "mis-pedidos": "pedidos", pedido: "pedidos", envio: "pedidos", enviar: "enviar", perfil: "perfil" }[pg] || "";
  $$(".tabbar").forEach(t => t.innerHTML = [["inicio", "./", "home", "Inicio"], ["pedidos", "mis-pedidos", "receipt", "Pedidos"], ["enviar", "enviar", "box", "Enviar"], ["carrito", "#", "bag", "Carrito"], ["perfil", "perfil", "user", "Perfil"]]
    .map(([k, h, i, tx]) => `<a href="${h}" class="${k === "carrito" ? "js-carrito" : ""}${k === act ? " on" : ""}" ${k === act ? 'aria-current="page"' : ""}><i>${icoW(i)}${k === "carrito" ? '<span class="js-cnt" hidden>0</span>' : ""}</i>${tx}</a>`).join(""));
}

/* ---------- Tarjeta del repartidor (foto, estrellas, vehículo y placa) ---------- */
function tarjetaRep(r, opts = {}) {
  if (!r) return "";
  const prom = r.estrellas ?? null, veh = [vehTxt(r.vehiculo), r.marca, r.color].filter(Boolean).join(" · ");
  return `<div class="repc ${opts.claro ? "claro" : ""}">${r.foto ? `<img src="${esc(r.foto)}" alt="Foto de ${esc(r.nombre)}">` : `<span class="repc-i">${esc((r.nombre || "?")[0])}</span>`}
    <div class="repc-t"><b>${esc(r.nombre)}</b><span class="repc-s">${prom ? `<em>★ ${(+prom).toFixed(1)}</em>` : `<em class="nuevo">Nuevo</em>`}${r.entregas ? ` · ${r.entregas} entregas` : ""}</span><small>${esc(veh)}</small></div>
    ${r.placa ? `<span class="placa">${esc(r.placa)}</span>` : ""}</div>
    ${opts.contacto && r.celular ? `<div class="repc-b"><a class="btn btn-light" href="tel:${esc(r.celular)}">${icoW("phone")} Llamar</a><a class="btn btn-wa" href="${esc(wa(r.celular))}" target="_blank" rel="noopener">${icoW("wa")} WhatsApp</a></div>` : ""}`;
}

/* ---------- Compartir ruta: enlace secreto que se ve sin cuenta ---------- */
const urlRastreo = t => location.href.replace(/[^/]*$/, "") + "rastreo?t=" + t;
function compartirRuta(token, txt) {
  const u = urlRastreo(token), msg = `${txt}\nSíguelo en vivo aquí 👉 ${u}`;
  if (navigator.share) navigator.share({ title: "Apamuy · Seguimiento", text: txt, url: u }).catch(() => {});
  else hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>Compartir ruta</h2><p class="muted">Quien reciba este enlace verá en vivo dónde va el pedido, sin necesidad de cuenta.</p>
    <input readonly value="${esc(u)}" onclick="this.select()"><a class="btn btn-wa btn-lg" href="${esc(wa("", msg))}" target="_blank" rel="noopener">${icoW("wa")} Enviar por WhatsApp</a><button class="btn btn-light" id="cpU">Copiar enlace</button></div>`)
    .querySelector("#cpU").onclick = () => navigator.clipboard?.writeText(u).then(() => toast("Enlace copiado"));
}

/* ---------- «Avísame»: activar notificaciones del pedido o envío ---------- */
function cajaAvisos(el) {
  if (!el || !YO) return; const e = estadoAvisos();
  if (["ok", "demo", "nosoporta"].includes(e)) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="avc">${icoW("clock")}<div><b>¿Te avisamos cuando salga y llegue?</b><small>${e === "ios" ? textoAvisos("ios") : e === "bloqueado" ? textoAvisos("bloqueado") : "Te llega un aviso al celular aunque cierres la página."}</small></div>${e === "pendiente" ? `<button class="btn btn-red btn-sm" id="avW">Avísame</button>` : ""}</div>`;
  $("#avW", el)?.addEventListener("click", async () => { const r = await activarAvisos("web"); toast(textoAvisos(r), r !== "ok"); cajaAvisos(el); });
}

/* ---------- Calificar al repartidor (1 a 5 estrellas) ---------- */
async function cajaCalificar(el, col, ref, rep) {
  if (!el || !rep) return;
  const ya = await DB.get("calificaciones", ref).catch(() => null);
  if (ya) { el.innerHTML = `<div class="cal ok"><b>Gracias por calificar</b><span class="cal-e">${"★".repeat(ya.estrellas)}${"☆".repeat(5 - ya.estrellas)}</span></div>`; return; }
  let n = 0;
  el.innerHTML = `<div class="cal"><b>¿Cómo te atendió ${esc(rep.nombre.split(" ")[0])}?</b><div class="cal-s" role="radiogroup" aria-label="Estrellas">${[1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${i} estrella${i > 1 ? "s" : ""}" data-e="${i}">${icoW("star")}</button>`).join("")}</div>
    <textarea id="calC" maxlength="200" rows="2" placeholder="Cuéntanos (opcional)"></textarea><button class="btn btn-red" id="calB" disabled>Enviar calificación</button></div>`;
  const pinta = () => $$("[data-e]", el).forEach(b => { const on = +b.dataset.e <= n; b.classList.toggle("on", on); b.setAttribute("aria-checked", +b.dataset.e === n); });
  $(".cal-s", el).onclick = e => { const b = e.target.closest("[data-e]"); if (!b) return; n = +b.dataset.e; pinta(); $("#calB", el).disabled = false; };
  $("#calB", el).onclick = async () => { $("#calB", el).disabled = true;
    try { const pub = await DB.get("repPublico", rep.uid).catch(() => null), ops = [{ op: "set", col: "calificaciones", id: ref, merge: false, data: { uid: YO.uid, repUid: rep.uid, col, ref, estrellas: n, comentario: $("#calC", el).value.trim().slice(0, 200), creado: new Date().toISOString() } }];
      if (pub) ops.push({ op: "set", col: "repPublico", id: rep.uid, data: { estrellasSum: (+pub.estrellasSum || 0) + n, estrellasN: (+pub.estrellasN || 0) + 1, ultimaCal: ref } });
      await DB.batch(ops); toast("¡Gracias! Tu calificación ayuda a todos"); cajaCalificar(el, col, ref, rep);
    } catch (x) { console.error(x); toast("No se pudo enviar: " + (x.code || x.message), true); $("#calB", el).disabled = false; } };
}

/* =========== ENVIAR UN PAQUETE =========== */
async function paginaEnviar() {
  const box = $("#enviarBox"); if (!box) return;
  const ds = (PERFIL && PERFIL.direcciones) || [], bor = store.get("am_env", null) || {};
  const E = { origen: bor.origen || (DIR.get() || ds[0] ? { ...(DIR.get() || ds[0]) } : null), destino: bor.destino || null, tamano: bor.tamano || "pequeno", paga: bor.paga || "envia", precio: bor.precio || null, tocado: !!bor.tocado };
  const v = k => esc(bor[k] || "");
  box.innerHTML = `<form id="eF" novalidate>
    <section class="env-c"><div class="env-h"><span class="env-n">A</span><div><b>Recoger en</b><small>Donde el repartidor recoge el paquete</small></div></div>
      ${ds.length ? `<div class="mini-chips">${ds.map((d, i) => `<button type="button" class="chip" data-od="${i}">${icoW("pin")} ${esc(d.etiqueta || "Dirección")}</button>`).join("")}</div>` : ""}
      <div class="mapa env-m" id="mO"></div><button type="button" class="btn btn-light btn-sm" id="gpsO">${icoW("pin")} Usar mi ubicación</button>
      <div class="g2"><label>Dirección *<input id="oTx" maxlength="120" value="${esc(E.origen?.texto || "")}" placeholder="Calle, número"></label><label>Referencia<input id="oRf" maxlength="120" value="${esc(E.origen?.referencia || "")}" placeholder="Ej. tienda azul"></label></div></section>
    <section class="env-c"><div class="env-h"><span class="env-n b">B</span><div><b>Llevar a</b><small>Puede ser en tu ciudad o en otra</small></div></div>
      <div class="mapa env-m" id="mD"></div><p class="muted sm">Toca el mapa o mueve el pin hasta la puerta de entrega.</p>
      <div class="g2"><label>Dirección *<input id="dTx2" maxlength="120" value="${esc(E.destino?.texto || "")}" placeholder="Calle, número"></label><label>Referencia<input id="dRf2" maxlength="120" value="${esc(E.destino?.referencia || "")}"></label>
        <label>¿Quién recibe? *<input id="rN" maxlength="60" value="${v("rN")}" placeholder="Nombre y apellido"></label><label>Celular de quien recibe *<input id="rC" maxlength="12" inputmode="tel" value="${v("rC")}" placeholder="9 dígitos"></label></div></section>
    <section class="env-c"><div class="env-h"><span class="env-n c">${icoW("box")}</span><div><b>¿Qué envías?</b><small>Elige el tamaño</small></div></div>
      <div class="tams">${Object.entries(TAM).map(([k, [t, d]]) => `<label class="tam"><input type="radio" name="tam" value="${k}" ${E.tamano === k ? "checked" : ""}><span class="tam-i">${icoW(TAM_I[k])}</span><b>${t}</b><small>${d}</small></label>`).join("")}</div>
      <label>Contenido *<input id="eCont" maxlength="80" value="${v("eCont")}" placeholder="Ej. documentos, ropa, un regalo"></label></section>
    <section class="env-c"><div class="env-h"><span class="env-n c">S/</span><div><b>¿Quién paga?</b><small>En efectivo o Yape, directo al repartidor</small></div></div>
      <div class="seg2"><label><input type="radio" name="paga" value="envia" ${E.paga === "envia" ? "checked" : ""}><span>Yo, al recoger</span></label><label><input type="radio" name="paga" value="recibe" ${E.paga === "recibe" ? "checked" : ""}><span>Quien recibe, al entregar</span></label></div></section>
    <section class="env-c env-p"><div class="env-dist" id="eDist">Marca los dos puntos para calcular la distancia.</div>
      <div class="precio"><span>Tu oferta</span><div class="stp"><button type="button" data-st="-1" aria-label="Bajar S/ 1">−</button><label class="stp-v">S/<input id="ePr" type="number" inputmode="decimal" min="${CONF.envio.minimo}" step="0.5"></label><button type="button" data-st="1" aria-label="Subir S/ 1">+</button></div>
        <small id="eSug"></small></div>
      <p class="muted sm">Tú pones el precio. Los repartidores aceptan o te mandan una contraoferta, y tú eliges.</p></section>
    <label class="chk-l"><input type="checkbox" id="eDecl" ${bor.decl ? "checked" : ""}><span>Declaro que no envío dinero, joyas, drogas, armas, animales ni nada prohibido por la ley.</span></label>
    <p class="err" id="eErr" role="alert"></p><button class="btn btn-red btn-lg" id="eBtn">Buscar repartidor</button></form>`;
  const F = $("#eF"), err = $("#eErr");
  const guardarBor = () => store.set("am_env", { origen: E.origen, destino: E.destino, tamano: E.tamano, paga: E.paga, precio: E.precio, tocado: E.tocado, rN: $("#rN").value, rC: $("#rC").value, eCont: $("#eCont").value, decl: $("#eDecl").checked });
  const calc = () => {
    const km = E.origen && E.destino ? distanciaKm(E.origen, E.destino) : null, sug = sugerirEnvio(km, E.tamano);
    const co = E.origen ? ciudadCercana(E.origen) : null, cd = E.destino ? ciudadCercana(E.destino) : null, inter = co && cd && (co.prov !== cd.prov || co.dep !== cd.dep);
    $("#eDist").innerHTML = km == null ? "Marca los dos puntos para calcular la distancia." : `${icoW("flag")} <b>${km.toFixed(1)} km</b> aprox.${inter ? ` · <span class="inter">Interprovincial: ${esc(co.prov)} → ${esc(cd.prov)}</span>` : cd ? ` · ${esc(co?.dis || "")} → ${esc(cd.dis)}` : ""}`;
    if (!E.tocado || !E.precio) E.precio = sug; $("#ePr").value = E.precio; $("#eSug").textContent = km == null ? `Mínimo ${S(CONF.envio.minimo)}` : `Sugerido ${S(sug)} · mínimo ${S(CONF.envio.minimo)}`;
    E.km = km; E.inter = !!inter; E.co = co; E.cd = cd; guardarBor();
  };
  let MO = null, MD = null;
  mapaPin($("#mO"), E.origen, q => { E.origen = { ...(E.origen || {}), ...q }; calc(); }, { txt: "A", color: "#E63946" }).then(m => MO = m);
  mapaPin($("#mD"), E.destino, q => { E.destino = { ...(E.destino || {}), ...q }; calc(); }, { txt: "B", color: "#1A1430" }).then(m => MD = m);
  if (!E.origen) miUbicacion().then(q => { MO?.mover(q); }).catch(() => {});
  $("#gpsO").onclick = () => miUbicacion().then(q => { MO?.mover(q); toast("Ubicación encontrada"); }).catch(() => toast("Activa el GPS y da permiso de ubicación", true));
  box.addEventListener("click", e => { const b = e.target.closest("[data-od]"); if (!b) return; const d = ds[+b.dataset.od]; E.origen = { ...d }; $("#oTx").value = d.texto; $("#oRf").value = d.referencia || ""; MO?.mover(d); });
  F.addEventListener("click", e => { const b = e.target.closest("[data-st]"); if (!b) return; E.tocado = true; E.precio = Math.max(CONF.envio.minimo, r2((+$("#ePr").value || 0) + +b.dataset.st)); $("#ePr").value = E.precio; guardarBor(); });
  $("#ePr").oninput = e => { E.tocado = true; E.precio = +e.target.value || 0; guardarBor(); };
  F.onchange = e => { if (e.target.name === "tam") { E.tamano = e.target.value; calc(); } if (e.target.name === "paga") E.paga = e.target.value; guardarBor(); };
  F.oninput = guardarBor; calc();
  F.onsubmit = e => { e.preventDefault(); err.textContent = "";
    E.origen && (E.origen = { ...E.origen, texto: $("#oTx").value.trim(), referencia: $("#oRf").value.trim() }); E.destino && (E.destino = { ...E.destino, texto: $("#dTx2").value.trim(), referencia: $("#dRf2").value.trim() });
    const rN = $("#rN").value.trim(), rC = $("#rC").value.replace(/\D/g, ""), cont = $("#eCont").value.trim(), pr = r2(+$("#ePr").value);
    if (!E.origen || E.origen.lat == null) return err.textContent = "Marca en el mapa dónde recogemos el paquete.";
    if (!E.origen.texto) return err.textContent = "Escribe la dirección de recojo.";
    if (!E.destino || E.destino.lat == null) return err.textContent = "Marca en el mapa a dónde llevamos el paquete.";
    if (!E.destino.texto) return err.textContent = "Escribe la dirección de entrega.";
    if (!rN || rC.length !== 9) return err.textContent = "Escribe el nombre y el celular (9 dígitos) de quien recibe.";
    if (!cont) return err.textContent = "Cuéntanos qué envías.";
    if (!(pr >= CONF.envio.minimo)) return err.textContent = `La oferta mínima es ${S(CONF.envio.minimo)}.`;
    if (E.km > CONF.envio.maxKm) return err.textContent = `Por ahora llevamos hasta ${CONF.envio.maxKm} km.`;
    if (!$("#eDecl").checked) return err.textContent = "Marca la declaración de que no envías nada prohibido.";
    guardarBor(); asegurarCliente(() => crearEnvio({ rN, rC, cont, pr }));
  };
  async function crearEnvio({ rN, rC, cont, pr }) {
    const b = $("#eBtn"); b.disabled = true; b.textContent = "Buscando…";
    try {
      const cod = codigo("EN"), tk = tokenRastreo(), ah = new Date().toISOString(), co = E.co || ciudadCercana(E.origen) || CIUDAD.get(), cd = E.cd || ciudadCercana(E.destino) || {};
      const pt = (x, c) => ({ texto: x.texto, referencia: x.referencia || "", lat: x.lat, lng: x.lng, dis: c.dis || "", provincia: c.prov || "", departamento: c.dep || "" });
      const env = { codigo: cod, clienteUid: YO.uid, origen: pt(E.origen, co), destino: pt(E.destino, cd), prov: provKey(co.dep, co.prov), interprov: !!E.inter, km: r2(E.km || 0), tamano: E.tamano, contenido: cont.slice(0, 80), paga: E.paga,
        oferta: pr, sugerido: sugerirEnvio(E.km, E.tamano), estado: "buscando", buscadoEn: ah, rastreo: tk, creado: ah, dia: HOY(), mes: HOY().slice(0, 7) };
      await DB.batch([{ op: "set", col: "envios", id: cod, merge: false, data: env },
        { op: "set", col: `envios/${cod}/priv`, id: "datos", merge: false, data: { clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, receptor: { nombre: rN, celular: rC } } },
        { op: "set", col: "rastreo", id: tk, merge: false, data: { uid: YO.uid, col: "envios", ref: cod, tipo: "envio", titulo: "Envío de paquete", estado: "buscando", origen: { lat: env.origen.lat, lng: env.origen.lng, texto: env.origen.dis }, destino: { lat: env.destino.lat, lng: env.destino.lng, texto: env.destino.texto }, para: rN.split(" ")[0], creado: ah } }]);
      store.del("am_env"); location.href = "envio?c=" + encodeURIComponent(cod);
    } catch (x) { console.error(x); b.disabled = false; b.textContent = "Buscar repartidor"; err.textContent = "No se pudo crear el envío: " + (x.code || x.message); }
  }
}

/* =========== SEGUIMIENTO DEL ENVÍO (ofertas, contraofertas y viaje) =========== */
async function paginaEnvio() {
  const box = $("#envioBox"); if (!box) return; const c = params.get("c");
  if (!YO) { box.innerHTML = `<div class="vacio">${icoW("box", "xl")}<h2>Entra para ver tu envío</h2><button class="btn btn-red" id="evE">Entrar con Google</button></div>`; $("#evE").onclick = () => pedirEntrar("Entra con la cuenta con la que hiciste el envío."); return; }
  let EN = null, OFS = [], PRIV = null, M = null, firma = "", pararOf = null, reloj = null;
  const priv = await DB.get(`envios/${c}/priv`, "datos").catch(() => null); PRIV = priv;
  const pintar = async () => {
    const e = EN; if (!e) return; const [tit] = EST_E[e.estado] || [e.estado];
    const resta = Math.max(0, BUSQUEDA_MIN * 60 - Math.round((Date.now() - new Date(e.buscadoEn)) / 1000)), vencida = e.estado === "buscando" && resta === 0;
    const pasos = [["asignado", "Repartidor asignado"], ["camino", "Paquete recogido"], ["entregado", "Entregado"]], idx = { asignado: 0, camino: 1, entregado: 2 }[e.estado] ?? -1;
    const html = `<div class="trk env-trk"><small>${esc(c)} · ${TAM[e.tamano]?.[0] || ""}</small><h1>${e.estado === "buscando" ? (vencida ? "Nadie aceptó todavía" : "Buscando repartidor…") : esc(tit)}</h1>
        ${e.estado === "buscando" ? `<div class="busca"><span class="radar-w"></span><div><small>Tu oferta</small><b>${S(e.oferta)}</b></div><div class="bus-t">${vencida ? "Sube tu oferta para que más repartidores se animen." : `Quedan <b>${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, "0")}</b>`}</div></div>`
          : e.estado === "cancelado" ? "" : `<ol class="pasos">${pasos.map(([k, t], i) => `<li class="${i < idx || e.estado === "entregado" ? "done" : i === idx ? "now" : ""}"><i>${i + 1}</i><span>${t}</span></li>`).join("")}</ol>`}
        ${e.repartidor && e.estado !== "cancelado" ? tarjetaRep(e.repartidor, { contacto: e.estado !== "entregado" }) : ""}</div>
      ${e.estado === "buscando" ? `<section class="det"><h3>Contraofertas ${OFS.length ? `<span class="cnt-b">${OFS.length}</span>` : ""}</h3>
          ${OFS.map(o => `<div class="ofr">${tarjetaRep(o.rep, { claro: true })}<div class="ofr-b"><div><small>${o.dist != null ? `a ${(+o.dist).toFixed(1)} km de tu paquete` : ""}</small><b>${S(o.precio)}</b></div><button class="btn btn-red" data-elegir="${esc(o.id)}">Elegir</button></div></div>`).join("")
            || `<p class="muted">Cuando un repartidor te mande un precio distinto, aparece aquí. Si aceptan tu oferta, se asigna solo.</p>`}</section>
        <section class="det"><h3>Subir mi oferta</h3><div class="subir">${[1, 2, 5].map(n => `<button class="btn btn-light" data-subir="${n}">+ S/ ${n}</button>`).join("")}</div>
          ${vencida ? `<button class="btn btn-red btn-lg" data-subir="0">Volver a buscar con ${S(e.oferta)}</button>` : ""}<button class="btn-link danger" id="evCan">Cancelar envío</button></section>` : ""}
      ${["asignado", "camino"].includes(e.estado) ? `<div class="mapa trk-m" id="evMapa"></div><p class="muted sm leyenda"><i class="lg a">A</i> recojo · <i class="lg b">B</i> entrega${e.repartidor?.ubic ? " · 🛵 repartidor en vivo" : ""}</p>
        <button class="btn btn-dark btn-lg" id="evShare">${icoW("share")} Compartir ruta con quien recibe</button>` : ""}
      ${e.estado === "entregado" ? `<div id="evCal"></div>` : ""}${["buscando", "asignado", "camino"].includes(e.estado) ? `<div id="evAv"></div>` : ""}
      <section class="det"><h3>Detalle</h3><dl class="dlw"><dt><i class="lg a">A</i> Recojo</dt><dd>${esc(e.origen.texto)}${e.origen.referencia ? ` · ${esc(e.origen.referencia)}` : ""}<small>${esc(e.origen.dis)}, ${esc(e.origen.provincia)}</small></dd>
        <dt><i class="lg b">B</i> Entrega</dt><dd>${esc(e.destino.texto)}${e.destino.referencia ? ` · ${esc(e.destino.referencia)}` : ""}<small>${esc(e.destino.dis)}, ${esc(e.destino.provincia)}${e.interprov ? " · interprovincial" : ""}</small></dd>
        ${PRIV ? `<dt>Recibe</dt><dd>${esc(PRIV.receptor.nombre)} · ${esc(PRIV.receptor.celular)}</dd>` : ""}<dt>Contenido</dt><dd>${esc(e.contenido)} · ${esc(TAM[e.tamano]?.[0] || "")}</dd>
        <dt>Precio</dt><dd><b>${S(e.precio ?? e.oferta)}</b> · paga ${e.paga === "recibe" ? "quien recibe, al entregar" : "quien envía, al recoger"}<small>${e.km} km aprox.</small></dd></dl></section>
      <div class="acts"><a class="btn btn-light" href="enviar">${icoW("plus")} Nuevo envío</a></div>`;
    if (html === firma) return; firma = html; box.innerHTML = html;
    const el = $("#evMapa"); if (el) M = await mapaPuntos(el, [{ ...e.origen, color: "#E63946", txt: "A" }, { ...e.destino, color: "#1A1430", txt: "B" }, e.repartidor?.ubic && { ...e.repartidor.ubic, color: "#FFC21A", txt: "🛵" }]);
    if (e.estado === "entregado" && e.repartidor) cajaCalificar($("#evCal"), "envios", e.codigo, e.repartidor);
    cajaAvisos($("#evAv"));
  };
  const elegir = async id => {
    const o = OFS.find(x => x.id === id); if (!o) return;
    try { const ok = await DB.transaccion(async (get, set) => { const x = await get("envios", c); if (!x || x.estado !== "buscando") return false;
        set("envios", c, { estado: "asignado", repUid: o.repUid, repartidor: o.rep, precio: o.precio, asignadoEn: new Date().toISOString(), actualizado: new Date().toISOString() }); return true; });
      if (!ok) return toast("Este envío ya tiene repartidor", true);
      DB.set("rastreo", EN.rastreo, { estado: "asignado", repartidor: { ...o.rep } }).catch(() => {}); toast(`✅ ${o.rep.nombre.split(" ")[0]} va por tu paquete`);
    } catch (x) { console.error(x); toast("No se pudo elegir: " + (x.code || x.message), true); }
  };
  box.onclick = async e => {
    const el = e.target.closest("[data-elegir]"), su = e.target.closest("[data-subir]");
    if (el) return elegir(el.dataset.elegir);
    if (su) { const n = +su.dataset.subir; await DB.set("envios", c, { oferta: r2(EN.oferta + n), buscadoEn: new Date().toISOString(), actualizado: new Date().toISOString() }); return toast(n ? `Subiste tu oferta a ${S(EN.oferta + n)}` : "Volvimos a buscar"); }
    if (e.target.closest("#evCan")) { if (!confirm("¿Cancelar este envío?")) return; await DB.batch([{ op: "set", col: "envios", id: c, data: { estado: "cancelado", actualizado: new Date().toISOString() } }, { op: "set", col: "rastreo", id: EN.rastreo, data: { estado: "cancelado" } }]); return toast("Envío cancelado"); }
    if (e.target.closest("#evShare")) compartirRuta(EN.rastreo, `📦 ${PRIV?.receptor?.nombre?.split(" ")[0] || "Hola"}, te envié un paquete por Apamuy${EN.repartidor ? ` con ${EN.repartidor.nombre.split(" ")[0]} (${EN.repartidor.placa || vehTxt(EN.repartidor.vehiculo)})` : ""}.`);
  };
  DB.escuchar("envios", c, e => {
    if (!e) { box.innerHTML = `<div class="vacio">${icoW("box", "xl")}<h2>No encontramos el envío ${esc(c)}</h2><a href="mis-pedidos">Ver mis pedidos</a></div>`; return; }
    const antes = EN; EN = e;
    if (antes && antes.estado !== e.estado) { navigator.vibrate?.(250); toast(EST_E[e.estado]?.[0] || "Tu envío se actualizó"); }
    if (e.estado === "buscando" && !pararOf) pararOf = DB.escucharLista(`envios/${c}/ofertas`, [], l => { const n = l.length > OFS.length && OFS.length !== null; OFS = l.sort((a, b) => a.precio - b.precio); if (n && antes) { navigator.vibrate?.(200); toast("💬 Nueva contraoferta"); } pintar(); });
    if (e.estado !== "buscando" && pararOf) { pararOf(); pararOf = null; }
    if (M && e.repartidor?.ubic && firma) M.pintar([{ ...e.origen, color: "#E63946", txt: "A" }, { ...e.destino, color: "#1A1430", txt: "B" }, { ...e.repartidor.ubic, color: "#FFC21A", txt: "🛵" }]);
    pintar();
  });
  reloj = setInterval(() => { if (EN && EN.estado === "buscando") pintar(); }, 1000);
}

/* =========== RASTREO PÚBLICO (sin cuenta) =========== */
function paginaRastreo() {
  const box = $("#rastreoBox"); if (!box) return; const t = params.get("t"); let M = null, firma = "";
  if (!t) { box.innerHTML = `<div class="vacio">${icoW("pin", "xl")}<h2>Enlace incompleto</h2><p class="muted">Pide que te lo vuelvan a enviar.</p></div>`; return; }
  const TIT = { buscando: "Buscando repartidor", nuevo: "Pedido recibido", cocina: "Se está preparando", listo: "Listo para salir", asignado: "El repartidor va a recogerlo", camino: "¡Va en camino hacia ti!", entregado: "¡Entregado!", cancelado: "Cancelado", anulado: "Cancelado" };
  DB.escuchar("rastreo", t, async r => {
    if (!r) { box.innerHTML = `<div class="vacio">${icoW("pin", "xl")}<h2>Este enlace no existe o venció</h2></div>`; return; }
    const pts = [r.origen && { ...r.origen, color: "#E63946", txt: r.tipo === "envio" ? "A" : "🏪" }, r.destino && { ...r.destino, color: "#1A1430", txt: r.tipo === "envio" ? "B" : "🏠" }, r.ubic && { ...r.ubic, color: "#FFC21A", txt: "🛵" }];
    const html = `<div class="trk"><small>${esc(r.titulo || "Apamuy")}${r.para ? ` · para ${esc(r.para)}` : ""}</small><h1>${esc(TIT[r.estado] || r.estado)}</h1>${r.repartidor ? tarjetaRep(r.repartidor, { contacto: !["entregado", "cancelado", "anulado"].includes(r.estado) }) : ""}</div>
      ${!["entregado", "cancelado", "anulado"].includes(r.estado) ? `<div class="mapa trk-m" id="rtMapa"></div><p class="muted sm">${r.ubic ? `🛵 Ubicación en vivo · actualizada ${hace(r.ubic.t)}` : "Verás al repartidor en el mapa cuando salga."}</p>` : ""}
      ${r.destino?.texto ? `<section class="det"><h3>Entrega en</h3><p>${esc(r.destino.texto)}</p></section>` : ""}
      <section class="det promo-mini">${icoW("box")}<div><b>¿Tú también quieres enviar algo?</b><small>Con Apamuy tú pones el precio.</small></div><a class="btn btn-red btn-sm" href="enviar">Enviar</a></section>`;
    if (html !== firma) { firma = html; box.innerHTML = html; const el = $("#rtMapa"); M = el ? await mapaPuntos(el, pts) : null; } else if (M) M.pintar(pts);
  });
}
