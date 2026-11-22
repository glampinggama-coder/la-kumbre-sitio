/* La Kumbre — Oferta Black Friday / Cyber Days entre semana (BLACK26)
   Módulo independiente: no toca el template ni el pre-render del sitio.
   Fases automáticas (hora de Bogotá):
     - Expectativa: hasta el 24 nov 2026 23:59  -> banner teaser + lista de espera por WhatsApp
     - Oferta:      25 nov 00:00 a 30 nov 23:59 -> banner + simulador + envío a WhatsApp
     - Fin:         desde 1 dic 00:00            -> no se muestra nada
   Cupos vendidos: se leen de oferta-cupos.json (editable sin tocar este archivo).
   Prueba local / QA: agregar ?bf=expectativa | oferta | agotado | fin a la URL
   (solo funciona en localhost y *.hostingersite.com). */
(function () {
  'use strict';

  // ---------- Configuración ----------
  var CFG = {
    wa: '573222070120',
    code: 'BLACK26',
    launch: new Date('2026-11-25T00:00:00-05:00').getTime(),
    end: new Date('2026-12-01T00:00:00-05:00').getTime(),
    // Tarifa base por NOCHE según número de personas (antes del descuento).
    // 3 a 6 personas: PENDIENTE de definir; mientras sea null se cotiza por WhatsApp.
    precioNoche: { 1: 140000, 2: 260000, 3: null, 4: null, 5: null, 6: null },
    descuento: 0.25,
    abono: 0.40,
    cupos: 30,
    maxNoches: 3,
    maxPersonas: 6,
    primeraNoche: [2027, 1, 12],
    ultimaNoche: [2027, 4, 29],
    semanaSanta: [[2027, 3, 21], [2027, 3, 28]],
    foto: 'img/glampings/veterano/portada.webp',
    glampings: ['Me da igual, el que haya', 'El Veterano', 'El Colorado', 'La Piedra', 'El Tomate']
  };

  // ---------- Utilidades ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function d(a) { return new Date(a[0], a[1] - 1, a[2]); }
  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function fecha(dt) {
    return dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fechaCorta(dt) {
    return dt.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function addDays(dt, n) { var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n); return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var qs = new URLSearchParams(location.search);
  var testHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /\.hostingersite\.com$/.test(location.hostname);
  var forced = testHost ? qs.get('bf') : null;

  function fase() {
    if (forced === 'expectativa' || forced === 'oferta' || forced === 'agotado' || forced === 'fin') return forced === 'agotado' ? 'oferta' : forced;
    var n = Date.now();
    if (n >= CFG.end) return 'fin';
    if (n >= CFG.launch) return 'oferta';
    return 'expectativa';
  }

  var estado = { vendidos: forced === 'agotado' ? CFG.cupos : 0, fase: null };
  function quedan() { return Math.max(0, CFG.cupos - estado.vendidos); }
  function agotado() { return quedan() === 0; }

  function track(name, params) {
    try {
      var p = params || {};
      if (typeof window.gtag === 'function') { window.gtag('event', name, p); }
      else { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, p)); }
    } catch (e) {}
  }

  function origen() {
    var o = 'sitio web';
    var u = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return qs.get(k) ? k.replace('utm_', '') + '=' + qs.get(k) : ''; }).filter(Boolean);
    if (u.length) o += ' (' + u.join(', ') + ')';
    else if (document.referrer) { try { o += ' (desde ' + new URL(document.referrer).hostname + ')'; } catch (e) {} }
    return o;
  }

  function waUrl(texto) { return 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(texto); }
  function abrirWA(texto) {
    var w = window.open(waUrl(texto), '_blank', 'noopener');
    if (!w) location.href = waUrl(texto);
  }

  // ---------- Reglas de la oferta ----------
  function validar(llegada, noches) {
    if (!llegada) return { ok: false, msg: '' };
    var p = llegada.split('-');
    var ini = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(ini)) return { ok: false, msg: '' };
    var min = d(CFG.primeraNoche), max = d(CFG.ultimaNoche);
    var ss0 = d(CFG.semanaSanta[0]), ss1 = d(CFG.semanaSanta[1]);
    for (var i = 0; i < noches; i++) {
      var n = addDays(ini, i);
      if (n < min || n > max) return { ok: false, msg: 'La oferta aplica a noches entre el 12 de enero y el 29 de abril de 2027.' };
      if (n >= ss0 && n <= ss1) return { ok: false, msg: 'La oferta no aplica en Semana Santa (21 al 28 de marzo). Elige otra fecha.' };
      var dow = n.getDay();
      if (dow === 5 || dow === 6) {
        return { ok: false, msg: 'La oferta es de domingo a jueves y tu estadía incluye la noche del ' + (dow === 5 ? 'viernes' : 'sábado') + '. Prueba con otra fecha o con menos noches.' };
      }
    }
    return { ok: true, ini: ini, fin: addDays(ini, noches) };
  }

  function cotizar(personas, noches) {
    var base = CFG.precioNoche[personas];
    if (base == null) return null;
    var lista = base * noches;
    var desc = lista * CFG.descuento;
    var total = lista - desc;
    var abono = total * CFG.abono;
    return { lista: lista, desc: desc, total: total, abono: abono, saldo: total - abono };
  }

  // ---------- Estilos ----------
  var CSS = '' +
    '.bf-root,.bf-root *{box-sizing:border-box}' +
    '.bf-root{font-family:Raleway,system-ui,sans-serif;color:#252A26}' +
    '.bf-serif{font-family:"Playfair Display",Georgia,serif}' +
    '.bf-banner{position:relative;overflow:hidden;background:#344536;color:#F6F1E8;isolation:isolate}' +
    '.bf-banner:before{content:"";position:absolute;inset:0;z-index:-2;background:url(' + CFG.foto + ') center 38%/cover no-repeat}' +
    '.bf-banner:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(37,42,38,.92) 0%,rgba(37,42,38,.72) 55%,rgba(37,42,38,.35) 100%)}' +
    '.bf-wrap{max-width:1240px;margin:0 auto;padding:28px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:20px 32px}' +
    '.bf-badge{flex:0 0 auto;width:124px;height:124px;border-radius:50%;background:#C76B33;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(246,241,232,.22);transform:rotate(-6deg)}' +
    '.bf-badge b{font-family:"Playfair Display",Georgia,serif;font-size:46px;line-height:46px;font-weight:700}' +
    '.bf-badge span{font-size:13px;line-height:16px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}' +
    '.bf-text{flex:1 1 320px;min-width:0}' +
    '.bf-kicker{margin:0 0 6px;font-size:13px;line-height:18px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#D7C4A5}' +
    '.bf-title{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:40px;line-height:44px;font-weight:600;color:#F6F1E8}' +
    '.bf-title{text-wrap:balance}.bf-title em{font-style:italic;font-weight:400}' +
    '.bf-sub{margin:10px 0 0;font-size:17px;line-height:26px;color:#F6F1E8}' +
    '.bf-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:0;list-style:none}' +
    '.bf-chips li{background:rgba(246,241,232,.16);border:1px solid rgba(246,241,232,.35);border-radius:999px;padding:6px 14px;font-size:14px;line-height:20px;font-weight:600}' +
    '.bf-cta-col{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-start;gap:8px}' +
    '.bf-btn{font-family:Raleway,sans-serif;font-size:17px;line-height:22px;font-weight:700;color:#fff;background:#C76B33;border:0;border-radius:999px;padding:15px 30px;min-height:52px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.28)}' +
    '.bf-btn:hover{background:#B25C28}' +
    '.bf-btn:focus-visible,.bf-pill:focus-visible,.bf-x:focus-visible,.bf-root input:focus-visible,.bf-root select:focus-visible{outline:3px solid #129FB6;outline-offset:2px}' +
    '.bf-btn[disabled]{background:#8B8F86;cursor:not-allowed;box-shadow:none}' +
    '.bf-note{margin:0;font-size:14px;line-height:20px;color:#F6F1E8}' +
    '.bf-count{display:flex;gap:10px;margin:14px 0 0}' +
    '.bf-count div{min-width:64px;text-align:center;background:rgba(246,241,232,.16);border:1px solid rgba(246,241,232,.35);border-radius:12px;padding:8px 6px}' +
    '.bf-count b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:28px;line-height:30px}' +
    '.bf-count span{font-size:12px;line-height:16px;letter-spacing:.08em;text-transform:uppercase}' +
    '.bf-pill{position:fixed;left:50%;bottom:16px;transform:translate(-50%,120px);z-index:900;display:flex;align-items:center;gap:10px;background:#C76B33;color:#fff;border:0;border-radius:999px;padding:12px 22px;min-height:48px;font-family:Raleway,sans-serif;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .25s ease;white-space:nowrap}' +
    '.bf-pill.on{transform:translate(-50%,0)}' +
    '.bf-ov{position:fixed;inset:0;z-index:1000;background:rgba(37,42,38,.62);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.bf-ov[hidden]{display:none}' +
    '.bf-modal{position:relative;width:100%;max-width:540px;max-height:calc(100vh - 32px);overflow:auto;background:#F6F1E8;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.45)}' +
    '.bf-mh{background:#344536;color:#F6F1E8;padding:22px 56px 18px 24px}' +
    '.bf-mh h2{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:28px;line-height:34px;font-weight:600}' +
    '.bf-mh p{margin:4px 0 0;font-size:15px;line-height:22px;color:#D7C4A5}' +
    '.bf-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(246,241,232,.18);color:#F6F1E8;font-size:26px;line-height:1;cursor:pointer}' +
    '.bf-mb{padding:20px 24px 24px;display:flex;flex-direction:column;gap:14px}' +
    '.bf-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.bf-f{display:flex;flex-direction:column;gap:6px}' +
    '.bf-f label,.bf-f .bf-lbl{font-size:14px;line-height:18px;font-weight:700;color:#344536}' +
    '.bf-root input[type=text],.bf-root input[type=date],.bf-root select{font-family:Raleway,sans-serif;font-size:16px;line-height:22px;color:#252A26;background:#fff;border:1.5px solid #D7C4A5;border-radius:10px;padding:11px 12px;min-height:48px;width:100%}' +
    '.bf-radios{display:flex;gap:10px}' +
    '.bf-radios label{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1.5px solid #D7C4A5;border-radius:10px;background:#fff;font-size:15px;font-weight:600;color:#252A26;cursor:pointer}' +
    '.bf-radios input{accent-color:#C76B33;width:18px;height:18px}' +
    '.bf-err{margin:0;padding:10px 12px;border-radius:10px;background:#FBE9DD;color:#8A3B0E;font-size:14px;line-height:20px;font-weight:600}' +
    '.bf-err:empty{display:none}' +
    '.bf-sum{background:#fff;border:1.5px solid #D7C4A5;border-radius:14px;padding:14px 16px}' +
    '.bf-sum dl{margin:0;display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:15px;line-height:22px}' +
    '.bf-sum dt{color:#5C5F58}.bf-sum dd{margin:0;text-align:right;font-weight:600}' +
    '.bf-sum .bf-dates{grid-column:1/-1;text-align:left;color:#344536;font-weight:700}' +
    '.bf-sum .bf-total{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;padding-top:8px;border-top:1px solid #E6DAC4}.bf-sum .bf-total dt,.bf-sum .bf-total dd{font-size:19px;color:#344536;font-weight:700}' +
    '.bf-sum .bf-abono{grid-column:1/-1;display:flex;justify-content:space-between}.bf-sum .bf-abono dt,.bf-sum .bf-abono dd{color:#C76B33;font-weight:700}' +
    '.bf-sum .bf-off{color:#2F7A4B}' +
    '.bf-sum .bf-ph{grid-column:1/-1;margin:0;text-align:left;color:#5C5F58;font-size:14px}' +
    '.bf-go{width:100%;justify-content:center}' +
    '.bf-fine{margin:0;font-size:13px;line-height:19px;color:#5C5F58}' +
    '.bf-cond{font-size:13px;line-height:19px;color:#5C5F58}' +
    '.bf-cond summary{cursor:pointer;font-weight:700;color:#344536;min-height:32px;display:flex;align-items:center}' +
    '.bf-cond ul{margin:6px 0 0;padding-left:18px}' +
    '@media (max-width:640px){' +
    '.bf-wrap{padding:22px 18px;gap:16px}' +
    '.bf-badge{width:76px;height:76px}.bf-badge b{font-size:28px;line-height:28px}.bf-badge span{font-size:10px;line-height:12px}.bf-chips li{font-size:13px;padding:5px 12px}.bf-pill{bottom:84px}' +
    '.bf-title{font-size:30px;line-height:34px}.bf-sub{font-size:16px;line-height:24px}' +
    '.bf-banner:after{background:linear-gradient(180deg,rgba(37,42,38,.86) 0%,rgba(37,42,38,.78) 100%)}' +
    '.bf-cta-col,.bf-cta-col .bf-btn{width:100%}.bf-cta-col .bf-btn{justify-content:center}' +
    '.bf-ov{align-items:flex-end;padding:0}' +
    '.bf-modal{max-width:none;border-radius:20px 20px 0 0;max-height:94vh}' +
    '.bf-row{grid-template-columns:1fr 1fr}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){.bf-pill{transition:none}}';

  // ---------- Banner ----------
  var host, bannerEl, pillEl, ovEl, lastFocus, tick;

  function cuenta() {
    var ms = Math.max(0, CFG.launch - Date.now());
    var dd = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), mm = Math.floor(ms % 36e5 / 6e4);
    return '<div class="bf-count" role="timer" aria-label="Falta para el lanzamiento">' +
      '<div><b>' + dd + '</b><span>días</span></div><div><b>' + hh + '</b><span>horas</span></div><div><b>' + mm + '</b><span>min</span></div></div>';
  }

  function pintarBanner() {
    var f = estado.fase;
    if (f === 'fin') { if (host) host.remove(); host = null; return; }
    if (!host) {
      host = document.createElement('div');
      host.className = 'bf-root';
      document.body.insertBefore(host, document.body.firstChild);
    }
    var html;
    if (f === 'expectativa') {
      html = '<section class="bf-banner" aria-label="Black Friday en La Kumbre"><div class="bf-wrap">' +
        '<div class="bf-text"><p class="bf-kicker">Black Friday en La Kumbre</p>' +
        '<h2 class="bf-title">Algo grande llega para tus <em>escapadas entre semana</em></h2>' +
        '<p class="bf-sub">Se destapa el miércoles 25 de noviembre. Solo para quienes se enteren primero.</p>' + cuenta() + '</div>' +
        '<div class="bf-cta-col"><button type="button" class="bf-btn" data-bf="espera">Avísame primero <span aria-hidden="true">→</span></button>' +
        '<p class="bf-note">Te escribimos por WhatsApp, sin compromiso.</p></div></div></section>';
    } else {
      var ag = agotado();
      html = '<section class="bf-banner" aria-label="Oferta Black Friday en La Kumbre"><div class="bf-wrap">' +
        '<div class="bf-badge" aria-hidden="true"><b>25%</b><span>menos</span></div>' +
        '<div class="bf-text"><p class="bf-kicker">Black Friday en La Kumbre</p>' +
        '<h2 class="bf-title">Reserva ahora tu escapada <em>entre semana</em></h2>' +
        '<p class="bf-sub">Noches de domingo a jueves, de enero a abril de 2027.</p>' +
        '<ul class="bf-chips"><li>Solo ' + CFG.cupos + ' reservas</li><li>Abono del 40%</li><li>Hasta el lunes 30 de nov</li></ul></div>' +
        '<div class="bf-cta-col">' +
        (ag ? '<button type="button" class="bf-btn" data-bf="espera-agotado">Cupos agotados · avísame si se libera</button>'
            : '<button type="button" class="bf-btn" data-bf="abrir">Simula tu reserva <span aria-hidden="true">→</span></button>' +
              '<p class="bf-note">' + (quedan() <= 10 ? '<b>Quedan ' + quedan() + ' de ' + CFG.cupos + '</b> · ' : '') + 'Calcula tu valor en 20 segundos</p>') +
        '</div></div></section>';
    }
    host.innerHTML = '<style>' + CSS + '</style>' + html;
    bannerEl = $('.bf-banner', host);
    pintarPill();
  }

  function pintarPill() {
    if (pillEl) { pillEl.remove(); pillEl = null; }
    if (estado.fase !== 'oferta' || agotado()) return;
    pillEl = document.createElement('button');
    pillEl.type = 'button';
    pillEl.className = 'bf-root bf-pill';
    pillEl.setAttribute('data-bf', 'abrir');
    pillEl.innerHTML = '<span>25% entre semana</span><span aria-hidden="true">·</span><span>Simula tu reserva</span>';
    document.body.appendChild(pillEl);
    if ('IntersectionObserver' in window && bannerEl) {
      new IntersectionObserver(function (en) { pillEl && pillEl.classList.toggle('on', !en[0].isIntersecting); }, { threshold: 0 }).observe(bannerEl);
    } else { pillEl.classList.add('on'); }
  }

  // ---------- Modal de simulación ----------
  function modalHTML() {
    var min = iso(d(CFG.primeraNoche)), max = iso(d(CFG.ultimaNoche));
    var noches = '', pers = '', gl = '';
    for (var i = 1; i <= CFG.maxNoches; i++) noches += '<option value="' + i + '">' + i + (i === 1 ? ' noche' : ' noches') + '</option>';
    for (var j = 1; j <= CFG.maxPersonas; j++) pers += '<option value="' + j + '"' + (j === 2 ? ' selected' : '') + '>' + j + (j === 1 ? ' persona' : ' personas') + '</option>';
    CFG.glampings.forEach(function (g, k) { gl += '<option value="' + (k === 0 ? '' : esc(g)) + '">' + esc(g) + '</option>'; });
    return '<div class="bf-modal" role="dialog" aria-modal="true" aria-labelledby="bf-t">' +
      '<div class="bf-mh"><h2 id="bf-t">Simula tu reserva</h2><p>Black Friday · 25% de descuento entre semana</p>' +
      '<button type="button" class="bf-x" data-bf="cerrar" aria-label="Cerrar">×</button></div>' +
      '<form class="bf-mb" novalidate>' +
      '<div class="bf-f"><label for="bf-nombre">Tu nombre</label><input id="bf-nombre" type="text" autocomplete="given-name" placeholder="¿Cómo te llamas?" maxlength="60"></div>' +
      '<div class="bf-f"><label for="bf-fecha">Fecha de llegada (domingo a jueves)</label><input id="bf-fecha" type="date" min="' + min + '" max="' + max + '"></div>' +
      '<div class="bf-row"><div class="bf-f"><label for="bf-noches">Noches</label><select id="bf-noches">' + noches + '</select></div>' +
      '<div class="bf-f"><label for="bf-pers">Personas</label><select id="bf-pers">' + pers + '</select></div></div>' +
      '<div class="bf-f"><label for="bf-gl">Glamping preferido</label><select id="bf-gl">' + gl + '</select></div>' +
      '<div class="bf-f" role="group" aria-labelledby="bf-q"><span class="bf-lbl" id="bf-q">¿Ya pensabas venir entre semana antes de esta oferta?</span>' +
      '<div class="bf-radios"><label><input type="radio" name="bf-prev" value="Sí"> Sí</label><label><input type="radio" name="bf-prev" value="No"> No</label></div></div>' +
      '<p class="bf-err" id="bf-err" role="alert" aria-live="polite"></p>' +
      '<div class="bf-sum" aria-live="polite"><dl id="bf-sum"></dl></div>' +
      '<button type="submit" class="bf-btn bf-go" id="bf-go" disabled>Reservar por WhatsApp <span aria-hidden="true">→</span></button>' +
      '<p class="bf-fine">Te confirmamos disponibilidad en el chat. Tu cupo queda asegurado cuando pagas el abono del 40%.</p>' +
      '<details class="bf-cond"><summary>Condiciones de la oferta</summary><ul>' +
      '<li>' + CFG.cupos + ' reservas en total, del 25 al 30 de noviembre de 2026 o hasta agotar cupos.</li>' +
      '<li>Noches de domingo a jueves, del 12 de enero al 29 de abril de 2027. No aplica en Semana Santa ni puentes festivos.</li>' +
      '<li>Hasta ' + CFG.maxNoches + ' noches y ' + CFG.maxPersonas + ' personas por reserva. Tarifa base por noche: $140.000 para 1 persona y $260.000 para 2 personas.</li>' +
      '<li>Abono del 40% al reservar; el 60% restante se paga en sitio.</li>' +
      '<li>El abono es reembolsable si cancelas al menos 7 días antes de la fecha. Una sola reprogramación, hasta 7 días antes.</li>' +
      '</ul></details></form></div>';
  }

  function abrirModal() {
    if (agotado()) return;
    if (!ovEl) {
      ovEl = document.createElement('div');
      ovEl.className = 'bf-root bf-ov';
      ovEl.hidden = true;
      ovEl.innerHTML = modalHTML();
      document.body.appendChild(ovEl);
      var f = $('form', ovEl);
      var nom = store('lk_nombre');
      if (nom) $('#bf-nombre', ovEl).value = nom;
      ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, actualizar); });
      f.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
      ovEl.addEventListener('mousedown', function (e) { if (e.target === ovEl) cerrarModal(); });
    }
    lastFocus = document.activeElement;
    ovEl.hidden = false;
    document.body.style.overflow = 'hidden';
    actualizar();
    setTimeout(function () { var n = $('#bf-nombre', ovEl); if (n) n.focus(); }, 30);
    track('bf_abrir_simulador', { codigo: CFG.code });
  }

  function cerrarModal() {
    if (!ovEl || ovEl.hidden) return;
    ovEl.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var tocoSimulacion = false;
  function leer() {
    return {
      nombre: $('#bf-nombre', ovEl).value.trim(),
      fecha: $('#bf-fecha', ovEl).value,
      noches: +$('#bf-noches', ovEl).value,
      pers: +$('#bf-pers', ovEl).value,
      gl: $('#bf-gl', ovEl).value,
      prev: ($('input[name=bf-prev]:checked', ovEl) || {}).value || ''
    };
  }

  function actualizar() {
    var v = leer(), r = validar(v.fecha, v.noches), q = cotizar(v.pers, v.noches);
    $('#bf-err', ovEl).textContent = r.msg || '';
    var s = '';
    if (r.ok) {
      s += '<dd class="bf-dates">' + esc(fechaCorta(r.ini)) + ' → ' + esc(fechaCorta(r.fin)) + ' · ' + v.noches + (v.noches === 1 ? ' noche' : ' noches') + ' · ' + v.pers + (v.pers === 1 ? ' persona' : ' personas') + '</dd>';
    } else {
      s += '<dd class="bf-ph">Elige tu fecha de llegada para ver el valor de tu reserva.</dd>';
    }
    if (q) {
      s += '<dt>Valor normal</dt><dd>' + pesos(q.lista) + '</dd>' +
        '<dt>Descuento Black Friday (25%)</dt><dd class="bf-off">−' + pesos(q.desc) + '</dd>' +
        '<div class="bf-total"><dt>Total con oferta</dt><dd>' + pesos(q.total) + '</dd></div>' +
        '<div class="bf-abono"><dt>Abono hoy (40%)</dt><dd>' + pesos(q.abono) + '</dd></div>' +
        '<dt>Saldo en sitio (60%)</dt><dd>' + pesos(q.saldo) + '</dd>';
    } else {
      s += '<dd class="bf-ph">Para ' + v.pers + ' personas te damos el valor exacto con el 25% por WhatsApp.</dd>';
    }
    $('#bf-sum', ovEl).innerHTML = s;
    $('#bf-go', ovEl).disabled = !(r.ok && v.nombre.length >= 2);
    if (r.ok && !tocoSimulacion) { tocoSimulacion = true; track('bf_simulacion', { codigo: CFG.code, noches: v.noches, personas: v.pers }); }
  }

  function enviar() {
    var v = leer(), r = validar(v.fecha, v.noches);
    if (!r.ok || v.nombre.length < 2) return;
    var q = cotizar(v.pers, v.noches);
    store('lk_nombre', v.nombre);
    var t = '¡Hola! Quiero reservar con la oferta ' + CFG.code + ' (25% de descuento entre semana).\n\n' +
      'Nombre: ' + v.nombre + '\n' +
      'Llegada: ' + fecha(r.ini) + '\n' +
      'Salida: ' + fecha(r.fin) + ' (' + v.noches + (v.noches === 1 ? ' noche' : ' noches') + ')\n' +
      'Personas: ' + v.pers + '\n' +
      'Glamping preferido: ' + (v.gl || 'el que haya disponible') + '\n\n' +
      (q ? 'Valor normal: ' + pesos(q.lista) + '\n' +
        'Descuento 25%: −' + pesos(q.desc) + '\n' +
        'Total con oferta: ' + pesos(q.total) + '\n' +
        'Abono 40%: ' + pesos(q.abono) + '\n' +
        'Saldo 60% en sitio: ' + pesos(q.saldo) + '\n\n'
        : 'Somos ' + v.pers + ' personas: ¿me cotizan con el 25% de descuento?\n\n') +
      (v.prev ? '¿Ya pensaba venir entre semana antes de la oferta?: ' + v.prev + '\n' : '') +
      'Origen: ' + origen() + '\n\n' +
      '¿Me confirman disponibilidad para pagar el abono?';
    track('bf_whatsapp', { codigo: CFG.code, noches: v.noches, personas: v.pers, valor: q ? Math.round(q.total) : 0 });
    abrirWA(t);
  }

  function listaEspera() {
    track('bf_lista_espera', { codigo: CFG.code, fase: estado.fase });
    abrirWA('¡Hola! Quiero que me avisen primero de la oferta ' + CFG.code + ' de Black Friday para escapadas entre semana.\n\nOrigen: ' + origen());
  }

  // ---------- Eventos globales ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-bf]') : null;
    if (!b) return;
    var a = b.getAttribute('data-bf');
    if (a === 'abrir') { track('bf_banner_click', { fase: estado.fase }); abrirModal(); }
    else if (a === 'cerrar') cerrarModal();
    else if (a === 'espera' || a === 'espera-agotado') listaEspera();
  });
  document.addEventListener('keydown', function (e) {
    if (!ovEl || ovEl.hidden) return;
    if (e.key === 'Escape') { cerrarModal(); return; }
    if (e.key === 'Tab') {
      var els = Array.prototype.filter.call(ovEl.querySelectorAll('button,input,select,summary,a[href]'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- Arranque ----------
  function ciclo() {
    var nf = fase();
    if (nf !== estado.fase) { estado.fase = nf; pintarBanner(); }
    else if (nf === 'expectativa' && host) { var c = $('.bf-count', host); if (c) c.outerHTML = cuenta(); }
  }

  function iniciar() {
    estado.fase = fase();
    if (estado.fase === 'fin') return;
    pintarBanner();
    fetch('oferta-cupos.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || forced === 'agotado') return;
        if (typeof j.total === 'number') CFG.cupos = j.total;
        if (typeof j.vendidos === 'number') { estado.vendidos = j.vendidos; pintarBanner(); }
      })
      .catch(function () {});
    tick = setInterval(ciclo, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
