@echo off
cd /d "d:\GitREPOS\MINI_PRj\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
