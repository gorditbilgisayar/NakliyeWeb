@echo off
chcp 65001 >nul
title NakliyeWeb - Web Yayını Hazırlayıcı (Gördit Bilgisayar)
color 0b

echo ========================================================
echo   NAKLIYEWEB - WEB YAYINI HAZIRLANIYOR
echo   Gördit Bilgisayar — Zafer GÖRGÜN
echo ========================================================
echo.

echo [1/3] Üretim derlemesi (Build) alınıyor...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo [HATA] Derleme basarisiz oldu!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Web dosyalari klasore ve arsive kopyalaniyor...
powershell -NoProfile -Command "Copy-Item -Path 'dist\*' -Destination 'site_yayini_dist' -Recurse -Force; Compress-Archive -Path 'dist\*' -DestinationPath 'site_yayini_dist.zip' -Force; Compress-Archive -Path 'dist\*' -DestinationPath ([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'NakliyeWeb_Web_Yayini_Guncel.zip')) -Force"

echo.
echo ========================================================
echo   [BASARILI] Web yayin dosyalari hazirlandi!
echo   1. Proje icinde: site_yayini_dist.zip
echo   2. Masaustunde:  NakliyeWeb_Web_Yayini_Guncel.zip
echo   Hosting paneline (cPanel, Plesk, FTP) yukleyebilirsiniz.
echo ========================================================
echo.
pause
