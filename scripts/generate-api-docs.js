const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "..", "src", "app", "api");
const OUTPUT = path.join(__dirname, "..", "API_DOCS.md");
const BASE_URL = "https://www.rino.ink";

function findRouteFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry.name === "route.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

function getRoutePath(filePath) {
  const rel = path.relative(API_DIR, filePath);
  const dir = path.dirname(rel);
  const segments = dir === "." ? [] : dir.split(path.sep).filter(Boolean);
  const clean = segments.map((s) => (s.startsWith("[") && s.endsWith("]") ? `:${s.slice(1, -1)}` : s));
  return "/api/" + clean.join("/");
}

function extractMethods(content) {
  const methods = [];
  const re = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    methods.push(match[1]);
  }
  return methods;
}

function extractQueryParams(content) {
  const params = [];
  const re = /searchParams\.get\(\s*["'](\w+)["']\s*\)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    if (!params.includes(match[1])) params.push(match[1]);
  }
  return params;
}

function extractBodyFields(content) {
  const fields = [];
  const blockRe = /await\s+request\.json\(\)\s*;?\s*(?:const|let)\s*\{([^}]+)\}\s*=/gs;
  let match;
  while ((match = blockRe.exec(content)) !== null) {
    const raw = match[1];
    const parts = raw.split(",");
    for (const part of parts) {
      const name = part.trim().split(":")[0].split("=")[0].trim();
      if (name && !fields.includes(name)) fields.push(name);
    }
  }
  return fields;
}

function extractAuth(content) {
  if (
    content.includes("verifyAdminAuth") ||
    content.includes('permissions.isadmin')
  ) return "Admin";
  if (
    content.includes("verifyMapSelectionAuth") ||
    content.includes("verifyReplayAuth") ||
    content.includes("parseSessionFromRequest") ||
    content.includes("getUserPermissions") ||
    content.includes('astra_session') ||
    content.includes('sessionCookie')
  ) return "Auth";
  return "None";
}

function extractDescription(content) {
  const lines = content.split("\n");
  for (const line of lines.slice(0, 10)) {
    const match = line.match(/\/\/\s*[-–—]?\s*(.+)/);
    if (match && match[1].length > 5) return match[1].trim();
  }
  for (const line of lines) {
    const match = line.match(/\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s*[-–—]\s*(.+)/);
    if (match) return `${match[1]} — ${match[2].trim()}`;
  }
  return "";
}

function generate() {
  const files = findRouteFiles(API_DIR).sort();

  let md = `# AstaraCup API 文档

> 自动生成于 ${new Date().toISOString().slice(0, 16).replace("T", " ")}
> 共 ${files.length} 个接口

## 接口列表

`;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const routePath = getRoutePath(file);
    const methods = extractMethods(content);
    const queryParams = extractQueryParams(content);
    const bodyFields = extractBodyFields(content);
    const auth = extractAuth(content);
    const desc = extractDescription(content);

    if (methods.length === 0) continue;

    md += `### \`${methods.join(" | ")}\` ${routePath}\n\n`;
    if (desc) md += `> ${desc}\n\n`;

    md += `| 属性 | 值 |\n`;
    md += `|------|----|\n`;
    md += `| 鉴权 | ${auth} |\n`;

    if (queryParams.length) {
      md += `| Query | ${queryParams.join(", ")} |\n`;
    }
    if (bodyFields.length) {
      md += `| Body | ${bodyFields.join(", ")} |\n`;
    }

    const exampleUrl = `${BASE_URL}${routePath}`;
    md += `| 示例 | ${exampleUrl} |\n`;

    md += `\n---\n\n`;
  }

  fs.writeFileSync(OUTPUT, md, "utf-8");
  console.log(`Generated API docs → ${OUTPUT} (${files.length} routes)`);
}

generate();
