@echo off
setlocal EnableDelayedExpansion
REM Deploy: build, push main, deploy dist to gh-pages.
REM GitHub Pages: repo Settings > Pages > Source = branch "gh-pages", folder / (root).
REM App URL: https://<owner>.github.io/MashHub/

set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"
for /f "delims=" %%I in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%I"
if not defined REPO_ROOT ( echo Not a git repo. & exit /b 1 )
set "REPO_ROOT=%REPO_ROOT:\=/%"
set "REPO_ROOT=%REPO_ROOT:/=\%"

echo [1/7] Building app...
cd /d "%APP_DIR%"
call npm run build
if errorlevel 1 ( echo Build failed. & exit /b 1 )

echo.
echo [2/7] Switching to main...
cd /d "%REPO_ROOT%"
git checkout main
if errorlevel 1 ( echo Checkout main failed. Do you have a main branch? & exit /b 1 )
git pull origin main
if errorlevel 1 ( echo Pull failed. & exit /b 1 )

echo.
echo [3/7] Staging and committing changes...
cd /d "%REPO_ROOT%"
git add -A
git diff --cached --quiet 2>nul && (
  echo No changes to commit. Skipping commit.
) || (
  git commit -m "Build, push, deploy: %date% %time:~0,5%"
  if errorlevel 1 ( echo Commit failed. & exit /b 1 )
)

echo.
echo [4/7] Pulling and pushing main...
git pull --rebase origin main
if errorlevel 1 ( echo Pull/rebase failed. & exit /b 1 )
git push origin main
if errorlevel 1 ( echo Push failed. & exit /b 1 )

echo.
echo [5/7] Preparing gh-pages branch...
cd /d "%REPO_ROOT%"
git checkout --orphan gh-pages-temp
if errorlevel 1 ( echo Checkout orphan failed. & exit /b 1 )
git rm -rf --cached . 2>nul

xcopy /E /Y /I "%APP_DIR%\dist\*" "%REPO_ROOT%\" >nul
if errorlevel 1 ( echo Copy dist failed. & git checkout -f main & exit /b 1 )

git add index.html assets
if exist "%REPO_ROOT%\vite.svg" git add vite.svg
if exist "%REPO_ROOT%\CNAME" git add CNAME
if exist "%REPO_ROOT%\sw.js" git add sw.js
if exist "%REPO_ROOT%\registerSW.js" git add registerSW.js
if exist "%REPO_ROOT%\manifest.webmanifest" git add manifest.webmanifest
for %%f in (workbox-*.js) do if exist "%%f" git add "%%f"
if exist "%REPO_ROOT%\anime.csv" git add anime.csv
if exist "%REPO_ROOT%\index.html.gz" git add index.html.gz
if exist "%REPO_ROOT%\index.html.br" git add index.html.br
git rm -rf --cached mashhub\ 2>nul

echo.
echo [6/7] Committing and pushing gh-pages...
git commit -m "Deploy to GitHub Pages"
if errorlevel 1 ( echo Deploy commit failed. & git checkout -f main & exit /b 1 )

git branch -D gh-pages 2>nul
git branch -m gh-pages
git push origin gh-pages --force
if errorlevel 1 ( echo Push gh-pages failed. & git checkout -f main & exit /b 1 )

echo.
echo [7/7] Switching back to main...
git checkout -f main 2>nul
if errorlevel 1 git checkout main

echo.
echo Done. Main pushed; GitHub Pages updated.
