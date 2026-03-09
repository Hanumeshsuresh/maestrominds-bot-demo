@echo off
chcp 65001 >nul
title AI Chatbot Launcher

echo.
echo ╔══════════════════════════════════════════════╗
echo    OFFICE AI CHATBOT — AUTO-START SCRIPT
echo ╚══════════════════════════════════════════════╝
echo.

:: ─── CONFIGURATION ────────────────────────────────────────────────
:: STEP 1: Fill in your ngrok authtoken from:
::         https://dashboard.ngrok.com/get-started/your-authtoken
set NGROK_AUTH_TOKEN=3Ad1fs1GfKGBAvl7bZfUxseBMUo_23S6bwJ4taAGNnBPTsBC

:: STEP 2: Fill in your permanent ngrok domain from:
::         https://dashboard.ngrok.com/domains
::         Example: my-office-ai-bot.ngrok-free.app
set NGROK_DOMAIN=nonlicentious-catherin-unsituated.ngrok-free.dev

:: Server port (must match PORT in .env — default 3001)
set SERVER_PORT=3001

:: Path to project (auto-detected from this script's folder)
set PROJECT_DIR=%~dp0
:: ──────────────────────────────────────────────────────────────────

:: Validate configuration
if "%NGROK_AUTH_TOKEN%"=="YOUR_NGROK_AUTHTOKEN_HERE" (
    echo [ERROR] You must set your NGROK_AUTH_TOKEN in this file first!
    echo         Get it from: https://dashboard.ngrok.com/get-started/your-authtoken
    echo.
    pause
    exit /b 1
)

if "%NGROK_DOMAIN%"=="YOUR_STATIC_DOMAIN_HERE" (
    echo [ERROR] You must set your NGROK_DOMAIN in this file first!
    echo         Get it from: https://dashboard.ngrok.com/domains
    echo.
    pause
    exit /b 1
)

:: Kill any old instances
echo [1/4] Cleaning up old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ngrok.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Register ngrok authtoken
echo [2/4] Registering ngrok authtoken...
ngrok config add-authtoken %NGROK_AUTH_TOKEN% >nul 2>&1

:: Start the AI chatbot server in a new window
echo [3/4] Starting AI Bot Server on port %SERVER_PORT%...
start "AI Bot Server" cmd /k "title AI Bot Server && cd /d "%PROJECT_DIR%" && node server.js"

:: Wait for server to be ready
timeout /t 4 /nobreak >nul

:: Start ngrok tunnel with permanent domain
echo [4/4] Connecting ngrok tunnel to %NGROK_DOMAIN%...
start "ngrok Tunnel" cmd /k "title ngrok Tunnel && ngrok http --url=%NGROK_DOMAIN% %SERVER_PORT%"

:: Wait for tunnel to connect
timeout /t 3 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════╗
echo    AI BOT RUNNING SUCCESSFULLY!
echo.
echo    SERVER:  http://localhost:%SERVER_PORT%
echo.
echo    PUBLIC LINK (share this with anyone):
echo    https://%NGROK_DOMAIN%
echo ╚══════════════════════════════════════════════╝
echo.
echo  The link works on:
echo    Mobile phones / Tablets / Desktop browsers
echo  No login required. No installation needed.
echo.
echo  Press any key to open the public link in Chrome...
pause >nul

start chrome "https://%NGROK_DOMAIN%"
