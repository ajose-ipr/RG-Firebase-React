@echo off
title MERN Project Starter
echo Starting MongoDB with authentication...

REM Step 1: Start mongod
start "MongoDB" cmd /k "mongod --auth --dbpath=\"C:\data\db\""

REM Small delay to ensure mongod starts
timeout /t 3 > nul

REM Step 2: Start mongosh login
start "Mongo Shell" cmd /k "mongosh -u root -p rOoT@246 --authenticationDatabase admin"

REM Step 3: Start backend (server)
echo Starting backend server...
start "Backend" cmd /k "cd server && npm start"

REM Step 4: Start frontend (client)
echo Starting frontend client...
start "Frontend" cmd /k "cd client && npm start"

echo All services launched in separate terminals.
pause
