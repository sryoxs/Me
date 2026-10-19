# Mando de PS4 en Minecraft Dungeons (PC)

Minecraft Dungeons en PC solo reconoce mandos de **Xbox**. Por eso el mando de
PS4 (DualShock 4) no funciona ni por cable ni por Bluetooth.

Este programa lee tu mando de PS4 y crea un **mando de Xbox virtual** que copia
todo lo que haces. El juego cree que tienes un mando de Xbox y funciona normal.
También pasa la vibración del juego a tu mando.

## Instalación (solo la primera vez)

1. **Instala Python** desde <https://www.python.org/downloads/>.
   En la primera pantalla del instalador marca la casilla
   **"Add python.exe to PATH"** antes de pulsar *Install Now*.
2. **Descarga esta carpeta** (`mando-ps4-dungeons`) a tu PC.
3. Haz doble clic en **`instalar.bat`**.
   - Si aparece el instalador de **ViGEmBus**, acepta la licencia, pulsa
     *Install* y luego *Finish*. Es el driver que crea el mando de Xbox virtual.

## Cómo jugar

1. Conecta el mando de PS4:
   - **Por cable USB:** usa un cable que transmita datos (algunos solo cargan).
   - **Por Bluetooth:** mantén pulsados **PS + Share** hasta que la luz
     parpadee rápido. En Windows ve a *Configuración > Bluetooth y dispositivos >
     Agregar dispositivo > Bluetooth* y elige **"Wireless Controller"**.
2. Haz doble clic en **`iniciar.bat`**. Cuando diga *"Mando conectado"*, la
   barra de luz del mando se pone **verde**.
3. **Deja esa ventana abierta** y abre Minecraft Dungeons.
4. Al terminar de jugar, cierra la ventana (o pulsa Ctrl+C).

Si desconectas el mando, el programa lo vuelve a detectar solo al reconectarlo.

## Botones

| Mando de PS4        | Mando de Xbox    |
|---------------------|------------------|
| Cruz ✕              | A                |
| Círculo ○           | B                |
| Cuadrado □          | X                |
| Triángulo △         | Y                |
| L1 / R1             | LB / RB          |
| L2 / R2             | LT / RT          |
| L3 / R3             | Clic palancas    |
| Share o clic en el panel táctil | View (Back) |
| Options             | Menu (Start)     |
| Botón PS            | Guide (Xbox)     |
| Cruceta y palancas  | Igual            |

## Opciones

Puedes añadir opciones abriendo una ventana de comandos en esta carpeta:

```
iniciar.bat --zona-muerta 0.15   # si el personaje se mueve solo (por defecto 0.05)
iniciar.bat --sin-vibracion      # para que el mando no vibre
```

## Problemas comunes

- **"No se pudo conectar con el driver ViGEmBus"**: el programa te ofrece abrir
  el instalador. Si no aparece, descárgalo de
  <https://github.com/nefarius/ViGEmBus/releases> e instálalo. Si sigue
  fallando, reinicia el PC.
- **"Aún no se detecta el mando"**: prueba otro cable u otro puerto USB. Si es
  por Bluetooth y ya estaba emparejado, quítalo en la configuración de
  Bluetooth y vuelve a emparejarlo.
- **El personaje se mueve solo**: usa `--zona-muerta 0.15` (o más).
- **Los controles hacen cosas dobles o raras**: cierra DS4Windows, DS4Tool u
  otros programas de mandos; no hace falta usarlos junto con este.
- **Al pulsar el botón PS se abre la Xbox Game Bar**: desactívalo en
  *Configuración > Juegos > Xbox Game Bar* ("Abrir Xbox Game Bar con este botón
  del mando").
- **Juegas Minecraft Dungeons desde Steam**: si el mando no responde bien,
  en Steam haz clic derecho en el juego > *Propiedades > Mando* y elige
  *Deshabilitar Steam Input*.
