---
name: procesar-inbox
description: Procesa las capturas crudas de 00-INBOX del vault de Smith (también las que dictó en Brainer): las afila a una frase, les pone tres etiquetas y las archiva en la subcarpeta correcta de 01-CAPTURES. Úsala cuando Smith diga «procesa mi inbox», «afila las capturas de hoy» o «limpia el inbox», y también al empezar la sesión de la mañana si 00-INBOX tiene notas sin procesar.
---

# Procesar el inbox

## Proceso
1. Si hay capturas nuevas en Brainer (teléfono), corre primero la skill `sincronizar-brainer` para que caigan en 00-INBOX.
2. Lee cada nota que haya en `00-INBOX/` (menos el README).
3. Para cada nota:
   a. Decide a qué subcarpeta de `01-CAPTURES` pertenece: observations, reactions, patterns, questions o numbers. Por tipo, nunca por tema.
   b. Afila la nota cruda en una sola frase específica y punzante.
   c. Agrégale exactamente tres etiquetas en el frontmatter (`etiquetas:`), en minúsculas, sin `#`. Ni más, ni menos.
   d. Escribe la nota afilada en su subcarpeta como `AAAA-MM-DD-titulo-en-kebab.md` con frontmatter `tipo`, `etiquetas`, `fecha`, `fuente` (si venía de Brainer, su id).
   e. Solo entonces borra el original de `00-INBOX/`.
4. Al terminar, devuelve un reporte con:
   - Total de notas procesadas y a dónde fue cada una.
   - Cualquier patrón que hayas notado entre las capturas de hoy.
   - Una conexión que valga la pena explorar más.
5. Guarda ese mismo reporte, con la fecha arriba, en `.claude/ultima-corrida.md`, sobrescribiendo el anterior. Cuando esta skill corre sin nadie mirando, si el reporte no queda en un archivo se pierde.

## Barra de calidad
Una nota afilada tiene que ser tan específica que alguien de fuera la entienda sin contexto adicional. Si todavía necesita explicación, no está afilada. Reescríbela.

## Reglas
- No borres el original hasta que la nota afilada esté escrita en su carpeta.
- Si una nota no cabe en ninguna de las cinco subcarpetas, déjala en 00-INBOX y dilo en el reporte.
- Si una categoría se quedó con menos de cinco notas en total, márcalo: significa que Smith está capturando de un solo lado.
