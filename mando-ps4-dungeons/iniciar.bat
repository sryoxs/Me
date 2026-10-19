@echo off
setlocal
cd /d "%~dp0"
title Mando PS4 para Minecraft Dungeons

set "PY=python"
where py >nul 2>nul && set "PY=py"
%PY% mando_ps4.py %*
pause
