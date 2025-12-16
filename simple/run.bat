@echo off
chcp 65001 >nul
cls
echo 正在启动图书馆管理系统...
echo.

REM 检查是否安装了 Flask
python -c "import flask" 2>nul
if errorlevel 1 (
    echo 正在安装依赖...
    pip install -r requirements.txt
    echo.
)

echo 启动 Flask 服务器...
echo 请在浏览器中访问: http://127.0.0.1:5000
echo.
echo 默认管理员账号: admin / admin123
echo.
python app.py
pause
