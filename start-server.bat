@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages...
  call npm install
)
echo.
echo Open http://localhost:4000 in your browser
npm start
pause
