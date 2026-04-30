import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const styleRoots = [
  path.join(repoRoot, "apps", "host-h5", "src", "render", "theme", "styles"),
  path.join(repoRoot, "apps", "novel-h5", "src", "render", "theme", "styles"),
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function extractStyleLiteral(source) {
  const match = source.match(/export const \w+ = `([\s\S]*)`;\s*$/);
  return match?.[1];
}

function validateStyleModule(filePath, css) {
  const violations = [];
  const trimmed = css.trim();

  if (!trimmed) {
    return violations;
  }

  if (!/^(:|\.|#|@|\*|[a-zA-Z])/.test(trimmed)) {
    violations.push("style module must start at a complete CSS selector or at-rule");
  }

  let depth = 0;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }

    if (depth < 0) {
      violations.push(`style module closes a CSS block before opening one at offset ${index}`);
      break;
    }
  }

  if (depth !== 0) {
    violations.push(`style module has unbalanced CSS braces with final depth ${depth}`);
  }

  return violations.map((message) => ({
    filePath,
    message,
  }));
}

async function main() {
  const violations = [];
  let checked = 0;

  for (const root of styleRoots) {
    const entries = await readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) {
        continue;
      }

      const filePath = path.join(root, entry.name);
      const source = await readFile(filePath, "utf8");
      const css = extractStyleLiteral(source);
      if (css === undefined) {
        continue;
      }

      checked += 1;
      violations.push(...validateStyleModule(filePath, css));
    }
  }

  if (violations.length === 0) {
    console.log(`style module check passed for ${checked} files`);
    return;
  }

  console.error("style module check failed:");
  for (const violation of violations) {
    console.error(`- ${normalizePath(path.relative(repoRoot, violation.filePath))}: ${violation.message}`);
  }
  process.exitCode = 1;
}

await main();
