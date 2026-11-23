/* La Kumbre — analítica (GA4 directo, sin GTM).
   Se carga en el <head> de index.html, carta.html y guia.html.

   PARA ACTIVAR: pegar el ID de medición de GA4 (formato G-XXXXXXXXXX) en GA_ID.
   Mientras tenga el valor de ejemplo no se envía nada a Google, pero los eventos
   se acumulan en window.dataLayer (útil para probar).

   Prueba: abrir cualquier página con ?lkdebug=1 -> cada evento se imprime en la
   consola y se envía con debug_mode (aparece en GA4 > Admin > DebugView).

   Eventos (nombres GA4):
     page_view            automático; trae el parámetro tipo_pagina (home | micrositio_carta | micrositio_guia)
     whatsapp_click       cualquier enlace a WhatsApp. Params: seccion, destino, boton, tipo_pagina
     micrositio_click     clic desde la home hacia carta o guía. Params: destino, seccion
     cotizador_abrir      se abre la ventana "Reservar" (llegada, salida, huéspedes)
     cotizador_whatsapp   se pulsa el botón final del cotizador. Params: glamping, huespedes, con_fechas
     bf_banner_view       el banner de Black Friday se ve en pantalla. Param: fase
     bf_banner_click      clic en el banner o en la píldora (los emite oferta-bf.js)
     bf_abrir_simulador   se abre el simulador de la oferta (oferta-bf.js)
     bf_simulacion        el cliente completa una fecha válida en el simulador (oferta-bf.js)
     bf_whatsapp          envía la simulación a WhatsApp (oferta-bf.js)
     bf_lista_espera      pide que le avisen (oferta-bf.js)                                    */
(function () {
  'use strict';

  var GA_ID = 'G-PRT0674ES5';

  var host = location.hostname;
  var local = /^(localhost|127\.0\.0\.1)$/.test(host);
  var debug = /[?&]lkdebug=1/.test(location.search) && (local || /\.hostingersite\.com$/.test(host));
  var activo = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX' && !local;

  var path = location.pathname.toLowerCase();
  var tipoPagina = /carta/.test(path) ? 'micrositio_carta' : /guia/.test(path) ? 'micrositio_guia' : 'home';

  // ---------- gtag ----------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  var cfg = { tipo_pagina: tipoPagina };
  if (debug) cfg.debug_mode = true;
  window.gtag('config', GA_ID, cfg);

  if (activo) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function send(name, params) {
    params = params || {};
    if (debug) { try { console.log('[lk-analytics]', name, params); } catch (e) {} }
    try { window.gtag('event', name, params); } catch (e) {}
  }

  // ---------- Utilidades ----------
  function textoWA(href) {
    try {
      var u = new URL(href, location.href);
      return u.searchParams.get('text') || '';
    } catch (e) { return ''; }
  }

  function destinoWA(texto) {
    if (!texto) return 'chat directo';
    var m = /(?:informaci[oó]n sobre|sobre)\s+(.+)$/i.exec(texto.split('\n')[0]);
    if (m) return m[1].replace(/[.?!]+$/, '').slice(0, 100);
    if (/pedido de la carta/i.test(texto)) return 'pedido de la carta';
    if (/recomendaciones/i.test(texto)) return 'recomendaciones de la guía';
    if (/^hola, quiero reservar/i.test(texto)) return 'cotizador reserva';
    return texto.split('\n')[0].slice(0, 100);
  }

  function seccionDe(el) {
    if (el.closest('[role=dialog]')) return el.closest('[aria-labelledby=dlg-t]') ? 'cotizador_reservar' : 'ventana_detalle';
    if (el.closest('.bf-root')) return 'black_friday';
    var sec = el.closest('section[id]');
    if (sec) return sec.id;
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('section')) return 'seccion_sin_id';
    return 'flotante';
  }

  function etiqueta(el) {
    return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  }

  // ---------- Clics ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\b/i.test(href)) {
      var texto = textoWA(href);
      var sec = seccionDe(a);
      send('whatsapp_click', {
        seccion: sec,
        destino: destinoWA(texto),
        boton: etiqueta(a),
        tipo_pagina: tipoPagina
      });
      if (sec === 'cotizador_reservar') {
        var gl = /Glamping:\s*(.+)/.exec(texto);
        var hu = /Hu[eé]spedes:\s*(\d+)/.exec(texto);
        send('cotizador_whatsapp', {
          glamping: gl ? gl[1].trim() : '',
          huespedes: hu ? +hu[1] : 0,
          con_fechas: /Llegada:\s*\[por definir\]/.test(texto) ? 'no' : 'si'
        });
      }
      return;
    }

    if (/(^|\/)(carta|guia)\.html(#|$)/i.test(href) && tipoPagina === 'home') {
      send('micrositio_click', {
        destino: /carta/i.test(href) ? 'carta' : 'guia',
        seccion: seccionDe(a)
      });
    }
  }, true);

  // ---------- Cotizador "Reservar" (se abre y cierra re-renderizando el DOM) ----------
  var cotizadorAbierto = false;
  function vigilarCotizador() {
    var presente = !!document.getElementById('dlg-t');
    if (presente && !cotizadorAbierto) { cotizadorAbierto = true; send('cotizador_abrir', { tipo_pagina: tipoPagina }); }
    else if (!presente) { cotizadorAbierto = false; }
  }

  // ---------- Banner Black Friday visible ----------
  // oferta-bf.js repinta el banner (al cargar cupos), así que se re-observa el nodo vigente
  var bfEnviado = false, bfNodo = null, bfIO = null;
  function vigilarBanner() {
    if (bfEnviado) return;
    var b = document.querySelector('.bf-banner');
    if (!b || b === bfNodo) return;
    bfNodo = b;
    var fase = b.classList.contains('bf-banner--expectativa') ? 'expectativa' : 'oferta';
    function enviar() { if (!bfEnviado) { bfEnviado = true; if (bfIO) bfIO.disconnect(); send('bf_banner_view', { fase: fase }); } }
    if (!('IntersectionObserver' in window)) { enviar(); return; }
    if (bfIO) bfIO.disconnect();
    bfIO = new IntersectionObserver(function (en) { if (en[0].isIntersecting) enviar(); }, { threshold: 0.5 });
    bfIO.observe(b);
  }

  function iniciar() {
    vigilarBanner();
    vigilarCotizador();
    new MutationObserver(function () { vigilarBanner(); vigilarCotizador(); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
