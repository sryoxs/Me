---
name: marketing-publicidad
description: Crea publicidad y material de venta para productos (anuncios de Facebook Marketplace, Instagram, WhatsApp). Úsala cuando el usuario quiera vender algo, escribir una descripción atractiva, diseñar fotos/creatividades, preparar prompts para generadores de imagen (Gemini, Canva) o planear cómo publicar y conseguir más compradores.
---

# Marketing y publicidad

## Flujo
1. **Datos del producto** – modelo, capacidad, color, estado (sellado/usado), desbloqueo/carrier, accesorios, garantía, precio, ciudad. Si falta algo, usa marcadores `[PRECIO]` y avisa; no inventes datos.
2. **Tres claves de venta** – elige 3 beneficios concretos (no adjetivos vacíos): qué gana el comprador, qué lo diferencia, qué reduce su miedo a comprar.
3. **Título** – ≤ 80 caracteres: producto + capacidad + estado + gancho. Ej: `iPhone 17 Pro Max 256GB – Importado USA, Desbloqueado`.
4. **Descripción** – gancho en la 1.ª línea, 3 claves con viñetas, ficha técnica corta, condiciones (entrega, pago, garantía) y llamada a la acción clara.
5. **Imágenes (4–5)** – portada limpia, ángulo trasero/cámaras, detalle del marco/pantalla, accesorios/caja, y una gráfica de claves. Formato cuadrado 1080×1080.
6. **Publicación** – categoría correcta, ubicación, precio con margen de negociación, responder rápido, republicar cada 7 días.

## Reglas de honestidad (importante)
- Las fotos deben representar **el producto real que se entrega**. Se puede mejorar luz, fondo y recorte; no se debe mostrar un estado, color, accesorio o capacidad que no sea el real.
- Las imágenes generadas con IA solo para fondos/ambientación, o rotuladas como ilustrativas. Marketplace puede rechazar anuncios con imágenes engañosas.
- No afirmar garantía, sellado o "original Apple" si no es verificable. Sugerir mostrar IMEI/estado de batería y permitir revisión en persona.
- Seguridad al vender: lugar público, verificar pago antes de entregar, no enviar códigos de verificación ni aceptar cheques/enlaces raros.

## Herramientas del proyecto
- `iphone-17-pro-max/listing.md` – anuncio listo para pegar.
- `iphone-17-pro-max/gemini-prompts.md` – prompts de imagen.
- `tools/enhance.py` – convierte fotos reales en piezas 1080×1080 (mejora de luz/color, recorte, rótulos).
