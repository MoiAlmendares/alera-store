# Plan de Generación de Ventas — Alera

**Fecha:** Abril 2026
**Horizonte:** 90 días (3 meses)
**Moneda:** Lempiras (HNL)
**Restricción clave:** 2–5 h/semana, sin producción de contenido propio.

---

## Diagnóstico rápido

- **Producto:** Coleccionables pop culture hechos a mano en Honduras — llaveros, lámparas, decoración de pared y figuras (Star Wars, Minecraft, Naruto, Pokémon, Demon Slayer).
- **Audiencia objetivo:** Gamers, otakus y coleccionistas en Honduras, 15–35 años. Dos segmentos: el fan que se compra a sí mismo y el que regala a su pareja/hermano/amigo fan.
- **Canal principal hoy:** Facebook Marketplace.
- **Activos existentes:** tienda web (`index.html`), catálogo de Facebook, panel admin, fotos de producto ya producidas (carpeta `assets/`), backend en AWS Lambda.
- **Cuello de botella:** falta de tráfico — quien te ve convierte, pero poca gente te descubre.
- **Presupuesto:** publicidad pagada mensual fija disponible.
- **Tiempo disponible:** 2–5 h/semana (no hay bandwidth para grabar videos ni alimentar redes diariamente).

---

## Decisión estratégica

Con 2–5 h/semana y cero producción de contenido, se descarta el motor orgánico (TikTok/Reels/IG diario) y se concentra todo en **dos motores escalables que no dependen de contenido fresco**:

1. **Meta Ads pagadas** usando tus fotos de catálogo ya existentes.
2. **Marketplace industrializado** — cada SKU publicado de forma óptima y renovado semanalmente.

Apoyados por un **motor pasivo de retención** (WhatsApp Business a clientes existentes) que no consume tiempo semanal.

---

## Objetivos de 90 días

| # | Objetivo | Meta | Cómo se mide |
|---|----------|------|--------------|
| 1 | Tráfico calificado a tienda + catálogo | +3 000 visitas únicas/mes al mes 3 | Meta Pixel + Google Analytics en `index.html` |
| 2 | Pedidos mensuales | +40–60% vs. base actual | Panel admin |
| 3 | ROAS estable | ≥ 2.5 al mes 3 (pagas L 1, vendes L 2.5) | Meta Ads Manager |
| 4 | Recompra | 15% de clientes repite dentro de 90 días | Panel admin + lista WhatsApp |

> Ajusta las cifras absolutas con tus números reales. La estructura se mantiene.

---

## Motor 1 — Meta Ads con catálogo (PRIORIDAD MÁXIMA)

### Por qué es el corazón del plan
Ya tienes las fotos hechas. El pixel y las campañas trabajan 24/7 sin que tú grabes nada. Es el único canal que escala linealmente con presupuesto.

### Setup inicial (semana 1, una sola vez)

1. **Meta Pixel en `index.html`** con estos eventos: `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`. Sin esto las ads son a ciegas.
2. **Catálogo de Facebook conectado** al Business Manager (aparentemente ya lo tienes vía `Catálogo facebook.html`).
3. **Audiencia personalizada de visitantes** (últimos 180 días) + **audiencia de compradores**.
4. **Lookalike 1%** de compradores (cuando haya ≥ 100 eventos de compra).

### Estructura de campañas

| Campaña | Objetivo | Presupuesto % | Creativo |
|---------|----------|---------------|----------|
| **Advantage+ Shopping** (catálogo completo) | Ventas | 50% | Fotos del catálogo, sin intervención tuya |
| **Producto ganador** (top 1–3 SKUs) | Ventas | 30% | Carrusel estático de 3–5 fotos del SKU |
| **Retargeting** (visitantes + carritos abandonados) | Ventas | 20% | Fotos + copy tipo "¿Olvidaste algo?" |

### Reglas simples de optimización

- **ROAS < 1 durante 5 días** → pausar.
- **ROAS > 2 durante 5 días** → subir presupuesto 20% semanal.
- **CPC > L 8** → cambiar foto principal del anuncio.
- **No tocar nada los primeros 7 días** (fase de aprendizaje del algoritmo).

### Tiempo semanal requerido
**1 h los lunes** revisando Ads Manager. Nada más.

---

## Motor 2 — Marketplace industrializado

### Por qué
Es tu canal actual, ya convierte, y es gratis. El secreto no es publicar mejor, es **publicar más y renovar**.

### Setup inicial (semana 1)

- Listar los **30 SKUs top como anuncios individuales** (no todo en uno). Cada uno aparece en búsquedas distintas.
- Cada anuncio con:
  - Título con palabra clave + uso + ocasión: *"Llavero Mandalorian Star Wars — regalo para fan de Baby Yoda"*.
  - Primera foto la más llamativa (lámpara prendida, no apagada).
  - Ciudades: Tegucigalpa, San Pedro Sula, La Ceiba (cubres las 3 búsquedas grandes).
  - Descripción corta con talla, materiales, tiempo de envío y método de pago.
- Abrir **Facebook Shop** conectado al mismo catálogo para que el comprador que te encontró en Marketplace vea más productos.

### Rutina semanal
- **Martes 30 min:** renovar 15 anuncios más viejos.
- **Viernes 30 min:** renovar los otros 15 + responder consultas.

### Tiempo semanal
**1 h/semana** en dos bloques cortos.

---

## Motor 3 — Retención pasiva por WhatsApp (bonus sin tiempo recurrente)

### Por qué
Ya tienes clientes que compraron. Es 5–10x más barato venderles de nuevo que adquirir uno nuevo. Con una lista de difusión bien armada, un mensaje al mes genera ventas sin esfuerzo.

### Setup único (1 tarde, semana 2)
- Exportar del panel admin la lista de clientes con número de WhatsApp.
- Crear **lista de difusión** en WhatsApp Business (no grupo — difusión) segmentada por universo favorito si es posible (Star Wars, Anime, etc.).
- Plantilla de mensaje mensual:
  > *"¡Hola [nombre]! 🎬 Acaba de entrar esto al taller: [foto + link]. Si eres fan de [universo] te va a gustar. Responde a este chat si lo quieres apartar."*

### Rutina
**1 mensaje por mes**. Total: 15 min/mes.

---

## Posicionamiento de marca (aplicado a copy de ads y Marketplace)

Para que los 3 motores digan lo mismo:

**Propuesta de Valor Única:**
> *"Alera convierte tus universos favoritos en piezas hechas a mano en Honduras — coleccionables que decoran, iluminan y se sienten tuyos."*

**Pilares a usar en copy:**
1. **Hecho a mano en Honduras** → genera confianza y orgullo local.
2. **Pop culture con alma** → no es merch chino genérico.
3. **Envíos a todo el país** → reduce fricción.

**Frases para copiar-pegar en anuncios:**
- *"Hecho a mano en Honduras, envío a todo el país."*
- *"Tu universo favorito, en tus manos."*
- *"Piezas únicas para verdaderos fans."*

---

## Plan de acción — 4 semanas

| Semana | Horas | Acciones | Resultado |
|--------|-------|----------|-----------|
| **1** | 4–5 h (setup único) | Instalar Meta Pixel + eventos en `index.html`. Conectar catálogo al Business Manager. Listar 30 SKUs en Marketplace. | Infraestructura lista. |
| **2** | 3 h | Lanzar campaña Advantage+ Shopping. Lanzar campaña de producto ganador. Exportar clientes y armar lista WhatsApp. | Campañas corriendo, lista WA lista. |
| **3** | 2 h | Revisar ads lunes. Renovar Marketplace martes y viernes. Primer mensaje de WhatsApp broadcast. | Primeros datos de ROAS + primera venta de recompra. |
| **4** | 2 h | Iterar ads: pausar malas, escalar buenas. Lanzar retargeting a carritos abandonados. Renovar Marketplace. | Primer round de optimización cerrado. |

**A partir de la semana 5:** rutina estable de **2 h/semana** + WhatsApp una vez al mes.

---

## Dashboard semanal (revisar cada lunes, 15 min)

- Tráfico semanal a `index.html` (Google Analytics).
- ROAS por campaña (Meta Ads Manager).
- CPC promedio y CTR.
- Pedidos confirmados (panel admin).
- Tasa de conversión del sitio. Meta: ≥ 1.5%.
- Mensajes entrantes en WhatsApp/Marketplace.

---

## KPIs críticos (si alguno se cae, avisar)

- **ROAS de la campaña principal < 1.5 por 10 días** → pausar y rearmar creativo/audiencia.
- **CPC > L 10 sostenido** → la foto principal no jala, cambiar.
- **Tasa de conversión del sitio < 0.8%** → no es problema de ads, es de tienda (precio, confianza, checkout).

---

## Próximos pasos inmediatos (esta semana)

1. Confirmar **monto mensual de presupuesto de ads** (para distribuir entre las 3 campañas).
2. Instalar **Meta Pixel + eventos** en `index.html` — lo podemos hacer juntos en esta sesión, te dejo el código listo para pegar.
3. Identificar el **producto ganador** actual desde el panel admin para la campaña de producto individual.
4. Decidir si el setup inicial (semana 1) lo hacemos tú y yo juntos aquí, o lo dejamos documentado paso-a-paso para que lo ejecutes cuando puedas.

---

## Supuestos explícitos

- Producto-mercado-fit ya existe (hay ventas reales por Marketplace).
- Precios están en rango competitivo para Honduras.
- El admin procesa pedidos sin fricción significativa.
- El pixel se puede instalar sin tocar el backend (solo `index.html` y checkout).
- Existe al menos 1 SKU con historial de ventas claro para ser "producto ganador".

Si alguno falla, se ajusta antes de escalar presupuesto.
