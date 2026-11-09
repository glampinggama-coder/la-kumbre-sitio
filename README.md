# Sitio web — Glamping La Kumbre

Sitio estático, sin dependencias ni compilación. Se publica tal cual.

## Archivos

- `index.html` — landing principal
- `carta.html` — micrositio de comidas (Desayunos, Comidas, Rápidas, Bar)
- `guia.html` — micrositio "Alrededor de La Kumbre" + paradas en el camino
- `lk-runtime.js` — script pequeño que maneja popups, pestañas, filtros y enlaces de WhatsApp
- `img/` — fotos y logo

El contenido viene pre-renderizado en el HTML (bueno para Google) y el script lo activa al cargar.

## Probar en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar

**Netlify (recomendado):** arrastrar esta carpeta a https://app.netlify.com/drop, o con CLI:

```bash
npx netlify-cli deploy --dir=. --prod
```

Luego, en Netlify › Domain settings, conectar `glampinglakumbre.com`.

**Hostinger u otro hosting:** subir el contenido de esta carpeta a `public_html`.

## Dónde se edita el contenido

- Textos fijos: directamente en el HTML dentro de `<template id="tpl">`.
- Listas (glampings, experiencias, precios, preguntas, carta, lugares): en el bloque `<script id="logic">` al final de cada página.
- Si editas el `<template>`, el bloque pre-renderizado en `<div id="app">` se reemplaza al cargar; para SEO, vuelve a generarlo o pídeselo a Claude Code.

## Pendientes

- Política de tratamiento de datos (Ley 1581) y Términos y condiciones: agregar páginas y enlazarlas en el pie de `index.html`.
- WhatsApp de reservas: (+57) 322 207 0120.
