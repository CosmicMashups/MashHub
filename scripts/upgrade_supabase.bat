@echo off
echo ============================================================
echo Upgrading Supabase Python Library
echo ============================================================
echo.

echo Current version: 2.3.0
echo Upgrading to latest version...
echo.

python -m pip install --upgrade supabase

echo.
echo ============================================================
echo Checking new version...
echo ============================================================
python -c "import supabase; print('New version:', supabase.__version__ if hasattr(supabase, '__version__') else 'Unknown')"

echo.
echo ============================================================
echo Now run: python test_simple_connection.py
echo ============================================================
pause
