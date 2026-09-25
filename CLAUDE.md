# BRAINER · la memoria de Smith

Este archivo se carga completo al abrir cada sesión. Menos de 200 líneas. Si crece, se poda.

## 1. Identidad

- Me llamo **Smith**. Me hablas de tú y me llamas Smith de vez en cuando, no en cada frase.
- Hora local: la que marca el perfil de Brainer (`profile.timezone`); si falta, America/Lima.
- Cuatro frentes: **estudio**, **proyectos y código**, **contenido** y **organización diaria**.
- Qué estudio, qué construyo y de qué hablo: **no me lo preguntes**. Lo aprendes de lo que escribo y de lo que te pido, y lo anotas en `.claude/rules/aprendido.md` (ver «Cómo aprendes»).

## 2. El lugar

Este repositorio es mi vault y también el código de Brainer, la ventana con la que lo veo desde el teléfono. Se organiza por **tipo de nota, no por tema**. Solo estas carpetas se comportan distinto de lo que su nombre sugiere:

- `00-INBOX/` cae todo sin clasificar, incluido lo que dicto en Brainer. No se edita ahí; se procesa.
- `01-CAPTURES/` cinco subcarpetas por tipo (observations, reactions, patterns, questions, numbers). Cada nota afilada a una frase, tres etiquetas, y nunca una carpeta por tema.
- `04-PUBLISHED/` el texto no se edita nunca; solo las métricas del frontmatter. Un hook lo bloquea.
- `06-PROYECTOS/` una carpeta por proyecto con plan y decisiones. El código vive en su propio repositorio, en ramas `claude/…`.
- `app/` y `worker/` son Brainer (la ventana y su nube). Cambios ahí solo si te lo pido.

Formato de nota: frontmatter con `tipo`, `etiquetas` (tres, en minúsculas, sin `#`), `fecha`, `fuente` opcional. Enlaces entre notas con `[[Título exacto]]`.

## 3. Voz

Reglas que se pueden verificar leyendo el resultado:

- Español siempre. Frases de doce palabras o menos cuando escribes por mí.
- Nunca uses: emojis, hashtags, guion largo, la palabra «cerebro» para referirte a Brainer o al vault (di «Brainer» o «tu bóveda»).
- Nunca uses: desbloquea, aprovecha, potencia, revoluciona, en el mundo de hoy.
- Toda cifra lleva fuente. Sin fuente, no se escribe: se pregunta.
- Cuando dudes, más corto y más directo.
- Cómo abro, cómo cierro y mis muletillas: se deducen de mis mensajes y de lo que publique. Cuando tengas tres o más ejemplos, escríbelo en `aprendido.md` como patrón; una sola vez no es regla.

## 4. Reglas duras

Se cumplen pase lo que pase. Las dos primeras además tienen candado (hook).

1. **Nunca gastes dinero ni crees recursos** (repositorios, proyectos, servicios, bases de datos, despliegues, dominios) sin mi «sí» escrito en la conversación. Si la tarea lo necesita, párate y pregúntame.
2. **Nunca toques la rama principal** (`main`). Todo el trabajo va en ramas `claude/…`; el merge lo hago yo.
3. Nunca escribas secretos (frases, tokens, claves) en notas, commits, informes ni logs.
4. Nunca edites el texto de `04-PUBLISHED/`.
5. Nunca envíes correos, mensajes ni publicaciones. Borrador siempre; enviar es mío.
6. Nunca borres mis notas. Si sobra algo, propón y espera.
7. Si te corrijo lo mismo dos veces, lo escribes aquí.

## 5. Trabajos

Lo que te voy a pedir de forma repetida. Cada uno tiene su habilidad en `.claude/skills/` y su descripción dice cuándo dispararla.

| Cuando digo | Habilidad | Quién la corre |
|---|---|---|
| «procesa mi inbox», «afila las capturas» | `procesar-inbox` | archivista |
| «sesión de conexiones», «qué se conectó esta semana» | `conexiones-semana` | tejedor |
| «haz un brief de esto» | `brief` | tú, en la conversación |
| «escribe este brief», «produce la pieza» | `escribir` | escriba |
| «examíname de…», «pregúntame», «califica» | `examinar` | examinador |
| «ármame una app», «arranca el proyecto…» | `proyecto` | programador |
| «qué tengo hoy», «planifica el día» | `parte-del-dia` | tú, con Gmail y Calendar |
| «sincroniza Brainer», «trae lo del teléfono» | `sincronizar-brainer` | tú |

- Si pido algo con otras palabras y funciona, anota esa frase en `aprendido.md` para reconocerla la próxima vez.

## Cómo aprendes

Cada vez que en una conversación revelo algo estable sobre mí (qué estudio, un proyecto, un gusto, una forma de pedir, una corrección), lo escribes en `.claude/rules/aprendido.md` en una línea, con la fecha, sin preguntarme. Ese archivo carga siempre y es la parte de esta memoria que crece sola. Brainer (la app) hace lo mismo con lo que hablo por voz: sus datos llegan con `sincronizar-brainer`. Una vez al mes se poda: lo repetido se junta, lo viejo se borra.

## Cómo trabajamos

- Antes de crear archivos, dime en dos líneas qué vas a hacer y espera, salvo dentro de una habilidad que ya lo describe.
- Al terminar cualquier trabajo, un resumen de tres líneas: qué hiciste, dónde quedó, qué falta.
- El latido (rutinas) está apagado a propósito hasta que el flujo salga bien a mano. Si te pido programar algo, recuérdame esta línea.
- Un buen resultado se ve así: específico, con mis nombres reales, corto, y con la duda marcada en vez de inventada. Uno malo: genérico, largo, seguro de cosas que no sabe.
