@echo off
rem Starts the local server (if not already running) and opens the app.
rem Double-click this file to launch Yasam Kocu.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (-not (Test-NetConnection -ComputerName localhost -Port 3457 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0serve.ps1','-Port','3457'; Start-Sleep -Seconds 1 }"

start "" http://localhost:3457/
