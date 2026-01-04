#!/bin/bash

set -e  # 遇到错误立即退出

echo "=== 开始构建过程 ==="

# 保存原始工作目录
ORIGINAL_DIR="$(pwd)"

# 安装.NET到临时目录，然后创建符号链接到/usr/lib/dotnet
echo "=== 安装.NET运行时 ==="
DOTNET_INSTALL_DIR="/tmp/dotnet"

if [ ! -d "$DOTNET_INSTALL_DIR" ]; then
    echo "安装.NET到$DOTNET_INSTALL_DIR..."
    # 下载并安装.NET
    curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0 --install-dir "$DOTNET_INSTALL_DIR"
else
    echo ".NET已安装在$DOTNET_INSTALL_DIR"
fi

# 创建符号链接到/usr/lib/dotnet（如果不存在）
if [ ! -d "/usr/lib/dotnet" ]; then
    echo "创建符号链接 /usr/lib/dotnet -> $DOTNET_INSTALL_DIR"
    sudo ln -sf "$DOTNET_INSTALL_DIR" /usr/lib/dotnet 2>/dev/null || {
        echo "警告: 无法创建符号链接到/usr/lib/dotnet，尝试替代方案"
        # 如果无法创建符号链接，设置DOTNET_ROOT环境变量
        export DOTNET_ROOT="$DOTNET_INSTALL_DIR"
    }
else
    echo "/usr/lib/dotnet已存在"
fi

# 设置环境变量
export DOTNET_ROOT="${DOTNET_ROOT:-/usr/lib/dotnet}"
export PATH="$DOTNET_INSTALL_DIR:$PATH"

echo "=== .NET版本 ==="
dotnet --version

# 生成版本信息
echo "=== 生成版本信息 ==="
node scripts/generate-version.js

# 创建临时构建目录
TEMP_BUILD_DIR="/tmp/astracup-build"
echo "=== 创建临时构建目录: $TEMP_BUILD_DIR ==="
mkdir -p "$TEMP_BUILD_DIR"

# 复制OsuNodeHelper到临时目录
echo "=== 复制OsuNodeHelper到临时目录 ==="
if [ ! -d "OsuNodeHelper" ]; then
    echo "错误: OsuNodeHelper目录不存在"
    exit 1
fi
cp -r OsuNodeHelper "$TEMP_BUILD_DIR/"

# 从GitHub获取osu-tools
echo "=== 从GitHub获取osu-tools ==="
cd "$TEMP_BUILD_DIR"
if [ ! -d "osu-tools" ]; then
    echo "克隆osu-tools仓库..."
    git clone --depth 1 https://github.com/ppy/osu-tools.git
else
    echo "osu-tools目录已存在，跳过克隆"
fi

# 检查是否克隆成功
if [ ! -d "osu-tools" ]; then
    echo "错误: 无法获取osu-tools仓库"
    exit 1
fi

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
