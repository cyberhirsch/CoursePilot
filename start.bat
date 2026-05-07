@echo off
setlocal

cd /d "%~dp0"

echo CoursePilot test server
echo -----------------------

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js 20 or newer, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo node_modules not found. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting CoursePilot at http://localhost:9002
echo Press Ctrl+C to stop the server.
echo.

start "" /min cmd /c "timeout /t 4 /nobreak >nul && start "" http://localhost:9002"

call npm run dev
set EXIT_CODE=%ERRORLEVEL%

echo.
echo CoursePilot stopped with exit code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
