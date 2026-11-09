# Fotos del sitio · Glamping La Kumbre

Todas las fotos viven en la carpeta `img/`, una carpeta por sección. **Cambiar una foto = subirla con el mismo nombre** (reemplaza la anterior; no se toca código). Formato **.webp**, calidad ~75-80, idealmente **menos de 150 KB** cada una.

## Regla de oro
1. Misma orientación y proporción que la foto que reemplaza (columna "Tamaño actual").
2. Nombre exacto, en minúsculas, sin espacios ni tildes.
3. Conversión rápida a webp: https://squoosh.app (calidad 75).

## Dónde va cada foto

| Archivo (dentro de `img/`) | Dónde aparece | Tamaño actual | Peso |
|---|---|---|---|
| `glampings/<glamping>/portada.webp` | Tarjeta del glamping en el inicio (veterano, colorado, piedra, tomate) | vertical 4:5 (de 640×800 a 1200×1500) | 60-200 KB |
| `glampings/<glamping>/01.webp, 02.webp …` | Galería que se abre en "Fotos y detalles" (se desliza de lado) | vertical 4:5, 1000×1250 | 90-150 KB |
| `alojamiento/interior-veterano.webp` | Sección "Al llegar", foto 1 | 640×800 | 54 KB |
| `alojamiento/desayuno-colorado.webp` | Sección "Al llegar", foto 2 | 640×800 | 84 KB |
| `zonas/malla-catamaran.webp` | Zonas comunes · Malla catamarán | 640×372 | 63 KB |
| `zonas/fogatas.webp` | Zonas comunes · Zona de fogatas | 640×372 | 48 KB |
| `zonas/bbq.webp` | Zonas comunes · Zona BBQ | 640×372 | 25 KB |
| `zonas/senderos.webp` | Zonas comunes · Senderos y miradores | 640×372 | 68 KB |
| `experiencias/masajes.webp` | Un día · Soltar la ciudad | 695×225 | 15 KB |
| `experiencias/cena-romantica.webp` | Un día · Cena a la luz de las velas | 910×500 | 97 KB |
| `experiencias/fogata.webp` | Un día · Fuego y estrellas | 640×372 | 48 KB |
| `experiencias/birding.webp` | Un día · Aves entre la niebla | 543×419 | 38 KB |
| `experiencias/desayuno-camino.webp` | Un día · Desayuno y camino | 1200×900 | 146 KB |
| `experiencias/picnic.webp` | Un día · Afuera, en la naturaleza (picnic) — pendiente de mejorar | 543×419 | 54 KB |
| `precios/entre-semana.webp` | Precios · recuadro "Entre semana" | 640×372 | 68 KB |
| `planes/plan-pareja.webp` | Precios · Plan Pareja | 640×800 | 54 KB |
| `planes/noche-romantica.webp` | Precios · Noche romántica | 900×1200 | 114 KB |
| `planes/descanso-profundo.webp` | Precios · Descanso profundo | 465×200 | 11 KB |
| `explorar/mirador-siatala.webp` | Inicio · Alrededor de La Kumbre, tarjeta 1 | 543×419 | 38 KB |
| `explorar/embalse-guavio.webp` | Inicio · Alrededor de La Kumbre, tarjeta 2 | 543×419 | 21 KB |

## Galerías de cada glamping (`img/glampings/<glamping>/`)
- Fotos **verticales 4:5** (ejemplo 1000×1250 px), numeradas con dos dígitos: `01.webp`, `02.webp`, `03.webp` …
- **Cambiar** una foto: súbela con el mismo número.
- **Agregar** una foto: súbela con el siguiente número y sube el número de ese glamping en `fotos.js` (es el único archivo de código que se toca).
- **Quitar** una foto: bájale uno al número en `fotos.js` y renumera para que no queden huecos.
- Hoy: veterano 7, colorado 6, piedra 7, tomate 6 (tomadas del sitio actual).

## Carta y guía
- `img/carta/…` fotos de los platos (el nombre del archivo es el del plato; se reemplaza igual).
- `img/guia/…` fotos de cada lugar recomendado.
- Una foto **nueva** (no reemplazo) en estas dos secciones sí requiere que Claude la enlace en la página.

## Logos
- `img/logo-bosque-v2.svg` (marca) e `img/logos/` (Airbnb, Booking, Google). No se tocan.
