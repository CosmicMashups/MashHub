@echo off
echo ============================================================
echo Python Virtual Environment Setup
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if venv already exists
if exist "venv\" (
    echo Virtual environment already exists.
    echo.
    goto :activate
) else (
    echo Creating new virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created!
    echo.
)

:activate
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo ============================================================
echo Virtual environment is now active!
echo ============================================================
echo.
echo Installing/upgrading dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Your virtual environment is ready. You should see (venv) in your prompt.
echo.
echo Next steps:
echo   1. Test connection: python test_simple_connection.py
echo   2. Run upsert: python src\assets\upsert.py
echo.
echo To deactivate when done: deactivate
echo.
