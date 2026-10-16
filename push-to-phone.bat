@echo off
echo Connecting to Android device via USB...
set ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe

if not exist "%ADB%" (
    set ADB=adb
)

echo Forwarding Vite (5173) and FastAPI (8000) over USB...
"%ADB%" reverse tcp:5173 tcp:5173
"%ADB%" reverse tcp:8000 tcp:8000

echo Opening VIP Platform on your phone...
"%ADB%" shell am start -a android.intent.action.VIEW -d "http://localhost:5173"

echo Done! The app is now running on your phone.
pause
