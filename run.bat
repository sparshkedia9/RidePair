@echo off
REM RidePair - one-click launcher (production mode: backend serves the built React app)
cd /d "%~dp0"

echo Starting RidePair on http://127.0.0.1:8000 ...
echo Press Ctrl+C in this window to stop.
echo.

start "" http://127.0.0.1:8000
python -m uvicorn backend.main:app --port 8000

pause
