@echo off
echo Starting Douyin AI Translator locally...

echo Cleaning up old processes...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr "0.0.0.0:3001"') DO (
    TaskKill /PID %%T /F 2>nul
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr "0.0.0.0:5173"') DO (
    TaskKill /PID %%T /F 2>nul
)

:: Start Backend
echo Starting Backend Server on port 3001...
start "Backend API" cmd /k "cd server && npm run dev"

:: Start Frontend
echo Starting Frontend Client...
start "Frontend Vite" cmd /k "npm run dev"

echo.
echo Both servers are starting in new windows!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
pause
