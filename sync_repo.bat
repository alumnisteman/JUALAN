@echo off
setlocal enabledelayedexpansion

:: Repository root directory
set "REPO_DIR=D:\AI Reseller Automation Suite"

cd /d "%REPO_DIR%" || (
    echo Failed to change to repository directory.
    exit /b 1
)

:: If .git folder is missing, clone the repository
if not exist ".git" (
    echo Repository not found, cloning from GitHub...
    git clone https://github.com/alumnisteman/Reseller.git .
    if errorlevel 1 (
        echo Clone failed.
        exit /b 1
    )
) else (
    :: Ensure remote origin is set correctly
    git remote set-url origin https://github.com/alumnisteman/Reseller.git
)

:: Pull latest changes
git pull origin main
if errorlevel 1 (
    echo Error pulling from remote. Exiting.
    exit /b 1
)

:: Stage all changes
git add -A

:: Check if there are any changes to commit
git diff --cached --quiet
if errorlevel 0 (
    echo No changes to commit.
) else (
    :: Commit with timestamp
    for /f "tokens=1-5 delims=/: " %%a in ("%date% %time%") do set ts=%%a-%%b-%%c_%%d-%%e-%%f
    git commit -m "Sync: !ts!"
    if errorlevel 1 (
        echo Commit failed. Exiting.
        exit /b 1
    )
    :: Push to remote
    git push origin main
    if errorlevel 1 (
        echo Push failed. Exiting.
        exit /b 1
    )
)

echo Synchronization complete.
endlocal
