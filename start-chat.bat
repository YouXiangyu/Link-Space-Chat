@echo off
REM Set console to UTF-8 to prevent garbled characters
chcp 65001 > nul

setlocal

REM --- Configuration ---
REM Arg 1: Port (default 3000)
REM Arg 2: Any value to enable ngrok (e.g., "ngrok-on")
set "CLI_PORT=%1"
set "NGROK_FLAG=%2"

REM Set ENABLE_NGROK environment variable if the second argument exists
if defined NGROK_FLAG (
    set "ENABLE_NGROK=true"
)

REM --- Execution ---
echo.
echo Starting server...
if defined ENABLE_NGROK (
    echo Ngrok is ENABLED. A public URL will be generated.
) else (
    echo Ngrok is DISABLED.
)
echo.
echo =================================================================
echo To STOP the server, press CTRL+C in this window.
echo =================================================================
echo.

REM Run the server in the current window, passing the port argument
node server.js %CLI_PORT%

endlocal