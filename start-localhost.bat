@echo off
title BrokerSaab Localhost Launcher
color 0B
cls

echo =======================================================================
echo              BrokerSaab Localhost Launcher
echo =======================================================================
echo.
echo  This script will automatically start the BrokerSaab frontend and
echo  backend development servers concurrently.
echo.
echo  Requirements:
echo   - Node.js (v18+)
echo   - PostgreSQL database running at localhost:5412
echo.
echo =======================================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js is verified.
echo [INFO] Installing package dependencies (if missing)...
call npm install

echo.
echo [INFO] Launching development servers...
echo -----------------------------------------------------------------------
echo  - Frontend Dev Server: http://localhost:3000
echo  - Backend REST API   : http://localhost:5000/api/v1
echo -----------------------------------------------------------------------
echo.
echo Keep this window open while developing. Press Ctrl+C to stop.
echo.

:: Run concurrently backend and frontend dev scripts
npx concurrently --kill-others "npm run backend:dev" "npm run frontend:dev"

pause
