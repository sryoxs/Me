@echo off
setlocal
cd /d "%~dp0"
title Instalar - Mando PS4 para Minecraft Dungeons

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (
    python --version >nul 2>nul && set "PY=python"
)
if not defined PY (
    echo No se encontro Python en este PC.
    echo Se abrira la pagina de descarga. Al instalarlo marca la casilla "Add python.exe to PATH".
    echo Despues vuelve a abrir este archivo.
    start "" https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Instalando las librerias necesarias: pygame-ce y vgamepad
echo.
echo IMPORTANTE: si aparece el instalador de "ViGEmBus", acepta la licencia,
echo pulsa Install y luego Finish. Es el driver que crea el mando de Xbox virtual.
echo.
%PY% -m pip install --upgrade -r requirements.txt
if errorlevel 1 (
    echo.
    echo Hubo un error durante la instalacion. Revisa los mensajes de arriba.
    pause
    exit /b 1
)

echo.
echo Instalacion completada. Ahora abre iniciar.bat
pause
