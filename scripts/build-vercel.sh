#!/bin/bash

set -e  # 遇到错误立即退出

echo "=== 开始构建过程 ==="

# 保存原始工作目录
ORIGINAL_DIR="$(pwd)"

# 安装.NET（如果尚未安装）
if ! command -v dotnet &> /dev/null; then
    echo "Installing .NET..."
    curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0 --install-dir /tmp/dotnet
    export PATH="/tmp/dotnet:$PATH"
fi

echo "=== .NET版本 ==="
dotnet --version

# 生成版本信息
echo "=== 生成版本信息 ==="
node scripts/generate-version.js

# 创建临时构建目录
TEMP_BUILD_DIR="/tmp/astracup-build"
echo "=== 创建临时构建目录: $TEMP_BUILD_DIR ==="
mkdir -p "$TEMP_BUILD_DIR"

# 复制项目文件到临时目录
echo "=== 复制项目文件到临时目录 ==="
cp -r osu-tools "$TEMP_BUILD_DIR/"
cp -r OsuNodeHelper "$TEMP_BUILD_DIR/"

# 在临时目录中编译PerformanceCalculator项目
echo "=== 编译PerformanceCalculator项目 ==="
cd "$TEMP_BUILD_DIR/osu-tools/PerformanceCalculator"
dotnet publish PerformanceCalculator.csproj -c Release -r linux-x64 --self-contained false

# 在临时目录中编译OsuNodeHelper项目
echo "=== 编译OsuNodeHelper项目 ==="
cd "$TEMP_BUILD_DIR/OsuNodeHelper"
dotnet publish OsuNodeHelper.csproj -c Release -r linux-x64 --self-contained false

# 返回项目根目录
cd "$ORIGINAL_DIR"

# 检查OsuNodeHelper DLL是否生成
echo "=== 检查OsuNodeHelper DLL ==="
OSU_DLL_PATH="$TEMP_BUILD_DIR/OsuNodeHelper/bin/Release/net8.0/linux-x64/publish/OsuNodeHelper.dll"
if [ ! -f "$OSU_DLL_PATH" ]; then
    echo "错误: OsuNodeHelper.dll 未生成"
    echo "预期路径: $OSU_DLL_PATH"
    exit 1
fi

# 复制DLL到public目录
echo "=== 复制DLL到public目录 ==="
cp "$OSU_DLL_PATH" public/

# 构建Next.js应用
echo "=== 构建Next.js应用 ==="
next build --turbopack

echo "=== 构建完成 ==="
