@echo off
title Launching Viral Print Software & Backend Server
echo Starting Backend Server on port 5000...
start /b cmd /c "cd /d "%~dp0server" && npm run dev"
echo Starting Desktop Client Application...
cd /d "%~dp0client"
npm run dev
