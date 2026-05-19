# Start Backend Server

Clear-Host
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  STARTING BACKEND SERVER" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pipeline: Rule + OpenAI + API Fusion" -ForegroundColor White
Write-Host "No local ML model loaded" -ForegroundColor White
Write-Host ""

# Stop any existing Python servers
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app.py*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Change to backend directory
Set-Location "c:\Users\prave\Desktop\fake new\backend"

# Activate virtual environment and run
.\venv310\Scripts\python.exe app.py
