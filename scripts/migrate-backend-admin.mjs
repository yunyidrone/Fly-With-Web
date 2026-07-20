import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const sourceRoot =
  process.env.BACKEND_SOURCE_ROOT ||
  "D:/Documents/xingmu/accompaning-fly-backend/src";
const targetRoot = path.resolve(
  process.cwd(),
  "src/backend-admin",
);

const textExts = new Set([".js", ".vue", ".scss", ".css", ".json", ".md"]);

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function rewriteText(content) {
  return content.replaceAll("@/", "@backend/");
}

async function ensureSourceExists() {
  await fs.access(sourceRoot);
}

async function migrate() {
  await ensureSourceExists();
  await fs.rm(targetRoot, { recursive: true, force: true });
  await fs.mkdir(targetRoot, { recursive: true });

  const files = await walk(sourceRoot);
  let copied = 0;
  let rewritten = 0;

  for (const srcFile of files) {
    const relative = path.relative(sourceRoot, srcFile);
    const destFile = path.join(targetRoot, relative);
    const destDir = path.dirname(destFile);
    await fs.mkdir(destDir, { recursive: true });

    const ext = path.extname(srcFile).toLowerCase();
    if (textExts.has(ext)) {
      const raw = await fs.readFile(srcFile, "utf8");
      const transformed = rewriteText(raw);
      await fs.writeFile(destFile, transformed, "utf8");
      rewritten += 1;
    } else {
      await fs.copyFile(srcFile, destFile);
      copied += 1;
    }
  }

  console.log(`Backend migration completed.`);
  console.log(`Source: ${sourceRoot}`);
  console.log(`Target: ${targetRoot}`);
  console.log(`Rewritten text files: ${rewritten}`);
  console.log(`Copied binary files: ${copied}`);
}

migrate().catch((error) => {
  console.error("Backend migration failed:", error);
  process.exitCode = 1;
});
