@echo off
title MDXed Editor Server
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ====================================================
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo ====================================================
    pause
    exit /b 1
)

:: Check if node_modules folder exists, if not, run npm install
if not exist node_modules (
    echo ====================================================
    echo INFO: node_modules not found. Installing dependencies...
    echo ====================================================
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
)

:: Check and update blog content repo
if exist "src\content\blog\.git" (
    echo INFO: Updating blog content...
    git -C src/content/blog pull origin main
) else (
    echo INFO: Cloning blog content repo...
    git clone https://github.com/Nishat-Ahmad/mdexed-content.git src/content/blog
)

:: Start Vite dev server and open the browser automatically
echo ====================================================
echo Starting MDXed Server...
echo The editor will open in your default browser shortly.
echo Keep this window open while using the editor.
echo Press Ctrl+C in this window to stop the server.
echo ====================================================
call npm run dev -- --open
