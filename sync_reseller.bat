@echo off
setlocal enabledelayedexpansion

:: Repository directory (Reseller project)
set "REPO_DIR=D:\AI Reseller Automation Suite\Reseller"

:: Ensure the directory exists
if not exist "%REPO_DIR%" (
    echo Creating repository directory %REPO_DIR%
    mkdir "%REPO_DIR%"
)

cd /d "%REPO_DIR%" || (
    echo Failed to change to repository directory.
    exit /b 1
)

:: If not a git repository, clone it
if not exist ".git" (
    echo Cloning repository from GitHub...
    git clone https://github.com/alumnisteman/Reseller.git .
    if errorlevel 1 (
        echo Clone failed.
        exit /b 1
    )
) else (
    :: Ensure remote URL is correct
    git remote set-url origin https://github.com/alumnisteman/Reseller.git
)

:: Pull latest changes
git pull origin main
if errorlevel 1 (
    echo Pull failed.
    exit /b 1
)

:: Stage all changes
git add -A

:: Check for changes to commit
git diff --cached --quiet
if errorlevel 0 (
    echo No changes to commit.
) else (
    :: Create timestamp
    for /f "tokens=1-5 delims=/: " %%a in ("%date% %time%") do set "ts=%%a-%%b-%%c_%%d-%%e-%%f"
    git commit -m "Sync: !ts!"
    if errorlevel 1 (
        echo Commit failed.
        exit /b 1
    )
    git push origin main
    if errorlevel 1 (
        echo Push failed.
        exit /b 1
    )
)

echo Synchronization complete.
endlocal
