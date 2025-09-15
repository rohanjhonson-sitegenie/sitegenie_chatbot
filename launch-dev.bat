@echo off
echo Starting Chrome with disabled web security for development...
echo WARNING: This is only for development purposes!
echo.

REM Try to find Chrome in common locations
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else (
    echo Chrome not found in default locations. Please install Google Chrome or update the path in this script.
    pause
    exit /b 1
)

REM Create temp directory for user data
set TEMP_DIR=%TEMP%\chrome_dev_session
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

echo Launching Chrome with disabled web security...
echo You can now access your app at http://localhost:3000
echo.

%CHROME_PATH% --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir="%TEMP_DIR%" --new-window http://localhost:3000

echo Chrome closed. Development session ended.
pause