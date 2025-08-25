@echo off
echo 🚀 Deploying Firebase Storage rules...

REM Deploy only storage rules
firebase deploy --only storage

if %ERRORLEVEL% EQU 0 (
    echo ✅ Firebase Storage rules deployed successfully!
    echo 🔧 Storage uploads should now work properly.
) else (
    echo ❌ Failed to deploy Firebase Storage rules.
    echo 📝 Please run 'firebase deploy --only storage' manually.
)

pause