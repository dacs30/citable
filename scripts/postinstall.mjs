import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

async function main() {
  try {
    console.log("postinstall: creating Chromium archive...");

    // Resolve the @sparticuz/chromium package location
    const chromiumResolvedUrl = import.meta.resolve("@sparticuz/chromium");
    // fileURLToPath handles file:///c:/... correctly on Windows
    const chromiumEntryPath = fileURLToPath(chromiumResolvedUrl);
    // Entry point is at build/esm/index.js — go up 3 levels to package root
    const chromiumDir = dirname(dirname(dirname(chromiumEntryPath)));
    const binDir = join(chromiumDir, "bin");

    if (!existsSync(binDir)) {
      console.log("Chromium bin directory not found, skipping archive creation.");
      return;
    }

    const publicDir = join(projectRoot, "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = join(publicDir, "chromium-pack.tar");

    // Normalize to forward slashes for tar (Windows backslashes break it)
    const tarOutput = outputPath.replace(/\\/g, "/");
    const tarSource = binDir.replace(/\\/g, "/");

    console.log("  Source:", tarSource);
    console.log("  Output:", tarOutput);

    execSync(`tar --force-local -cf "${tarOutput}" -C "${tarSource}" .`, {
      stdio: "inherit",
      cwd: projectRoot,
    });

    console.log("Chromium archive created successfully.");
  } catch (error) {
    console.error("Failed to create chromium archive:", error.message);
    console.log("This is not critical for local development.");
    process.exit(0);
  }
}

main();
