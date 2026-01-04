#!/bin/bash

# 安装.NET（如果尚未安装）
if ! command -v dotnet &> /dev/null; then
    echo "Installing .NET..."
    curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0 --install-dir /tmp/dotnet
    export PATH="/tmp/dotnet:$PATH"
fi

# 生成版本信息
node scripts/generate-version.js

# 编译PerformanceCalculator项目
dotnet publish osu-tools/PerformanceCalculator/PerformanceCalculator.csproj -c Release -r linux-x64 --self-contained false

# 编译OsuNodeHelper项目
dotnet publish OsuNodeHelper/OsuNodeHelper.csproj -c Release -r linux-x64 --self-contained false

# 复制DLL到public目录
cp OsuNodeHelper/bin/Release/net8.0/linux-x64/publish/OsuNodeHelper.dll public/

# 构建Next.js应用
next build --turbopack
