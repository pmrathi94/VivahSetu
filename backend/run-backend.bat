@echo off
cd /d H:\VivahSetuApp\VivahSetu\backend
echo Starting Vivah Setu Backend...
echo.
echo 🚀 Backend Server Information:
echo    Port: 4000
echo    API: http://localhost:4000/api/v1
echo    Supabase: Configured
echo    Environment: development
echo.
echo Backend is starting, please wait...
echo.
node dist/index.js
