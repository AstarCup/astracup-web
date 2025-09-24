const fs = require('fs');
const path = require('path');

// 生成版本信息
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const version = `${year}${month}${day}-${hours}${minutes}`;

// 写入版本文件
const versionFile = path.join(process.cwd(), 'public', 'version.json');
fs.writeFileSync(versionFile, JSON.stringify({ version }, null, 2));

console.log(`Version generated: ${version}`);