@echo off
setlocal EnableDelayedExpansion
set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:~0,-1%"
set "REPO_ROOT=%APP_DIR%\.."

echo [1/6] Staging and committing changes...
cd /d "%REPO_ROOT%"
git add -A
git diff --cached --quiet 2>nul && (
  echo No changes to commit. Skipping commit.
) || (
  git commit -m "Build, push, deploy: %date% %time:~0,5%"
  if errorlevel 1 ( echo Commit failed. & exit /b 1 )
)

echo.
echo [2/6] Pulling and pushing main...
git pull --rebase origin main
if errorlevel 1 ( echo Pull/rebase failed. & exit /b 1 )
git push origin main
if errorlevel 1 ( echo Push failed. & exit /b 1 )

echo.
echo [3/6] Building app...
cd /d "%APP_DIR%"
call npm run build
if errorlevel 1 ( echo Build failed. & exit /b 1 )

echo.
echo [4/6] Preparing gh-pages branch...
cd /d "%REPO_ROOT%"
git checkout --orphan gh-pages-temp
if errorlevel 1 ( echo Checkout orphan failed. & exit /b 1 )
git rm -rf --cached . 2>nul

xcopy /E /Y /I "%APP_DIR%\dist\*" "%REPO_ROOT%\" >nul
if errorlevel 1 ( echo Copy dist failed. & git checkout -f main & exit /b 1 )

git add .
git rm -rf --cached mashhub\ 2>nul

echo.
echo [5/6] Committing and pushing gh-pages...
git commit -m "Deploy to GitHub Pages"
if errorlevel 1 ( echo Deploy commit failed. & git checkout -f main & exit /b 1 )

git branch -D gh-pages 2>nul
git branch -m gh-pages
git push origin gh-pages --force
if errorlevel 1 ( echo Push gh-pages failed. & git checkout -f main & exit /b 1 )

echo.
echo [6/6] Switching back to main...
git checkout -f main 2>nul
if errorlevel 1 git checkout main

echo.
echo Done. Main pushed; GitHub Pages updated.
