@echo off
echo ========================================
echo   AstraMentor Development Servers
echo ========================================
echo.

echo Starting Backend Server (Port 8001)...
start "AstraMentor Backend" cmd /k "cd astramentor-backend && venv\Scripts\python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server (Port 3000)...
start "AstraMentor Frontend" cmd /k "cd astramentor-frontend && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend API:  http://127.0.0.1:8001
echo API Docs:     http://127.0.0.1:8001/docs
echo Frontend:     http://localhost:3000
echo.
echo Press any key to open the application in your browser...
pause > nul

start http://localhost:3000

echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
