const fs = require('fs');
const path = require('path');

// 生成版本信息
const now = new Date();

// 获取当前时区偏移量（分钟）
const timezoneOffset = now.getTimezoneOffset();

// 如果不是+8时区（+8时区偏移量为 -480 分钟），则转换为+8时区
let targetDate = now;
if (timezoneOffset !== -480) {
    // 转换为+8时区时间
    // 当前时间 + (当前时区偏移 - 目标时区偏移)
    const targetOffset = -480; // +8时区偏移量（分钟）
    const offsetDiff = timezoneOffset - targetOffset;
    targetDate = new Date(now.getTime() + (offsetDiff * 60 * 1000));
}

const year = targetDate.getFullYear();
const month = String(targetDate.getMonth() + 1).padStart(2, '0');
const day = String(targetDate.getDate()).padStart(2, '0');
const hours = String(targetDate.getHours()).padStart(2, '0');
const minutes = String(targetDate.getMinutes()).padStart(2, '0');

const version = `${year}${month}${day}-${hours}${minutes}`;

// 写入版本文件
const versionFile = path.join(process.cwd(), 'public', 'version.json');
fs.writeFileSync(versionFile, JSON.stringify({ version }, null, 2));

console.log(`Version generated: ${version}`);