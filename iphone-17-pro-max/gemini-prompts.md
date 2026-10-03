# Prompts para Gemini (generación / edición de imágenes)

**Mejor flujo (resultado real y sin rechazo del anuncio):**
1. Toma 5 fotos con tu celular de **tu iPhone real** (luz de ventana, sobre mesa blanca o madera clara).
2. Súbelas a Gemini **junto con el prompt** (modo edición). Así Gemini mejora el fondo/luz sin cambiar tu equipo.
3. Guarda los resultados en `fotos-originales/`, y corre `python tools/enhance.py` para dejarlas 1080×1080.

> Cambia `[COLOR]` y `[CAPACIDAD]` por los reales. Si no subes tu foto, la imagen será ilustrativa: no la uses como foto del equipo exacto.

## Prompt base (añádelo al inicio de todos)
"Fotografía de producto hiperrealista, tomada con cámara full-frame, lente 85mm f/2.8, luz natural suave de ventana, sombras suaves, reflejos reales en el vidrio, textura real del titanio, sin texto, sin marcas de agua, sin manos deformes, proporciones exactas de un iPhone 17 Pro Max."

## 1 · Portada
"[Prompt base] El iPhone 17 Pro Max color [COLOR] de frente, pantalla encendida con fondo de pantalla minimalista, apoyado ligeramente inclinado sobre una mesa de madera clara; fondo desenfocado de sala luminosa; composición cuadrada 1:1, espacio libre en la parte superior para texto."

## 2 · Cámaras
"[Prompt base] Primer plano macro de la parte trasera del iPhone 17 Pro Max [COLOR], las tres cámaras y el flash nítidos, reflejos suaves sobre el vidrio y el titanio, sobre superficie de mármol blanco, profundidad de campo corta, 1:1."

## 3 · Detalle del marco
"[Prompt base] Vista en ángulo de 45° del marco de titanio y los botones laterales del iPhone 17 Pro Max [COLOR], bordes impecables, luz lateral que resalta el acabado, fondo gris claro degradado, 1:1."

## 4 · Con accesorios
"[Prompt base] Vista cenital (flat lay) del iPhone 17 Pro Max [COLOR] junto a su caja blanca abierta, cable USB-C trenzado y herramienta de SIM, sobre mesa de madera clara, todo ordenado con simetría, 1:1."

## 5 · Estilo de vida
"[Prompt base] Una mano sosteniendo el iPhone 17 Pro Max [COLOR] frente a una ventana con luz de atardecer, mano natural con cinco dedos bien formados, fondo de ciudad desenfocado, sensación cálida y aspiracional, 1:1."

## Prompt de edición (para tus fotos reales)
"Edita esta foto: mantén el teléfono EXACTAMENTE igual (forma, color, rayones, logotipo y cámaras). Reemplaza el fondo por una mesa de madera clara limpia con fondo desenfocado, mejora la iluminación y el balance de blancos, elimina polvo y objetos de distracción. No añadas texto. Formato cuadrado 1:1, aspecto fotográfico realista."
