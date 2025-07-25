#!/usr/bin/env node

/**
 * Helper script to load environment variables from .env file and run add-markets.js
 *
 * Usage: node scripts/add-markets-from-env.js [path-to-env-file]
 *
 * If no path is provided, it will look for scripts/.env
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return envVars;
}

function main() {
  const envPath = process.argv[2] || path.join(__dirname, ".env");

  console.log(`Loading environment variables from: ${envPath}`);

  try {
    const envVars = loadEnvFile(envPath);

    // Filter only market-related environment variables
    const marketVars = Object.keys(envVars)
      .filter((key) => key.includes("TOPCUT_MARKET_V"))
      .reduce((obj, key) => {
        obj[key] = envVars[key];
        return obj;
      }, {});

    if (Object.keys(marketVars).length === 0) {
      console.log("❌ No TopCut market variables found in environment file");
      console.log("Expected variables like: TOPCUT_MARKET_V1_1=0x...");
      return;
    }

    console.log(`Found ${Object.keys(marketVars).length} market variable(s):`);
    Object.entries(marketVars).forEach(([key, value]) => {
      console.log(`  ${key}=${value}`);
    });
    console.log("");

    // Spawn the add-markets script with the environment variables
    const child = spawn("node", ["scripts/add-markets.js"], {
      env: { ...process.env, ...marketVars },
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`add-markets script exited with code ${code}`);
        process.exit(code);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
