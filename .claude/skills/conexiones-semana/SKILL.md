---
name: conexiones-semana
description: Cruza las capturas de los últimos siete días de 01-CAPTURES y escribe las conexiones no obvias como notas nuevas en 02-CONNECTIONS. Úsala cuando Smith diga «sesión de conexiones», «encuentra las conexiones de esta semana», «qué se conectó esta semana» o «conexiones del día» (entonces cruza solo lo de hoy contra los últimos 14 días), y en el ritual del domingo.
---

# Conexiones de la semana

## Proceso
1. Lee todas las notas agregadas a `01-CAPTURES/` en los últimos 7 días (o, para «conexiones del día», lo que entró hoy contra los últimos 14 días).
2. Busca conexiones cruzando TODAS las subcarpetas al mismo tiempo, no dentro de cada una. Estudio, código, contenido y vida diaria se cruzan entre sí: ahí está el valor.
3. Una conexión fuerte cumple uno de estos cuatro tipos:
   - TIPO A. El mismo principio de fondo apareciendo en dos dominios distintos.
   - TIPO B. Contradicción entre dos notas que crea una tensión interesante.
   - TIPO C. Patrón que conecta tres o más notas en una idea que todavía no tiene nombre.
   - TIPO D. Una pregunta de una nota que otra nota responde por accidente.
4. Para cada conexión fuerte:
   a. Nombra de qué tipo es.
   b. Escribe el puente entre las ideas en una sola frase.
   c. Escribe una entrada posible que use la conexión (o, si es de estudio, la pregunta de examen que la usa).
   d. Crea una nota nueva en `02-CONNECTIONS/` (`AAAA-MM-DD-titulo.md`, frontmatter `tipo: conexion`, `tipo_conexion: A|B|C|D`) que enlace las notas fuente con `[[Título]]`.

## Barra de calidad
Si la conexión es obvia, no califica. Solo suben las que sorprenderían de verdad a Smith, que fue quien escribió las notas.
Mínimo tres. Máximo cinco. Calidad sobre cantidad. Si la semana salió floja, dilo en la primera línea: cero conexiones vale más que tres forzadas.

## Cierre
Termina diciendo cuál de las conexiones vale más la pena trabajar como brief (contenido) o como repaso (estudio), y por qué. Si algo se repite en las capturas de las últimas semanas y todavía no tiene nombre, ponle uno y di si merece entrar al CLAUDE.md como pilar.
