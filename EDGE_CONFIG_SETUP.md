# Vercel Edge Config 配置指南

## 1. 在Vercel项目中设置Edge Config

1. 登录到您的Vercel仪表板
2. 选择您的项目
3. 转到 "Settings" -> "Edge Config"
4. 创建一个新的Edge Config或使用现有的
5. 复制连接字符串

## 2. 配置环境变量

在Vercel项目设置中，添加以下环境变量：

```
EDGE_CONFIG=您的Edge Config连接字符串
```

连接字符串格式通常类似于：
- `https://edge-config.vercel.com/ecfg_xxx?token=xxx`
- `edge-config:id=ecfg_xxx&token=xxx`

## 3. 在Edge Config中设置rank配置

使用Vercel CLI或Web界面在Edge Config中添加以下JSON配置：

```json
{
  "rankConfig": {
    "maxPpForRegistration": 7000,
    "minPpForRegistration": 0,
    "rankRestrictionEnabled": true
  }
}
```

## 4. 本地开发配置

对于本地开发，系统会自动使用默认配置。如果您想在本地测试Edge Config，可以在 `.env.local` 中添加：

```
EDGE_CONFIG=您的Edge Config连接字符串
```

## 5. 配置说明

- `maxPpForRegistration`: 最大允许报名的PP值（默认：7000）
- `minPpForRegistration`: 最小允许报名的PP值（默认：0）
- `rankRestrictionEnabled`: 是否启用PP限制（默认：true）

## 6. 实时更新

修改Edge Config中的配置后，更改会立即生效，无需重新部署应用。
