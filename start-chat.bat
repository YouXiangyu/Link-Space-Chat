@echo off
REM Set console to UTF-8 to prevent garbled characters
chcp 65001 > nul

setlocal

REM --- Configuration ---
REM Arg 1: "ngrok" to enable ngrok, or a port number (default 3000)
REM Arg 2: Port number (only used when Arg 1 is "ngrok")
set "ARG1=%1"
set "ARG2=%2"

REM --- Check if dependencies are installed ---
if not exist "node_modules\" (
    echo.
    echo =================================================================
    echo Dependencies not found. Installing dependencies...
    echo =================================================================
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies. Please check your Node.js installation.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

REM --- Execution ---
echo.
echo Starting server...
if "%ARG1%"=="ngrok" (
    echo Ngrok is ENABLED. A public URL will be generated.
    if defined ARG2 (
        echo Using port: %ARG2%
    ) else (
        echo Using default port: 3000
    )
    echo.
    echo =================================================================
    echo To STOP the server, press CTRL+C in this window.
    echo =================================================================
    echo.
    if defined ARG2 (
        node server.js ngrok %ARG2%
    ) else (
        node server.js ngrok
    )
) else (
    echo Ngrok is DISABLED.
    if defined ARG1 (
        echo Using port: %ARG1%
    ) else (
        echo Using default port: 3000
    )
    echo.
    echo =================================================================
    echo To STOP the server, press CTRL+C in this window.
    echo =================================================================
    echo.
    if defined ARG1 (
        node server.js %ARG1%
    ) else (
        node server.js
    )
)

endlocal