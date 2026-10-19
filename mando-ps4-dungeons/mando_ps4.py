"""Hace que un mando de PS4 (DualShock 4) funcione en Minecraft Dungeons en PC.

Minecraft Dungeons solo reconoce mandos de Xbox (XInput). Este programa lee el
mando de PS4, por cable USB o por Bluetooth, y copia cada botón y palanca a un
mando de Xbox 360 virtual (driver ViGEmBus), que el juego sí reconoce.

Uso:
    py mando_ps4.py                     # déjalo abierto mientras juegas
    py mando_ps4.py --zona-muerta 0.15  # si el personaje se mueve solo
    py mando_ps4.py --sin-vibracion

Para salir: Ctrl+C o cerrar la ventana.
"""
import argparse
import importlib.util
import math
import os
import platform
import sys
import time
from pathlib import Path

# Pistas para SDL (la librería que lee el mando): van antes de importar pygame.
os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1"
# Seguir leyendo el mando aunque la ventana activa sea la del juego.
os.environ["SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS"] = "1"
# Permite la vibración del DualShock 4 también por Bluetooth.
os.environ["SDL_JOYSTICK_HIDAPI_PS4_RUMBLE"] = "1"

try:
    import pygame
    from pygame._sdl2 import controller
except ImportError:
    sys.exit("Falta la librería pygame-ce. Ejecuta primero instalar.bat.")

URL_VIGEMBUS = "https://github.com/nefarius/ViGEmBus/releases"
BOTON_PANEL_TACTIL = 20  # SDL_CONTROLLER_BUTTON_TOUCHPAD; pygame no trae la constante
FRECUENCIA = 250  # lecturas por segundo
COLOR_LUZ = (0, 200, 60)  # barra de luz verde = el programa está usando el mando
AVISO_SIN_MANDO = 10  # segundos sin mando antes de mostrar consejos


def cargar_vgamepad():
    """Importa vgamepad, que crea el mando de Xbox virtual mediante ViGEmBus."""
    try:
        import vgamepad
    except ImportError:
        sys.exit("Falta la librería vgamepad. Ejecuta primero instalar.bat.")
    except Exception as error:  # vgamepad se conecta al driver al importarse
        print(f"No se pudo conectar con el driver ViGEmBus ({error}).")
        print("Ese driver es el que crea el mando de Xbox virtual y hay que instalarlo una vez.")
        ofrecer_instalar_vigembus()
        sys.exit(1)
    return vgamepad


def ofrecer_instalar_vigembus():
    spec = importlib.util.find_spec("vgamepad")
    arquitectura = "x64" if platform.machine().endswith("64") else "x86"
    instalador = None
    if spec and spec.submodule_search_locations:
        instalador = (Path(spec.submodule_search_locations[0]) / "win" / "vigem" / "install"
                      / arquitectura / f"ViGEmBusSetup_{arquitectura}.msi")
    if instalador and instalador.exists():
        respuesta = input("¿Abrir ahora el instalador de ViGEmBus? (s/n): ").strip().lower()
        if respuesta.startswith("s"):
            os.startfile(instalador)
            print("Cuando termine la instalación vuelve a abrir este programa")
            print("(si sigue fallando, reinicia el PC).")
            return
    print(f"Descárgalo e instálalo desde: {URL_VIGEMBUS}")


def tabla_botones(vg):
    """Botón del mando de PS4 (nombre estándar de SDL) -> botón del mando de Xbox."""
    xbox = vg.XUSB_BUTTON
    return (
        (pygame.CONTROLLER_BUTTON_A, xbox.XUSB_GAMEPAD_A),                       # Cruz
        (pygame.CONTROLLER_BUTTON_B, xbox.XUSB_GAMEPAD_B),                       # Círculo
        (pygame.CONTROLLER_BUTTON_X, xbox.XUSB_GAMEPAD_X),                       # Cuadrado
        (pygame.CONTROLLER_BUTTON_Y, xbox.XUSB_GAMEPAD_Y),                       # Triángulo
        (pygame.CONTROLLER_BUTTON_LEFTSHOULDER, xbox.XUSB_GAMEPAD_LEFT_SHOULDER),    # L1
        (pygame.CONTROLLER_BUTTON_RIGHTSHOULDER, xbox.XUSB_GAMEPAD_RIGHT_SHOULDER),  # R1
        (pygame.CONTROLLER_BUTTON_LEFTSTICK, xbox.XUSB_GAMEPAD_LEFT_THUMB),      # L3
        (pygame.CONTROLLER_BUTTON_RIGHTSTICK, xbox.XUSB_GAMEPAD_RIGHT_THUMB),    # R3
        (pygame.CONTROLLER_BUTTON_BACK, xbox.XUSB_GAMEPAD_BACK),                 # Share
        (BOTON_PANEL_TACTIL, xbox.XUSB_GAMEPAD_BACK),                            # Clic en el panel
        (pygame.CONTROLLER_BUTTON_START, xbox.XUSB_GAMEPAD_START),               # Options
        (pygame.CONTROLLER_BUTTON_GUIDE, xbox.XUSB_GAMEPAD_GUIDE),               # Botón PS
        (pygame.CONTROLLER_BUTTON_DPAD_UP, xbox.XUSB_GAMEPAD_DPAD_UP),
        (pygame.CONTROLLER_BUTTON_DPAD_DOWN, xbox.XUSB_GAMEPAD_DPAD_DOWN),
        (pygame.CONTROLLER_BUTTON_DPAD_LEFT, xbox.XUSB_GAMEPAD_DPAD_LEFT),
        (pygame.CONTROLLER_BUTTON_DPAD_RIGHT, xbox.XUSB_GAMEPAD_DPAD_RIGHT),
    )


def es_mando_xbox(nombre):
    # El mando virtual que creamos también aparece en la lista: hay que ignorarlo.
    nombre = nombre.lower()
    return "xbox" in nombre or "x-box" in nombre or "xinput" in nombre


def buscar_mando():
    """Devuelve el primer mando conectado que no sea de Xbox, o None."""
    for indice in range(controller.get_count()):
        if not controller.is_controller(indice):
            continue
        try:
            mando = controller.Controller(indice)
        except pygame.error:
            continue
        if not es_mando_xbox(mando.name):
            return mando
    return None


def stick(mando, eje_x, eje_y, zona_muerta):
    """Lee una palanca y la convierte al rango de Xbox (-32767..32767)."""
    x = max(-1.0, mando.get_axis(eje_x) / 32767)
    y = -max(-1.0, mando.get_axis(eje_y) / 32767)  # en SDL abajo es positivo; en Xbox, arriba
    magnitud = math.hypot(x, y)
    if magnitud <= zona_muerta:
        return 0, 0
    # Zona muerta circular reescalada para no perder precisión cerca del centro.
    escala = min(1.0, (magnitud - zona_muerta) / (1 - zona_muerta)) / magnitud
    return round(x * escala * 32767), round(y * escala * 32767)


def gatillo(mando, eje):
    return max(0, min(255, round(mando.get_axis(eje) * 255 / 32767)))


def leer_estado(mando, botones, zona_muerta):
    pulsados = frozenset(xbox for ps4, xbox in botones if mando.get_button(ps4))
    return (
        pulsados,
        gatillo(mando, pygame.CONTROLLER_AXIS_TRIGGERLEFT),
        gatillo(mando, pygame.CONTROLLER_AXIS_TRIGGERRIGHT),
        stick(mando, pygame.CONTROLLER_AXIS_LEFTX, pygame.CONTROLLER_AXIS_LEFTY, zona_muerta),
        stick(mando, pygame.CONTROLLER_AXIS_RIGHTX, pygame.CONTROLLER_AXIS_RIGHTY, zona_muerta),
    )


def aplicar(virtual, estado):
    pulsados, gatillo_izq, gatillo_der, stick_izq, stick_der = estado
    virtual.reset()
    for boton in pulsados:
        virtual.press_button(button=boton)
    virtual.left_trigger(value=gatillo_izq)
    virtual.right_trigger(value=gatillo_der)
    virtual.left_joystick(x_value=stick_izq[0], y_value=stick_izq[1])
    virtual.right_joystick(x_value=stick_der[0], y_value=stick_der[1])
    virtual.update()


def vibrar(mando, motor_grande, motor_pequeno):
    try:
        if motor_grande or motor_pequeno:
            # Se renueva cada medio segundo mientras el juego pida vibración.
            mando.rumble(motor_grande / 255, motor_pequeno / 255, 1000)
        else:
            mando.stop_rumble()
    except pygame.error:
        pass


def zona_muerta_valida(texto):
    valor = float(texto)
    if not 0 <= valor < 1:
        raise argparse.ArgumentTypeError("debe ser un número entre 0 y 0.99")
    return valor


def leer_argumentos():
    parser = argparse.ArgumentParser(
        description="Usa un mando de PS4 en Minecraft Dungeons convirtiéndolo en un mando de Xbox virtual.")
    parser.add_argument("--zona-muerta", type=zona_muerta_valida, default=0.05,
                        help="parte central de las palancas que se ignora, de 0 a 0.99 (por defecto 0.05)")
    parser.add_argument("--sin-vibracion", action="store_true",
                        help="no hacer vibrar el mando de PS4")
    return parser.parse_args()


def main():
    args = leer_argumentos()
    print("=== Mando de PS4 -> mando de Xbox para Minecraft Dungeons ===")
    vg = cargar_vgamepad()
    botones = tabla_botones(vg)

    pygame.display.init()  # SDL necesita el sistema de eventos para detectar mandos
    pygame.joystick.init()
    controller.init()

    virtual = vg.VX360Gamepad()
    vibracion = [0, 0]  # la escribe ViGEmBus desde otro hilo cuando el juego hace vibrar el mando
    if not args.sin_vibracion:
        def al_vibrar(client, target, large_motor, small_motor, led_number, user_data):
            vibracion[:] = [large_motor, small_motor]
        virtual.register_notification(callback_function=al_vibrar)
    print("Mando de Xbox virtual creado.")
    print("Buscando el mando de PS4 (conéctalo por cable USB o Bluetooth)...")

    mando = None
    ultimo_estado = None
    vibracion_aplicada = (0, 0)
    renovar_vibracion = 0.0
    proxima_busqueda = 0.0
    sin_mando_desde = time.monotonic()
    consejos_mostrados = False
    reloj = pygame.time.Clock()

    try:
        while True:
            pygame.event.get()  # vacía la cola y actualiza la lista de mandos
            ahora = time.monotonic()

            if mando is not None and not mando.attached():
                print("Mando desconectado. Esperando a que se vuelva a conectar...")
                mando = None
                virtual.reset()
                virtual.update()
                ultimo_estado = None
                sin_mando_desde = ahora

            if mando is None:
                if ahora >= proxima_busqueda:
                    proxima_busqueda = ahora + 1
                    mando = buscar_mando()
                    if mando is not None:
                        try:
                            mando.set_led(COLOR_LUZ)
                        except pygame.error:
                            pass
                        print(f"Mando conectado: {mando.name}")
                        print("Listo. Deja esta ventana abierta y abre Minecraft Dungeons.")
                        print("Para salir: Ctrl+C o cierra esta ventana.")
                    elif not consejos_mostrados and ahora - sin_mando_desde > AVISO_SIN_MANDO:
                        consejos_mostrados = True
                        print("Aún no se detecta el mando. Prueba esto:")
                        print(" - Por cable: usa otro cable (algunos solo cargan) u otro puerto USB.")
                        print(" - Por Bluetooth: mantén pulsados PS + Share hasta que la luz parpadee")
                        print("   rápido y emparéjalo en Configuración > Bluetooth ('Wireless Controller').")
                        print(" - Cierra DS4Windows u otros programas de mandos si están abiertos.")
                reloj.tick(FRECUENCIA)
                continue

            estado = leer_estado(mando, botones, args.zona_muerta)
            if estado != ultimo_estado:
                aplicar(virtual, estado)
                ultimo_estado = estado

            pedida = tuple(vibracion)
            if pedida != vibracion_aplicada or (any(pedida) and ahora >= renovar_vibracion):
                vibrar(mando, *pedida)
                vibracion_aplicada = pedida
                renovar_vibracion = ahora + 0.5

            reloj.tick(FRECUENCIA)
    except KeyboardInterrupt:
        print("\nCerrando...")
    finally:
        virtual.reset()
        virtual.update()
        if mando is not None:
            vibrar(mando, 0, 0)


if __name__ == "__main__":
    main()
