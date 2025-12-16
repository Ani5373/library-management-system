@echo off
chcp 65001 >nul
cls
echo ========================================
echo 图书馆管理系统 - 启动脚本
echo Library Management System
echo ========================================
echo.

cd frontend

echo 正在-检查依赖...
echo Checking dependencies...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    echo First run, installing dependencies...
    call npm install
)

echo.
echo 正在启动开发服务器...
echo Starting development server...
echo.
echo 访问地址 / Access URL: http://localhost:5173
echo 默认账户 / Default Account: admin / admin123
echo.
echo 按 Ctrl+C 停止服务器 / Press Ctrl+C to stop
echo ========================================
echo.

call npm run dev

pause
