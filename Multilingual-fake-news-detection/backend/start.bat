@echo off
REM Simple Backend Startup Script

cd /d "%~dp0"
set NEWSAPI_KEY=8925bb69af6f474ca52a00388fb0b860
.\venv310\Scripts\python.exe app.py
