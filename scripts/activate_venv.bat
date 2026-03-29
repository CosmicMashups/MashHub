@echo off
REM Quick activate script
cd /d "%~dp0"

if not exist "venv\" (
    echo Virtual environment not found!
    echo Run setup_venv.bat first to create it.
    pause
    exit /b
)

call venv\Scripts\activate.bat
echo.
echo Virtual environment activated!
echo Run 'deactivate' when done.
echo.
cmd /k
