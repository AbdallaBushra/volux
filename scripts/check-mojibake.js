const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src");
const TARGET_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".json"]);
const MOJIBAKE_PATTERN = /(Ã.|Â.|â.|Ø.|Ù.|Ð.|Ñ.)/;

const excludedPaths = [
  path.join("src", "dataconnect-generated"),
  path.join("src", "admin", "pages", "Organizations.jsx"),
  path.join("src", "admin", "pages", "Settings.jsx"),
  path.join("src", "admin", "pages", "Teams.jsx"),
  path.join("src", "admin", "styles", "admin.css"),
  path.join("src", "auth", "authHelpers.js"),
  path.join("src", "InstitutionProfile.jsx"),
  path.join("src", "LoginPage.jsx"),
  path.join("src", "TeamLoginPage.jsx"),
  path.join("src", "TeamProfile.jsx"),
];

const shouldSkip = (filePath) => {
  const normalized = filePath.replaceAll("\\", "/");
  return excludedPaths.some((excluded) => normalized.includes(excluded.replaceAll("\\", "/")));
};

const listFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath);
    }
    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      return [];
    }
    if (shouldSkip(fullPath)) {
      return [];
    }
    return [fullPath];
  });
};

const offenders = [];

for (const file of listFiles(ROOT)) {
  const content = fs.readFileSync(file, "utf8");
  if (MOJIBAKE_PATTERN.test(content)) {
    offenders.push(path.relative(path.resolve(__dirname, ".."), file));
  }
}

if (offenders.length > 0) {
  console.error("Mojibake patterns detected in:");
  offenders.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log("No mojibake patterns detected.");
