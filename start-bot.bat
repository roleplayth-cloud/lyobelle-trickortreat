@echo off
title Trick or Treat Bot
echo ==========================================
echo   🎃 กำลังเปิดบอท Trick or Treat Discord Bot...
echo ==========================================
echo.

:: เปิดใช้ environment จาก .env (ต้องมีไฟล์ .env อยู่ในโฟลเดอร์เดียวกัน)
echo กำลังโหลด environment...
timeout /t 1 >nul

:: เริ่มรันบอท
node index.js

:: ถ้าบอทปิด ให้ pause ไว้ไม่ให้หน้าต่างหาย
echo.
echo ❌ บอทหยุดทำงานแล้ว
pause
