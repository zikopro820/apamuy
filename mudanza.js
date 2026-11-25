/* ===== MUDANZA: el cliente pide camioneta o camión (ahora o programada), pone su precio y elige al conductor =====
   Usa la misma colección «envios» con tipo: "mudanza" (ofertas, mapa, seguimiento y rastreo son los mismos). */
const MUD_I = { pocas: "box", cuarto: "bag", depa: "home", casa: "store" };
async function paginaMudanza() {
  const box = $("#mudanzaBox"); if (!box) return;
  const ds = (PERFIL && PERFIL.direcciones) || [], bor = store.get("am_mud", null) || {};
  const E = { origen: bor.origen || (DIR.get() || ds[0] ? { ...(DIR.get() || ds[0]) } : null), destino: bor.destino || null, carga: bor.carga || "cuarto", ayud: bor.ayud ?? 1, cuando: bor.cuando || "ahora", fecha: bor.fecha || "", hora: bor.hora || "09:00", precio: bor.precio || null, tocado: !!bor.tocado };
  const piso = (id, v) => `<label>Piso<select id="${id}">${[["1", "1 (primer piso)"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5 o más"]].map(([k, t]) => `<option value="${k}" ${String(v || "1") === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>`;
  const manana = addD(HOY(), 1);
  box.innerHTML = `<form id="mF" novalidate>
    <section class="env-c"><div class="env-h"><span class="env-n">A</span><div><b>Recoger en</b><small>Donde se cargan tus cosas</small></div></div>
      ${ds.length ? `<div class="mini-chips">${ds.map((d, i) => `<button type="button" class="chip" data-od="${i}">${icoW("pin")} ${esc(d.etiqueta || "Dirección")}</button>`).join("")}</div>` : ""}
      <div class="mapa env-m" id="mO"></div><button type="button" class="btn btn-light btn-sm" id="gpsO">${icoW("pin")} Usar mi ubicación</button>
      <div class="g2"><label>Dirección *<input id="oTx" maxlength="120" value="${esc(E.origen?.texto || "")}" placeholder="Calle, número"></label><label>Referencia<input id="oRf" maxlength="120" value="${esc(E.origen?.referencia || "")}" placeholder="Ej. portón negro"></label>
        ${piso("pA", bor.pA)}<label class="chk-l mud-asc"><input type="checkbox" id="aA" ${bor.aA ? "checked" : ""}><span>Hay ascensor</span></label></div></section>
    <section class="env-c"><div class="env-h"><span class="env-n b">B</span><div><b>Llevar a</b><small>Tu nueva casa o local</small></div></div>
      <div class="mapa env-m" id="mD"></div><p class="muted sm">Toca el mapa o mueve el pin hasta la puerta.</p>
      <div class="g2"><label>Dirección *<input id="dTx2" maxlength="120" value="${esc(E.destino?.texto || "")}" placeholder="Calle, número"></label><label>Referencia<input id="dRf2" maxlength="120" value="${esc(E.destino?.referencia || "")}"></label>
        ${piso("pB", bor.pB)}<label class="chk-l mud-asc"><input type="checkbox" id="aB" ${bor.aB ? "checked" : ""}><span>Hay ascensor</span></label></div></section>
    <section class="env-c"><div class="env-h"><span class="env-n c">${icoW("truck")}</span><div><b>¿Qué vas a mudar?</b><small>Así sabemos qué vehículo necesitas</small></div></div>
      <div class="tams mud-t">${Object.entries(MUD).map(([k, [t, d]]) => `<label class="tam"><input type="radio" name="carga" value="${k}" ${E.carga === k ? "checked" : ""}><span class="tam-i">${icoW(MUD_I[k])}</span><b>${t}</b><small>${d}</small></label>`).join("")}</div>
      <p class="mud-rec" id="mRec"></p>
      <label>Cuéntale al conductor (opcional)<input id="mDet" maxlength="120" value="${esc(bor.det || "")}" placeholder="Ej. refrigeradora, cama de 2 plazas y 10 cajas"></label></section>
    <section class="env-c"><div class="env-h"><span class="env-n c">${icoW("user")}</span><div><b>Ayudantes para cargar</b><small>Personas que suben y bajan tus cosas</small></div></div>
      <div class="seg4">${[0, 1, 2, 3].map(n => `<label><input type="radio" name="ayud" value="${n}" ${+E.ayud === n ? "checked" : ""}><span>${n}</span></label>`).join("")}</div></section>
    <section class="env-c"><div class="env-h"><span class="env-n c">${icoW("clock")}</span><div><b>¿Cuándo?</b><small>Ahora mismo o el día que elijas</small></div></div>
      <div class="seg2"><label><input type="radio" name="cuando" value="ahora" ${E.cuando === "ahora" ? "checked" : ""}><span>Ahora</span></label><label><input type="radio" name="cuando" value="prog" ${E.cuando === "prog" ? "checked" : ""}><span>Programar</span></label></div>
      <div class="g2" id="mProg" ${E.cuando === "prog" ? "" : "hidden"}><label>Día<input type="date" id="mFe" min="${HOY()}" value="${esc(E.fecha || manana)}"></label><label>Hora<input type="time" id="mHo" value="${esc(E.hora)}"></label></div></section>
    <section class="env-c env-p"><div class="env-dist" id="eDist">Marca los dos puntos para calcular la distancia.</div>
      <div class="precio"><span>Tu oferta</span><div class="stp"><button type="button" data-st="-5" aria-label="Bajar S/ 5">−</button><label class="stp-v">S/<input id="ePr" type="number" inputmode="decimal" min="${MUD_CONF().minimo}" step="1"></label><button type="button" data-st="5" aria-label="Subir S/ 5">+</button></div>
        <small id="eSug"></small></div>
      <p class="muted sm">Tú pones el precio. Los conductores aceptan o te mandan una contraoferta, y tú eliges al que quieras. Pagas al conductor (efectivo o Yape).</p></section>
    <label class="chk-l"><input type="checkbox" id="eDecl" ${bor.decl ? "checked" : ""}><span>Declaro que no transporto nada prohibido por la ley y que embalaré mis cosas frágiles.</span></label>
    <p class="err" id="eErr" role="alert"></p><button class="btn btn-red btn-lg" id="eBtn">Buscar camión</button></form>`;
  const F = $("#mF"), err = $("#eErr");
  const guardarBor = () => store.set("am_mud", { origen: E.origen, destino: E.destino, carga: E.carga, ayud: E.ayud, cuando: E.cuando, fecha: $("#mFe").value, hora: $("#mHo").value, precio: E.precio, tocado: E.tocado,
    pA: $("#pA").value, pB: $("#pB").value, aA: $("#aA").checked, aB: $("#aB").checked, det: $("#mDet").value, decl: $("#eDecl").checked });
  const calc = () => {
    const km = E.origen && E.destino ? distanciaKm(E.origen, E.destino) : null, sug = sugerirMudanza(km, E.carga, E.ayud);
    const co = E.origen ? ciudadCercana(E.origen) : null, cd = E.destino ? ciudadCercana(E.destino) : null, inter = co && cd && (co.prov !== cd.prov || co.dep !== cd.dep);
    $("#eDist").innerHTML = km == null ? "Marca los dos puntos para calcular la distancia." : `${icoW("flag")} <b>${km.toFixed(1)} km</b> aprox.${inter ? ` · <span class="inter">Interprovincial: ${esc(co.prov)} → ${esc(cd.prov)}</span>` : cd ? ` · ${esc(co?.dis || "")} → ${esc(cd.dis)}` : ""}`;
    $("#mRec").innerHTML = `Recomendado: <b>${MUD[E.carga][2].map(v => VEHIC[v][1].toLowerCase()).join(" o ")}</b>`;
    if (!E.tocado || !E.precio) E.precio = sug; $("#ePr").value = E.precio; $("#eSug").textContent = km == null ? `Mínimo ${S(MUD_CONF().minimo)}` : `Sugerido ${S(sug)} · ${km.toFixed(0)} km, ${MUD[E.carga][0].toLowerCase()}${+E.ayud ? `, ${E.ayud} ayudante${+E.ayud > 1 ? "s" : ""}` : ""}`;
    E.km = km; E.inter = !!inter; E.co = co; E.cd = cd; guardarBor();
  };
  let MO = null, MD = null;
  mapaPin($("#mO"), E.origen, q => { E.origen = { ...(E.origen || {}), ...q }; calc(); }, { txt: "A", color: "#E63946" }).then(m => MO = m);
  mapaPin($("#mD"), E.destino, q => { E.destino = { ...(E.destino || {}), ...q }; calc(); }, { txt: "B", color: "#1A1430" }).then(m => MD = m);
  if (!E.origen) ubicar(q => { MO?.mover(q); }, true);
  $("#gpsO").onclick = () => { toast("Buscando tu ubicación…"); ubicar(q => { MO?.mover(q); toast("Ubicación encontrada"); }); };
  box.addEventListener("click", e => { const b = e.target.closest("[data-od]"); if (!b) return; const d = ds[+b.dataset.od]; E.origen = { ...d }; $("#oTx").value = d.texto; $("#oRf").value = d.referencia || ""; MO?.mover(d); });
  F.addEventListener("click", e => { const b = e.target.closest("[data-st]"); if (!b) return; E.tocado = true; E.precio = Math.max(MUD_CONF().minimo, r2((+$("#ePr").value || 0) + +b.dataset.st)); $("#ePr").value = E.precio; guardarBor(); });
  $("#ePr").oninput = e => { E.tocado = true; E.precio = +e.target.value || 0; guardarBor(); };
  F.onchange = e => { const n = e.target.name; if (n === "carga") { E.carga = e.target.value; calc(); } if (n === "ayud") { E.ayud = +e.target.value; calc(); } if (n === "cuando") { E.cuando = e.target.value; $("#mProg").hidden = E.cuando !== "prog"; } guardarBor(); };
  F.oninput = guardarBor; calc();
  F.onsubmit = e => { e.preventDefault(); err.textContent = "";
    E.origen && (E.origen = { ...E.origen, texto: $("#oTx").value.trim(), referencia: $("#oRf").value.trim() }); E.destino && (E.destino = { ...E.destino, texto: $("#dTx2").value.trim(), referencia: $("#dRf2").value.trim() });
    const pr = r2(+$("#ePr").value);
    if (!E.origen || E.origen.lat == null) return err.textContent = "Marca en el mapa dónde se cargan tus cosas.";
    if (!E.origen.texto) return err.textContent = "Escribe la dirección de recojo.";
    if (!E.destino || E.destino.lat == null) return err.textContent = "Marca en el mapa a dónde las llevamos.";
    if (!E.destino.texto) return err.textContent = "Escribe la dirección de destino.";
    if (!(pr >= MUD_CONF().minimo)) return err.textContent = `La oferta mínima es ${S(MUD_CONF().minimo)}.`;
    let prog = null; if (E.cuando === "prog") { const f = $("#mFe").value, h = $("#mHo").value; if (!f || !h) return err.textContent = "Elige el día y la hora de tu mudanza.";
      prog = new Date(`${f}T${h}:00`); if (!(prog > Date.now() + 30 * 60e3)) return err.textContent = "La mudanza programada debe ser al menos en 30 minutos. Si es para ya, elige «Ahora».";
      if (prog > Date.now() + 60 * 864e5) return err.textContent = "Puedes programar hasta 60 días antes."; }
    if (!$("#eDecl").checked) return err.textContent = "Marca la declaración para continuar.";
    guardarBor(); asegurarCliente(() => crearMudanza(pr, prog));
  };
  async function crearMudanza(pr, prog) {
    const b = $("#eBtn"); b.disabled = true; b.textContent = "Buscando…";
    try {
      const cod = codigo("MU"), tk = tokenRastreo(), ah = new Date().toISOString(), co = E.co || ciudadCercana(E.origen) || CIUDAD.get(), cd = E.cd || ciudadCercana(E.destino) || {};
      const pt = (x, c) => ({ texto: x.texto, referencia: x.referencia || "", lat: x.lat, lng: x.lng, dis: c.dis || "", provincia: c.prov || "", departamento: c.dep || "" });
      const det = $("#mDet").value.trim().slice(0, 120);
      const env = { codigo: cod, clienteUid: YO.uid, tipo: "mudanza", origen: pt(E.origen, co), destino: pt(E.destino, cd), prov: provKey(co.dep, co.prov), interprov: !!E.inter, km: r2(E.km || 0), tamano: "mudanza",
        contenido: (MUD[E.carga][0] + (det ? " · " + det : "")).slice(0, 80), paga: "recibe", carga: E.carga, ayudantes: +E.ayud, pisoA: +$("#pA").value, pisoB: +$("#pB").value, ascA: $("#aA").checked, ascB: $("#aB").checked,
        programado: prog ? prog.toISOString() : null, anillos: [10, 25], oferta: pr, sugerido: sugerirMudanza(E.km, E.carga, E.ayud), estado: "buscando", buscadoEn: ah, rastreo: tk, creado: ah,
        dia: prog ? isoD(prog) : HOY(), mes: (prog ? isoD(prog) : HOY()).slice(0, 7) };
      await DB.batch([{ op: "set", col: "envios", id: cod, merge: false, data: env },
        { op: "set", col: `envios/${cod}/priv`, id: "datos", merge: false, data: { clienteUid: YO.uid, cliente: { nombre: PERFIL.nombre, celular: PERFIL.celular }, receptor: { nombre: PERFIL.nombre, celular: PERFIL.celular } } },
        { op: "set", col: "rastreo", id: tk, merge: false, data: { uid: YO.uid, col: "envios", ref: cod, tipo: "envio", titulo: "Mudanza", estado: "buscando", origen: { lat: env.origen.lat, lng: env.origen.lng, texto: env.origen.dis }, destino: { lat: env.destino.lat, lng: env.destino.lng, texto: env.destino.texto }, repartidor: null, ubic: null, creado: ah } }]);
      store.del("am_mud"); location.href = "envio?c=" + encodeURIComponent(cod);
    } catch (x) { console.error(x); b.disabled = false; b.textContent = "Buscar camión"; err.textContent = "No se pudo crear la mudanza: " + (x.code || x.message); }
  }
}
