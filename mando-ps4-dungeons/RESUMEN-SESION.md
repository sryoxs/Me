# Resumen de la sesión: mando de PS4 en Minecraft Dungeons

## El problema

En PC, Minecraft Dungeons solo reconoce mandos de **Xbox** (XInput). El mando
de PS4 (DualShock 4) usa otro sistema, así que el juego lo ignora tanto por
cable USB como por Bluetooth.

## La solución que construimos

Un programa en Python (`mando_ps4.py`) que:

1. Lee el mando de PS4 por USB o Bluetooth con **pygame-ce**.
2. Crea un **mando de Xbox 360 virtual** con **vgamepad** (usa el driver
   **ViGEmBus**) y le copia cada botón, palanca y gatillo unas 250 veces por segundo.
3. Pasa la vibración del juego al mando de PS4 y pone la luz del mando en
   **verde** cuando lo está usando.
4. Si el mando se desconecta, suelta todos los botones y espera a que vuelva.
5. Si a los 10 segundos no encuentra el mando, muestra consejos.
6. Si falta el driver ViGEmBus, lo explica y ofrece abrir su instalador.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `mando_ps4.py` | El programa |
| `instalar.bat` | Se ejecuta una vez: instala las librerías y el driver ViGEmBus |
| `iniciar.bat` | Se abre antes de jugar y se deja abierto |
| `requirements.txt` | Librerías: `pygame-ce>=2.5`, `vgamepad>=0.1.0` |
| `README.md` | Instrucciones completas, tabla de botones y problemas comunes |
| `RESUMEN-SESION.md` | Este resumen |

El código está en GitHub, en el repositorio `sryoxs/Me`, rama
`claude/mando-ps4-dungeons`, carpeta `mando-ps4-dungeons/`.

## Cómo instalarlo y usarlo

1. Instala Python desde <https://www.python.org/downloads/>. Marca
   **"Add python.exe to PATH"** en la primera pantalla.
2. Descomprime el ZIP (no lo ejecutes desde dentro del ZIP).
3. Doble clic en `instalar.bat`. Si aparece el instalador de **ViGEmBus**,
   acepta, pulsa *Install* y luego *Finish*.
4. Conecta el mando (cable de datos, o Bluetooth: mantén **PS + Share** hasta
   que la luz parpadee rápido y emparéjalo como "Wireless Controller").
5. Doble clic en `iniciar.bat`. Cuando diga "Mando conectado", abre el juego.

Opciones: `iniciar.bat --zona-muerta 0.15` (si el personaje se mueve solo) y
`iniciar.bat --sin-vibracion`.

## Decisiones técnicas

- **pygame-ce** en lugar de pygame: pygame no tiene versión para Python 3.14,
  que es el que se descarga hoy de python.org; pygame-ce sí.
- **vgamepad** solo se distribuye como código fuente; al instalarlo lanza el
  instalador de ViGEmBus si no está.
- El programa ignora cualquier mando cuyo nombre contenga "xbox" o "xinput",
  para no leerse a sí mismo (el mando virtual también aparece en la lista).
- Lee el mando aunque la ventana activa sea el juego (pista de SDL
  `SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS`).
- Clic en el panel táctil = Share = botón View de Xbox. Botón PS = botón Xbox.
- Zona muerta circular del 5 % por defecto.
- La vibración se renueva cada medio segundo mientras el juego la pide.

## Qué está probado y qué no

**Probado (en el servidor, con un mando simulado):**
- Cada botón llega al botón correcto de Xbox.
- Las palancas apuntan bien (incluido el eje vertical invertido).
- La zona muerta y los gatillos funcionan.
- La vibración se activa y se para.
- Desconectar y reconectar el mando.
- Cerrar con Ctrl+C.
- El mensaje cuando falta el driver ViGEmBus.
- Las opciones mal escritas se rechazan.

**Sin probar todavía:** en Windows real, con tu mando real y con el juego.
Desde el servidor no había acceso a tu PC.

**En curso al cerrar esta sesión:** una revisión a fondo antes de instalar
(instalación en Windows, lectura del mando por USB y Bluetooth, driver
ViGEmBus y la lógica del programa con las instrucciones). Si encuentra algo,
la versión corregida estará en la misma rama de GitHub.

## Lista de prueba en tu PC

- [ ] `instalar.bat` termina con "Instalacion completada".
- [ ] `iniciar.bat` muestra "Mando de Xbox virtual creado".
- [ ] **Por cable:** dice "Mando conectado" y la luz del mando se pone verde.
- [ ] **Por Bluetooth:** lo mismo.
- [ ] En Minecraft Dungeons el personaje se mueve con la palanca izquierda.
- [ ] Cruz, Círculo, Cuadrado, Triángulo, L1, R1, L2 y R2 hacen algo en el juego.
- [ ] Options abre el menú. Share o el panel táctil abren el mapa.
- [ ] El mando vibra cuando el juego lo pide.
- [ ] Al desconectar y reconectar el mando, vuelve a funcionar solo.
- [ ] Al cerrar la ventana no se queda ningún botón "pulsado" en el juego.

Si algo falla, copia el texto que aparece en la ventana negra; con eso se
puede corregir.

## Plan B

**DS4Windows** es un programa gratuito ya hecho que hace lo mismo (convierte
el mando de PS4 en uno de Xbox). No lo uses a la vez que este programa.

## Para seguir con Claude desde tu PC

Abre Claude (app de escritorio o Claude Code) en la carpeta del proyecto y pega esto:

> Lee `mando-ps4-dungeons/RESUMEN-SESION.md` y `mando-ps4-dungeons/README.md`.
> Es un programa que convierte mi mando de PS4 en un mando de Xbox virtual
> para jugar Minecraft Dungeons en Windows. Ayúdame a instalarlo y a
> probarlo con la lista de prueba del resumen. Si algo falla, corrígelo.
