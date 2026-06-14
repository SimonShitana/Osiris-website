@echo off
title Osiris Local Server
cd /d "%~dp0"

echo.
echo  Osiris — starting local server on http://localhost:5500
echo  Open that URL in your browser (do NOT double-click index.html).
echo  Press Ctrl+C to stop.
echo.

where python >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Using Python...
    python -m http.server 5500
    goto :end
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Using Python (py launcher)...
    py -m http.server 5500
    goto :end
)

where npx >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Using npx serve...
    npx --yes serve -l 5500
    goto :end
)

echo ERROR: Install Python from https://python.org or fix npm network, then run this again.
pause

:end
