@echo off
setlocal
chcp 65001 >nul

echo ================================================
echo   TERROKAND - Electron EXE Builder
echo ================================================
echo.
echo Rebuilding the current app and packaging it as a portable EXE...
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found in PATH.
    exit /b 1
)

call npm run build-current-portable
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed.
    exit /b 1
)

echo.
echo Build finished.
echo Output folder: %CD%\dist-exe
echo.
endlocal
