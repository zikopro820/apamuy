/* =========================================================
   APAMUY — Datos legales, aviso de cookies y Libro de Reclamaciones virtual
   ⚠️ COMPLETA AQUÍ los datos de tu empresa (salen en las páginas legales
   y en cada hoja del Libro de Reclamaciones).
   ========================================================= */
window.EMPRESA = {
  razonSocial: "[RAZÓN SOCIAL O NOMBRE DEL TITULAR]",
  ruc: "[RUC]",
  domicilio: "[DIRECCIÓN FISCAL], Cusco, Perú",
  correo: "[correo@de-atencion.com]",          // correo para reclamos y datos personales
  telefono: "",                               // opcional
  bancoDatos: "",                             // N° de inscripción del banco de datos ante la ANPD (cuando lo tengas)
  actualizado: "20 de noviembre de 2026"
};

/* ---------- Rellena los datos de la empresa en las páginas ---------- */
function pintarEmpresa() {
  const E = window.EMPRESA, set = (c, v) => $$(c).forEach(e => e.textContent = v);
  set(".emp-razon", E.razonSocial); set(".emp-ruc", E.ruc); set(".emp-dir", E.domicilio); set(".emp-correo", E.correo); set(".emp-fecha", E.actualizado);
  $$(".emp-correo-a").forEach(a => { a.href = "mailto:" + E.correo; a.textContent = E.correo; });
  $$(".emp-bd").forEach(e => e.textContent = E.bancoDatos ? `inscrito en el Registro Nacional de Protección de Datos Personales con el N° ${E.bancoDatos}` : "que será inscrito en el Registro Nacional de Protección de Datos Personales");
}

/* ---------- Aviso de cookies (solo usamos lo necesario para que la web funcione) ---------- */
function avisoCookies() {
  if (store.get("am_cookies", 0) || $("#ckAviso")) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="ck-aviso" id="ckAviso" role="region" aria-label="Aviso de cookies"><p>Usamos almacenamiento local y cookies <b>necesarias</b> para tu sesión, tu carrito y tu dirección. No usamos publicidad ni rastreo. <a href="cookies">Más información</a></p><button class="btn btn-dark btn-sm" id="ckOk">Entendido</button></div>`);
  $("#ckOk").onclick = () => { store.set("am_cookies", Date.now()); $("#ckAviso").remove(); };
}

/* ---------- Pie de página: enlaces legales y Libro de Reclamaciones ---------- */
function pieLegal() {
  $$(".pie").forEach(p => { if ($(".pie-legal", p)) return;
    p.insertAdjacentHTML("beforeend", `<div class="pie-legal"><a href="terminos">Términos y condiciones</a><a href="privacidad">Política de privacidad</a><a href="cookies">Política de cookies</a>
      <a class="pie-lr" href="libro-reclamaciones"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5M9 7h7M9 11h5"/></svg><span>Libro de Reclamaciones</span></a></div>`); });
}

/* =========== LIBRO DE RECLAMACIONES VIRTUAL =========== */
function paginaLibro() {
  const box = $("#libroBox"); if (!box) return;
  const E = window.EMPRESA, hoy = new Date(), cod = params.get("pedido") || "";
  box.innerHTML = `<form id="lrF" class="lr" novalidate>
    <div class="lr-cab"><div><b>Hoja de reclamación virtual</b><small>Fecha: ${hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })} · El número se asigna al enviar</small></div></div>
    <fieldset><legend>1. Proveedor</legend><dl class="lr-dl"><dt>Razón social</dt><dd>${esc(E.razonSocial)}</dd><dt>RUC</dt><dd>${esc(E.ruc)}</dd><dt>Domicilio</dt><dd>${esc(E.domicilio)}</dd></dl></fieldset>
    <fieldset><legend>2. Identificación del consumidor reclamante</legend><div class="g2">
      <label class="full">Nombres y apellidos *<input name="nombre" maxlength="100" autocomplete="name" required></label>
      <label>Tipo de documento *<select name="docTipo"><option>DNI</option><option>Carné de extranjería</option><option>Pasaporte</option><option>RUC</option></select></label>
      <label>N° de documento *<input name="docNum" maxlength="15" inputmode="numeric" required></label>
      <label class="full">Domicilio *<input name="domicilio" maxlength="150" autocomplete="street-address" required></label>
      <label>Teléfono *<input name="telefono" maxlength="12" inputmode="tel" autocomplete="tel" required></label>
      <label>Correo electrónico *<input name="email" type="email" maxlength="100" autocomplete="email" required></label>
      <label class="chk-l full"><input type="checkbox" name="menor" id="lrMenor"><span>El reclamante es menor de edad</span></label>
      <label class="full" id="lrApo" hidden>Nombre del padre, madre o apoderado *<input name="apoderado" maxlength="100"></label></div></fieldset>
    <fieldset><legend>3. Identificación del bien contratado</legend><div class="g2">
      <div class="seg2 full"><label><input type="radio" name="bien" value="Producto" checked><span>Producto</span></label><label><input type="radio" name="bien" value="Servicio"><span>Servicio</span></label></div>
      <label>N° de pedido o envío (si tienes)<input name="pedido" maxlength="20" value="${esc(cod)}" placeholder="Ej. AP-7KQ2M9"></label>
      <label>Monto reclamado (S/)<input name="monto" type="number" min="0" step="0.1" inputmode="decimal"></label>
      <label class="full">Negocio involucrado (si aplica)<input name="negocio" maxlength="100" placeholder="Ej. Pollería El Pollón"></label>
      <label class="full">Descripción del producto o servicio *<input name="descripcion" maxlength="200" required></label></div></fieldset>
    <fieldset><legend>4. Detalle de la reclamación y pedido del consumidor</legend>
      <div class="lr-tipo"><label><input type="radio" name="tipo" value="Reclamo" checked><span><b>Reclamo</b><small>Disconformidad con los productos o servicios.</small></span></label>
        <label><input type="radio" name="tipo" value="Queja"><span><b>Queja</b><small>Disconformidad con la atención al público, no relacionada con el producto o servicio.</small></span></label></div>
      <label>Detalle *<textarea name="detalle" rows="5" maxlength="2000" required placeholder="Cuéntanos qué pasó, con fecha y hora si las recuerdas."></textarea></label>
      <label>Pedido del consumidor *<textarea name="pedidoC" rows="3" maxlength="1000" required placeholder="¿Qué solución esperas? Ej. devolución del dinero, cambio del producto…"></textarea></label>
      <label>¿Cómo quieres recibir la respuesta? *<select name="canal"><option value="email">Por correo electrónico</option><option value="domicilio">Por carta a mi domicilio</option></select></label></fieldset>
    <div class="lr-nota"><p>• La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
      <p>• El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a <b>quince (15) días hábiles improrrogables</b>.</p>
      <p>• Para atender tu reclamo usaremos los datos de esta hoja según nuestra <a href="privacidad">Política de privacidad</a>.</p></div>
    <p class="err" id="lrErr" role="alert"></p><button class="btn btn-red btn-lg" id="lrBtn">Enviar hoja de reclamación</button></form>`;
  const F = $("#lrF"), err = $("#lrErr");
  if (YO) { F.email.value = YO.email || ""; F.nombre.value = (PERFIL && PERFIL.nombre) || YO.nombre || ""; F.telefono.value = (PERFIL && PERFIL.celular) || ""; }
  $("#lrMenor").onchange = e => { $("#lrApo").hidden = !e.target.checked; };
  F.onsubmit = async e => {
    e.preventDefault(); err.textContent = "";
    const d = {}; $$("[name]", F).forEach(x => { if (x.type === "radio") { if (x.checked) d[x.name] = x.value; } else if (x.type === "checkbox") d[x.name] = x.checked; else d[x.name] = x.value.trim(); });
    const req = $$("[required]", F).find(x => !x.value.trim()); if (req) { req.focus(); return err.textContent = "Completa: " + req.closest("label").firstChild.textContent.replace(" *", "").trim(); }
    if (d.docTipo === "DNI" && !/^\d{8}$/.test(d.docNum)) return err.textContent = "El DNI tiene 8 números.";
    if (d.telefono.replace(/\D/g, "").length < 7) return err.textContent = "Escribe un teléfono válido.";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return err.textContent = "Escribe un correo válido.";
    if (d.menor && !d.apoderado) return err.textContent = "Escribe el nombre del padre, madre o apoderado.";
    const b = $("#lrBtn"); b.disabled = true; b.textContent = "Enviando…";
    try {
      const ah = new Date().toISOString();
      const hoja = { fecha: ah, dia: HOY(), proveedor: { razonSocial: E.razonSocial, ruc: E.ruc, domicilio: E.domicilio },
        consumidor: { nombre: d.nombre, docTipo: d.docTipo, docNum: d.docNum, domicilio: d.domicilio, telefono: d.telefono, email: d.email.toLowerCase(), menor: !!d.menor, apoderado: d.menor ? d.apoderado : "" },
        bien: { tipo: d.bien, pedido: d.pedido.toUpperCase(), monto: d.monto === "" ? null : r2(d.monto), negocio: d.negocio, descripcion: d.descripcion },
        tipo: d.tipo, detalle: d.detalle, pedidoConsumidor: d.pedidoC, canal: d.canal, estado: "pendiente", vence: venceHabiles(15), uid: YO ? YO.uid : null };
      // Número correlativo: el contador sube de 1 en 1 y la hoja guarda su número
      const num = await DB.transaccion(async (get, set) => { const c = await get("contadores", "reclamos"), n = ((c && c.n) || 0) + 1;
        set("contadores", "reclamos", { n }); set("reclamos", "LR-" + n, { ...hoja, numero: n, codigo: "LR-" + n }); return n; });
      constancia({ ...hoja, numero: num, codigo: "LR-" + num });
    } catch (x) { console.error(x); b.disabled = false; b.textContent = "Enviar hoja de reclamación"; err.textContent = "No se pudo enviar: " + (x.code || x.message) + ". Inténtalo de nuevo o escríbenos a " + E.correo; }
  };
}
// Fecha límite de respuesta: 15 días hábiles (sin sábados ni domingos; los feriados se revisan al responder)
function venceHabiles(n) { const d = new Date(); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) k++; } return isoD(d); }
function constancia(h) {
  const c = h.consumidor, b = h.bien, f = new Date(h.fecha), num = String(h.numero).padStart(6, "0");
  $("#libroBox").innerHTML = `<div class="lr-ok no-print"><b>✓ Recibimos tu ${h.tipo.toLowerCase()}</b><span>Te responderemos ${h.canal === "email" ? "a <b>" + esc(c.email) + "</b>" : "a tu domicilio"} a más tardar el <b>${fmtF(h.vence, { day: "numeric", month: "long", year: "numeric" })}</b>. Guarda o imprime esta constancia.</span></div>
    <article class="lr-hoja" id="lrHoja"><header><div><b>LIBRO DE RECLAMACIONES</b><small>Hoja de reclamación virtual</small></div><div class="lr-n">N° ${num}-${f.getFullYear()}<small>${f.toLocaleString("es-PE")}</small></div></header>
      <h4>1. Proveedor</h4><p>${esc(h.proveedor.razonSocial)} · RUC ${esc(h.proveedor.ruc)}<br>${esc(h.proveedor.domicilio)}</p>
      <h4>2. Consumidor reclamante</h4><p>${esc(c.nombre)} · ${esc(c.docTipo)} ${esc(c.docNum)}<br>${esc(c.domicilio)}<br>Tel. ${esc(c.telefono)} · ${esc(c.email)}${c.menor ? `<br>Menor de edad · Apoderado: ${esc(c.apoderado)}` : ""}</p>
      <h4>3. Bien contratado</h4><p>${esc(b.tipo)}: ${esc(b.descripcion)}${b.pedido ? `<br>Pedido / envío: ${esc(b.pedido)}` : ""}${b.negocio ? `<br>Negocio: ${esc(b.negocio)}` : ""}${b.monto != null ? `<br>Monto reclamado: ${S(b.monto)}` : ""}</p>
      <h4>4. Detalle (${esc(h.tipo)})</h4><p>${esc(h.detalle).replace(/\n/g, "<br>")}</p><h4>Pedido del consumidor</h4><p>${esc(h.pedidoConsumidor).replace(/\n/g, "<br>")}</p>
      <h4>5. Observaciones y acciones adoptadas por el proveedor</h4><p class="muted">Pendiente. Plazo de respuesta: hasta el ${fmtF(h.vence, { day: "numeric", month: "long", year: "numeric" })} (15 días hábiles). Respuesta por ${h.canal === "email" ? "correo electrónico" : "carta al domicilio"}.</p>
      <footer>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles improrrogables.</footer></article>
    <div class="acts no-print"><button class="btn btn-red btn-lg" id="lrPrint">Descargar / imprimir constancia</button><a class="btn btn-light" href="./">Volver al inicio</a></div>`;
  $("#lrPrint").onclick = () => window.print(); scrollTo(0, 0);
}

/* ---------- Arranque de esta parte (todas las páginas) ---------- */
document.addEventListener("DOMContentLoaded", () => { pieLegal(); pintarEmpresa(); avisoCookies(); });
