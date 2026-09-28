@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul || (echo Python was not found. Install Python 3.10 or newer, then try again.& pause & exit /b 1)
where node >nul 2>nul || (echo Node.js was not found. Install Node.js, then try again.& pause & exit /b 1)
if not exist ".venv/Scripts/python.exe" (
  echo Preparing the Python part of Little List...
  python -m venv .venv || (echo Could not create the Python environment.& pause & exit /b 1)
)
echo Checking Python packages...
".venv/Scripts/python.exe" -m pip install -r requirements.txt || (echo Could not install Python packages. Check your internet connection and try again.& pause & exit /b 1)
if not exist "frontend/node_modules" (
  echo Preparing the website (this may take a few minutes the first time)...
  pushd frontend
  call npm install --cache .npm-cache
  if errorlevel 1 (popd& echo Could not install website packages. Check your internet connection and try again.& pause & exit /b 1)
  popd
)
start "Little List - API" cmd /k "cd /d "%~dp0" && .venv/Scripts/python.exe -m uvicorn backend.main:app --reload"
start "Little List - Website" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173
echo Little List is open in your browser. Keep this window open while you use it.
pause
