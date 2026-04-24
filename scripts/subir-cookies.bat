@echo off
REM Sube el cookies.txt mas reciente de Descargas al servidor yt2mp3
setlocal enabledelayedexpansion

set DOWNLOADS=%USERPROFILE%\Downloads
set SERVER=claude@144.91.73.109
set SSH_KEY=%USERPROFILE%\.ssh\id_ed25519

REM Buscar el archivo de cookies mas reciente
set NEWEST=
for /f "delims=" %%f in ('dir /b /o-d "%DOWNLOADS%\www.youtube.com_cookies*.txt" 2^>nul') do (
    if not defined NEWEST set NEWEST=%%f
)

if not defined NEWEST (
    echo [ERROR] No se encontro ningun archivo www.youtube.com_cookies*.txt en %DOWNLOADS%
    echo Exporta primero las cookies con la extension "Get cookies.txt LOCALLY" en Chrome.
    pause
    exit /b 1
)

set FILE=%DOWNLOADS%\%NEWEST%
echo Subiendo: %FILE%
echo.

REM Subir al servidor
scp -i "%SSH_KEY%" "%FILE%" %SERVER%:~/youtube_cookies.txt
if errorlevel 1 (
    echo [ERROR] Fallo scp
    pause
    exit /b 1
)

REM Copiar al contenedor y recargar
ssh -i "%SSH_KEY%" %SERVER% "BACKEND=$(docker ps --format '{{.Names}}' | grep yt-backend); docker cp ~/youtube_cookies.txt $BACKEND:/app/downloads/.cookies_work.txt && docker cp ~/youtube_cookies.txt $BACKEND:/app/downloads/.cookies_original.txt 2>/dev/null; echo Cookies actualizadas en $BACKEND"

echo.
echo [OK] Listo. Prueba a descargar algo en https://yt2mp3.ktr3.es/
pause
