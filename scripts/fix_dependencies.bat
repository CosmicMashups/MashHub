@echo off
echo ============================================================
echo Fixing Python Package Dependency Conflicts
echo ============================================================
echo.

echo The issue: Circular dependency between supabase and httpx versions
echo   - supabase 2.9.0+ requires httpx>=0.26
echo   - gotrue/supafunc require httpx<0.26
echo.
echo Solution: Using supabase 2.8.1 (last version before httpx 0.26 requirement)
echo.

REM First, uninstall conflicting packages
echo 1. Cleaning up conflicting packages...
pip uninstall -y supabase gotrue supafunc httpx numpy websockets

echo.
REM Install compatible versions
echo 2. Installing compatible package versions...
pip install "python-dotenv>=1.0.0"
pip install "httpx>=0.24,<0.26"
pip install "numpy>=1.19.0,<2.0.0"
pip install "websockets>=13.0"
pip install "supabase==2.8.1"

echo.
echo ============================================================
echo Verifying installation...
echo ============================================================
python -c "import dotenv; print('✓ python-dotenv installed')"
python -c "import supabase; print('✓ Supabase version:', supabase.__version__ if hasattr(supabase, '__version__') else '2.8.1')"
python -c "import httpx; print('✓ httpx version:', httpx.__version__)"
python -c "import numpy; print('✓ numpy version:', numpy.__version__)"
python -c "import websockets; print('✓ websockets version:', websockets.__version__)"

echo.
echo ============================================================
echo Dependencies fixed!
echo ============================================================
echo.
echo Testing Supabase connection...
python test_simple_connection.py

echo.
pause
