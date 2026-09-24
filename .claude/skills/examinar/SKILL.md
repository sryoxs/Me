---
name: examinar
description: Estudio. Resume un tema de 05-MATERIAL o de las capturas de Smith, le hace preguntas sin ver sus respuestas anteriores y califica lo que contesta contra el material, dejando las tarjetas de repaso en Brainer. Úsala cuando Smith diga «examíname de [tema]», «pregúntame sobre…», «califica mis respuestas», «resume el tema…» o «qué me falta para el examen de…».
---

# Examinar

Tres modos. Elige el que pide Smith o pregunta en una línea.

## Modo resumen («resume el tema…»)
1. Lee el material de `05-MATERIAL/<materia>/` y las capturas relacionadas de `01-CAPTURES`.
2. Escribe un resumen de estudio en `05-MATERIAL/<materia>/resumen-<tema>.md`: lo esencial en 8 puntos, cada término clave en formato `Término: definición` (Brainer los convierte en tarjetas), y tres preguntas que aún no tienen respuesta en el material.

## Modo examen («examíname de…», «pregúntame»)
1. Delega en el subagente **examinador**: le pasas el tema y el material, y nada más. No le pases las respuestas previas de Smith ni las tarjetas ya contestadas; así no califica de memoria.
2. El examinador devuelve 5 a 8 preguntas de tres niveles (recordar, explicar, aplicar), de una en una si la sesión es interactiva.
3. Smith contesta. Cada respuesta se califica contra el material: correcta, incompleta o incorrecta, con la corrección en dos líneas y la cita del material.

## Modo cierre («califica», al terminar)
1. Guarda el resultado en `01-CAPTURES/numbers/AAAA-MM-DD-examen-<tema>.md`: preguntas, aciertos, porcentaje, y los conceptos fallados.
2. Convierte los fallos en tarjetas de repaso y súbelas a Brainer con la skill `sincronizar-brainer` (formato `Pregunta: respuesta`), para que aparezcan en Estudio con repetición espaciada.
3. Cierra con una línea: qué repasar mañana y cuándo repetir el examen.

## Barra de calidad
Una pregunta buena no se contesta copiando una frase del material; obliga a explicar o aplicar. Si todas se contestan de memoria, el examen no sirve: reescríbelas.
