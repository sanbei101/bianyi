#!/bin/bash
set -e

echo "=== 编译原理 AI 助学系统 ==="

if ! command -v pnpm &> /dev/null; then
    echo "未找到 pnpm 正在安装..."
    npm install -g pnpm
fi

if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install
fi

echo "启动开发服务器..."
pnpm dev
