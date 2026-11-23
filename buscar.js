/* =========================================================
   APAMUY — 🔍 Buscar repuesto y 🚨 Auxilio mecánico
   El cliente pregunta UNA vez y le llega a todas las ferreterías
   y talleres de su provincia (auxilio: talleres a 30 km).
   Los que lo tienen responden «Sí tengo» con su precio y el
   cliente elige. Al elegir se vuelve un pedido normal.
   ========================================================= */
const SOLT = {
  repuesto: { min: 30, rubros: ["ferreteria", "talleres"], tit: "Buscar repuesto", ico: "🔍", sub: "Pregunta una vez a todas las tiendas de repuestos, ferreterías y talleres de tu provincia. Los que lo tienen te responden con su precio." },
  auxilio: { min: 15, rubros: ["talleres"], km: 30, tit: "Auxilio mecánico", ico: "🚨", sub: "Los talleres cercanos (hasta 30 km) te dicen cuánto cobran y en cuánto llegan. El taller va hasta donde estás." }
};
const PROBLEMAS = ["Llanta pinchada", "Batería descargada", "No arranca", "Se recalentó", "Choque", "Sin combustible", "Otro"];
const VEH_T = [["", "No es para un vehículo"], ["moto", "🛵 Moto"], ["mototaxi", "🛺 Mototaxi"], ["auto", "🚗 Auto"], ["camioneta", "🛻 Camioneta"], ["camion", "🚚 Camión"], ["otro", "Otro"]];
const vehSol = v => v && v.tipo ? [(VEH_T.find(x => x[0] === v.tipo) || [, v.tipo])[1], v.modelo, v.anio].filter(Boolean).join(" · ") : "";
const restaSol = s => Math.max(0, Math.round((new Date(s.vence) - Date.now()) / 1000));
const mmss = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const BUSQ = { get: () => store.get("am_busq", null), set: v => store.set("am_busq", v) };   // búsqueda activa (guarda la ubicación exacta del auxilio)

/* ---------- En el inicio: botones y búsqueda activa ---------- */
function bloqueBuscar(ns, rid) {
  const el = $("#buscaAcc"); if (!el) return;
  const hay = r => (ns || []).some(n => (n.rubro || "comida") === r), b = BUSQ.get(), activa = b && new Date(b.vence) > Date.now();
  const W = CONF.web, verRep = W.btnBusq !== false && (!rid || recibeBusq(rid)) && (ns || []).some(n => recibeBusq(n.rubro || "comida")), verAux = W.btnAux !== false && (!rid || rid === "talleres") && hay("talleres");
  el.hidden = !verRep && !verAux && !activa;
  // Mismo formato que «Envía un paquete»: rectángulos del carrusel del inicio
  el.innerHTML = (activa ? `<a class="promo p-act" href="buscar?s=${encodeURIComponent(b.id)}"><span class="promo-i"><span class="radar-w sm"></span></span><div><b>Búsqueda activa</b><small>${esc(b.texto || "")} · mira las respuestas</small></div></a>` : "")
    + (verRep ? `<a class="promo p-bq" href="buscar?t=repuesto"><span class="promo-i">🔍</span><div><b>${esc(W.bqTit)}</b><small>${esc(W.bqTxt)}</small></div></a>` : "")
    + (verAux ? `<a class="promo p-aux" href="buscar?t=auxilio"><span class="promo-i">🚨</span><div><b>${esc(W.auxTit)}</b><small>${esc(W.auxTxt)}</small></div></a>` : "");
}

/* ---------- Página /buscar ---------- */
async function paginaBuscar() {
  const box = $("#buscarBox"); if (!box) return;
  const sid = params.get("s"); if (sid) return verBusqueda(box, sid);
  formBusqueda(box, params.get("t") === "auxilio" ? "auxilio" : "repuesto");
}

function formBusqueda(box, tipo) {
  const T = SOLT[tipo], bor = store.get("am_bbor_" + tipo, {}), d = DIR.get();
  let foto = "", ubic = tipo === "auxilio" ? null : (d && d.lat != null ? { lat: d.lat, lng: d.lng } : null), MP = null, problema = bor.problema || "";
  $("#bqTit").textContent = T.tit; $("#bqSub").textContent = T.sub; $("#bqIco").textContent = T.ico; document.title = T.tit + " · Apamuy";
  box.innerHTML = `<div class="seg bq-seg"><a href="buscar?t=repuesto" class="${tipo === "repuesto" ? "on" : ""}">🔍 Repuesto o material</a><a href="buscar?t=auxilio" class="${tipo === "auxilio" ? "on" : ""}">🚨 Auxilio mecánico</a></div>
    <form id="bqF" novalidate>
    ${tipo === "auxilio" ? `<section class="env-c"><div class="env-h"><span class="env-n">1</span><div><b>¿Qué pasó?</b><small>Elige lo más parecido</small></div></div>
        <div class="chips-w">${PROBLEMAS.map(p => `<button type="button" class="chip ${problema === p ? "on" : ""}" data-pb="${esc(p)}">${esc(p)}</button>`).join("")}</div>
        <label>Cuéntanos un poco más<textarea id="bqTx" rows="2" maxlength="300" placeholder="Ej. la llanta trasera se bajó, tengo repuesto pero no gata">${esc(bor.texto || "")}</textarea></label></section>
      <section class="env-c"><div class="env-h"><span class="env-n b">2</span><div><b>¿Dónde estás?</b><small>El taller que elijas verá este punto para llegar</small></div></div>
        <div class="mapa env-m" id="bqM"></div><button type="button" class="btn btn-light btn-sm" id="bqGps">${icoW("pin")} Usar mi ubicación</button>
        <label>Referencia<input id="bqRef" maxlength="120" value="${esc(bor.ref || "")}" placeholder="Ej. frente al grifo, km 12 de la carretera"></label></section>`
    : `<section class="env-c"><div class="env-h"><span class="env-n">1</span><div><b>¿Qué necesitas?</b><small>Mientras más detalle, mejores respuestas</small></div></div>
        <label>Lo que buscas *<textarea id="bqTx" rows="3" maxlength="300" placeholder="Ej. pastillas de freno delanteras · 2 bolsas de cemento · cadena 428">${esc(bor.texto || "")}</textarea></label>
        <div class="bq-foto"><span id="bqFv"></span><label class="btn btn-light btn-sm">📷 Agregar foto <small>(opcional)</small><input type="file" accept="image/*" id="bqFoto" hidden></label></div></section>`}
    <section class="env-c"><div class="env-h"><span class="env-n c">${tipo === "auxilio" ? "3" : "2"}</span><div><b>Tu vehículo</b><small>${tipo === "auxilio" ? "Para que sepan qué llevar" : "Si es un repuesto, ayuda a que te den el correcto"}</small></div></div>
      <div class="g2"><label>Tipo<select id="bqVt">${VEH_T.filter(x => tipo === "repuesto" || x[0]).map(([v, t]) => `<option value="${v}" ${(bor.vt ?? (tipo === "auxilio" ? "moto" : "")) === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Marca y modelo<input id="bqVm" maxlength="60" value="${esc(bor.vm || "")}" placeholder="Ej. Honda CB 125"></label><label>Año<input id="bqVa" maxlength="4" inputmode="numeric" value="${esc(bor.va || "")}" placeholder="Ej. 2019"></label></div></section>
    <p class="muted sm bq-priv">🔒 Las tiendas no ven tu nombre ni tu celular hasta que tú elijas a una. La búsqueda dura ${T.min} minutos.</p>
    <p class="err" id="bqErr" role="alert"></p><button class="btn btn-red btn-lg" id="bqBtn">${T.ico} ${tipo === "auxilio" ? "Pedir auxilio" : "Preguntar a las tiendas"}</button></form>`;
  const F = $("#bqF"), guardar = () => store.set("am_bbor_" + tipo, { texto: $("#bqTx").value, problema, ref: $("#bqRef")?.value || "", vt: $("#bqVt").value, vm: $("#bqVm").value, va: $("#bqVa").value });
  F.oninput = guardar;
  F.addEventListener("click", e => { const b = e.target.closest("[data-pb]"); if (!b) return; problema = b.dataset.pb; $$("[data-pb]", F).forEach(x => x.classList.toggle("on", x === b)); guardar(); });
  $("#bqFoto")?.addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; foto = await redimensionar(f, 700, .72); $("#bqFv").innerHTML = `<img src="${foto}" alt=""><button type="button" class="x" aria-label="Quitar foto">×</button>`; $("#bqFv .x").onclick = () => { foto = ""; $("#bqFv").innerHTML = ""; }; });
  if (tipo === "auxilio") {
    mapaPin($("#bqM"), null, q => ubic = q).then(m => { MP = m; ubicar(p => { MP && MP.mover(p); }, true); });
    $("#bqGps").onclick = () => { toast("Buscando tu ubicación…"); ubicar(p => MP && MP.mover(p)); };
  }
  F.onsubmit = e => { e.preventDefault(); const err = $("#bqErr"); err.textContent = "";
    const texto = $("#bqTx").value.trim();
    if (tipo === "repuesto" && texto.length < 3) return err.textContent = "Escribe lo que buscas.";
    if (tipo === "auxilio" && !problema) return err.textContent = "Elige qué pasó.";
    if (tipo === "auxilio" && !ubic) return err.textContent = "Marca en el mapa dónde estás (o toca «Usar mi ubicación»).";
    asegurarCliente(() => crearBusqueda(tipo, { texto, problema, ubic, ref: $("#bqRef")?.value.trim() || "", foto, veh: { tipo: $("#bqVt").value, modelo: $("#bqVm").value.trim(), anio: $("#bqVa").value.replace(/\D/g, "").slice(0, 4) } }));
  };
}

async function crearBusqueda(tipo, x) {
  const T = SOLT[tipo], b = $("#bqBtn"), err = $("#bqErr"); if (b) { b.disabled = true; b.textContent = "Enviando…"; }
  try {
    const c = tipo === "auxilio" ? ciudadCercana(x.ubic) : CIUDAD.get(), dis = x.ubic ? (ciudadCercana(x.ubic) || {}).dis || "" : "";
    if (!c) throw new Error("No pudimos saber tu ciudad");
    const cod = codigo("BQ"), ah = new Date(), aprox = x.ubic ? { lat: Math.round(x.ubic.lat * 100) / 100, lng: Math.round(x.ubic.lng * 100) / 100 } : null;   // ~1 km: la casa exacta solo la ve la tienda elegida
    const sol = { codigo: cod, tipo, clienteUid: YO.uid, cliente: String(PERFIL.nombre || "").split(" ")[0], prov: provKey(c.dep, c.prov), rubros: tipo === "repuesto" ? rubrosBusq() : T.rubros,
      texto: (tipo === "auxilio" ? x.problema + (x.texto ? ": " + x.texto : "") : x.texto).slice(0, 300), problema: x.problema || "", foto: x.foto || "", vehiculo: x.veh.tipo ? x.veh : null,
      zona: dis, ubic: aprox, estado: "abierta", vence: new Date(ah.getTime() + T.min * 60e3).toISOString(), creado: ah.toISOString(), dia: HOY(), mes: HOY().slice(0, 7) };
    await DB.set("solicitudes", cod, sol, false);
    BUSQ.set({ id: cod, tipo, texto: sol.texto.slice(0, 60), vence: sol.vence, ubic: x.ubic, ref: x.ref }); store.set("am_bbor_" + tipo, {});
    location.href = "buscar?s=" + encodeURIComponent(cod);
  } catch (e) { console.error(e); if (b) { b.disabled = false; b.textContent = T.ico + " Intentar de nuevo"; } if (err) err.textContent = "No se pudo enviar: " + (e.code || e.message); }
}

/* ---------- Respuestas en vivo ---------- */
function verBusqueda(box, sid) {
  if (!YO) { box.innerHTML = `<div class="vacio">🔍<h2>Entra para ver tu búsqueda</h2><button class="btn btn-red" id="bqE">Entrar con Google</button></div>`; $("#bqE").onclick = () => pedirEntrar("Entra con la cuenta con la que hiciste la búsqueda."); return; }
  let S0 = null, RS = [], orden = "cerca", firma = "";
  const yo = () => { const b = BUSQ.get(); return (b && b.id === sid && b.ubic) || DIR.get() || null; };
  const pintar = () => {
    const s = S0; if (!s) return; const T = SOLT[s.tipo] || SOLT.repuesto, resta = restaSol(s), abierta = s.estado === "abierta" && resta > 0, aux = s.tipo === "auxilio", p = yo();
    $("#bqTit").textContent = T.tit; $("#bqSub").textContent = ""; $("#bqIco").textContent = T.ico;
    const l = RS.map(r => ({ ...r, km: p && r.negocio?.ubic ? distanciaKm(p, r.negocio.ubic) : null }))
      .sort((a, b) => orden === "barato" ? a.precio - b.precio : aux ? (a.llegaMin ?? 99) - (b.llegaMin ?? 99) : (a.km ?? 999) - (b.km ?? 999));
    const html = `<div class="trk bq-trk"><small>${esc(s.codigo)}${s.vehiculo ? " · " + esc(vehSol(s.vehiculo)) : ""}</small><h1>${esc(s.texto)}</h1>
        ${s.foto ? `<img class="bq-img" src="${esc(s.foto)}" alt="">` : ""}
        ${abierta ? `<div class="busca"><span class="radar-w"></span><div><small>${aux ? "Preguntando a talleres cerca" : "Preguntando a las tiendas"}</small><b>${RS.length ? RS.length + " respondieron" : "Esperando…"}</b></div><div class="bus-t">Quedan <b id="bqT">{{T}}</b></div></div>`
          : s.estado === "elegida" ? `<div class="alert ok">✅ Elegiste una tienda. <a href="pedido?c=${encodeURIComponent(s.pedido || "")}">Ver mi pedido →</a></div>`
          : s.estado === "cancelada" ? `<div class="alert">Cancelaste esta búsqueda.</div>` : `<div class="alert">⏱ Se terminó el tiempo de la búsqueda.${RS.length ? " Aún puedes elegir una respuesta." : ""}</div>`}</div>
      <section class="det"><div class="bq-h"><h3>${aux ? "Talleres que pueden ir" : "Tiendas que lo tienen"} ${RS.length ? `<span class="cnt-b">${RS.length}</span>` : ""}</h3>
        ${RS.length > 1 ? `<div class="mini-chips"><button class="chip ${orden === "cerca" ? "on" : ""}" data-ord="cerca">${aux ? "Llega antes" : "Más cerca"}</button><button class="chip ${orden === "barato" ? "on" : ""}" data-ord="barato">Más barato</button></div>` : ""}</div>
        ${l.map(r => tarjetaResp(s, r)).join("") || `<p class="muted">${abierta ? "Cuando una tienda responda «Sí tengo», aparece aquí con su precio. Te avisamos." : "Nadie respondió esta vez."}</p>`}</section>
      <div class="acts">${abierta ? `<button class="btn-link danger" id="bqCan">Cancelar búsqueda</button>` : ""}<a class="btn btn-light" href="buscar?t=${esc(s.tipo)}">${icoW("plus")} Nueva búsqueda</a></div><div id="bqAv"></div>`;
    const t = $("#bqT"); if (t) t.textContent = mmss(resta);   // el reloj se actualiza solo, sin repintar (si no, los botones «Elegir» no responden)
    if (html === firma) return; firma = html; box.innerHTML = html.replace("{{T}}", mmss(resta)); cajaAvisos($("#bqAv"));
  };
  box.onclick = async e => {
    const o = e.target.closest("[data-ord]"), el = e.target.closest("[data-elegirR]");
    if (o) { orden = o.dataset.ord; return pintar(); }
    if (el) return elegirRespuesta(S0, RS.find(r => r.id === el.dataset.elegirr));
    if (e.target.closest("#bqCan")) { if (!confirm("¿Cancelar esta búsqueda?")) return; await DB.set("solicitudes", sid, { estado: "cancelada", actualizado: new Date().toISOString() }); BUSQ.set(null); toast("Búsqueda cancelada"); }
  };
  DB.escuchar("solicitudes", sid, s => {
    if (!s) { box.innerHTML = `<div class="vacio">🔍<h2>No encontramos la búsqueda ${esc(sid)}</h2><a class="btn btn-red" href="buscar">Nueva búsqueda</a></div>`; return; }
    S0 = s; if (s.estado !== "abierta" && BUSQ.get()?.id === sid) BUSQ.set(null); pintar();
  });
  DB.escucharLista(`solicitudes/${sid}/respuestas`, [], l => { const nuevo = l.length > RS.length && S0; RS = l; if (nuevo) { navigator.vibrate?.(200); toast("🙋 ¡Una tienda te respondió!"); } pintar(); });
  setInterval(() => { if (S0 && S0.estado === "abierta") pintar(); }, 1000);
}
function tarjetaResp(s, r) {
  const n = r.negocio || {}, aux = s.tipo === "auxilio", puede = !["elegida", "cancelada"].includes(s.estado);
  const ent = aux ? `🚨 Llega en ~${r.llegaMin || "?"} min` : n.delivery !== false && r.km != null && r.km <= radioNeg(n) ? `🛵 Delivery ${S(costoNeg(n, r.km))}` : `🏪 Solo recojo`;
  return `<div class="rsp ${s.elegida === r.negocioId ? "sel" : ""}"><div class="rsp-h">${n.logo ? `<img class="neg-l" src="${esc(n.logo)}" alt="">` : `<span class="neg-l ph">${esc((n.nombre || "?")[0])}</span>`}
      <div><b>${esc(n.nombre || "")}</b><small>${esc(n.distrito || "")}${r.km != null ? ` · 📍 ${r.km < 10 ? r.km.toFixed(1) : Math.round(r.km)} km` : ""}</small></div><strong>${S(r.precio)}</strong></div>
    <div class="tags">${r.calidad ? `<span class="st">${esc(r.calidad)}</span>` : ""}<span class="st ${aux ? "warn" : ""}">${ent}</span><span class="st mute">${hace(r.creado)}</span></div>
    ${r.nota ? `<p class="rsp-n">💬 ${esc(r.nota)}</p>` : ""}${r.foto ? `<img class="rsp-f" src="${esc(r.foto)}" alt="" loading="lazy">` : ""}
    ${s.elegida === r.negocioId ? `<p class="ok-t">✅ Elegiste esta</p>` : puede && !s.elegida ? `<button class="btn btn-red" data-elegirR="${esc(r.id)}">Elegir ${aux ? "este taller" : "esta tienda"}</button>` : ""}</div>`;
}

/* ---------- Elegir: se vuelve un pedido normal ---------- */
async function elegirRespuesta(s, r) {
  if (!s || !r) return; const neg = await DB.get("negocios", r.negocioId).catch(() => null);
  if (!neg || neg.estado !== "activo" || neg.bloqueoCobro) return toast("Esta tienda ya no está disponible", true);
  if (s.tipo === "repuesto") {
    // Al carrito con el precio que dio la tienda → el pago y la entrega de siempre
    const c = CART.get(); if (c.items.length && c.solicitud !== s.codigo && !confirm("Tu carrito tiene otros productos. ¿Reemplazarlos por este repuesto?")) return;
    CART.set({ negocio: neg.id, nombre: neg.nombre, solicitud: s.codigo, items: [{ key: "sol-" + s.codigo, id: "sol-" + s.codigo, n: s.texto.slice(0, 80), cant: 1, precio: +r.precio, opts: r.calidad || "", extras: "", nota: (r.nota || "").slice(0, 140) }] });
    return asegurarCliente(checkout);
  }
  // Auxilio: el taller recibe tu ubicación exacta y tu celular, y va
  asegurarCliente(() => {
    const b = BUSQ.get(), u = (b && b.id === s.codigo && b.ubic) || s.ubic, ref = (b && b.id === s.codigo && b.ref) || "";
    const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ck"><h2>¿Elegir a ${esc(neg.nombre)}?</h2>
      <div class="resumen"><div><span>Precio estimado</span><b>${S(r.precio)}</b></div><div><span>Llega en</span><b>~${r.llegaMin || "?"} min</b></div></div>
      <p class="muted">Le enviaremos tu ubicación y tu celular (${esc(PERFIL.celular || "")}) para que vaya. El precio final lo confirmas con el taller y le pagas a él.</p>
      <p class="err" id="axE"></p><button class="btn btn-red btn-lg" id="axOk">🚨 Sí, que venga</button></div>`);
    $("#axOk", h).onclick = async () => { const bt = $("#axOk", h); bt.disabled = true; bt.textContent = "Enviando…";
      const cod = codigo("AP"), ah = new Date().toISOString();
      try {
        await DB.batch([{ op: "set", col: "pedidos", id: cod, merge: false, data: { codigo: cod, negocioId: neg.id, negocio: { nombre: neg.nombre, logo: neg.logo || "", telefono: neg.telefono || "", whatsapp: neg.whatsapp || "", direccion: neg.direccion || "", ubic: neg.ubic || null },
            clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, items: [{ id: "sol-" + s.codigo, n: "Auxilio: " + (s.problema || "mecánico"), cant: 1, precio: +r.precio, opts: vehSol(s.vehiculo), extras: "", nota: (r.nota || "").slice(0, 140) }],
            subtotal: +r.precio, envio: 0, km: 0, total: +r.precio, entrega: "servicio", destino: { texto: "Ubicación GPS del cliente", referencia: ref, lat: u.lat, lng: u.lng }, nota: "",
            servicio: { detalle: s.texto, lugar: "domicilio", auxilio: true, llegaMin: r.llegaMin || null, fecha: "" }, solicitud: s.codigo, pago: "A coordinar", estado: "nuevo", dia: HOY(), mes: HOY().slice(0, 7), creado: ah } },
          { op: "set", col: "solicitudes", id: s.codigo, data: { estado: "elegida", elegida: neg.id, pedido: cod, actualizado: ah } }]);
        BUSQ.set(null); cerrarHoja(); location.href = `pedido?c=${encodeURIComponent(cod)}&nuevo=1`;
      } catch (x) { console.error(x); bt.disabled = false; bt.textContent = "🚨 Sí, que venga"; $("#axE", h).textContent = "No se pudo: " + (x.code || x.message); }
    };
  });
}
