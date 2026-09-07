@echo off
chcp 65001 >nul
title NakliyeWeb - DİZA Lojistik & Filo ERP v2.7.0 - Gördit Bilgisayar

echo ===================================================
echo   NakliyeWeb - DİZA Lojistik & Filo ERP v2.7.0
echo   Gördit Bilgisayar — Zafer GÖRGÜN
echo ===================================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [BILGI] Paketler yukleniyor...
    call npm.cmd install
)

echo [OK] Web Sunucusu Başlatılıyor: http://localhost:5175
start http://localhost:5175
call npm.cmd run dev -- --host --port 5175

pause
