#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Script to automatically add TopCutMarkets to networks.json and subgraph.yaml
 *
 * Usage:
 * 1. Set environment variables with pattern: <NETWORK>_TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS>
 * 2. Run: node scripts/add-markets.js
 *
 * Supported patterns:
 * - BTC_TOPCUT_MARKET_V1_<NUMBER>=<ADDRESS>  (uses TopCutMarket_V1.json ABI)
 * - BTC_TOPCUT_MARKET_V0_<NUMBER>=<ADDRESS>  (uses TopCutMarket_V0.json ABI)
 * - ETH_TOPCUT_MARKET_V1_<NUMBER>=<ADDRESS>  (uses TopCutMarket_V1.json ABI)
 * - etc.
 *
 * Example env vars:
 * BTC_TOPCUT_MARKET_V1_6=0x1234567890123456789012345678901234567890
 * BTC_TOPCUT_MARKET_V0_1=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
 * ETH_TOPCUT_MARKET_V1_1=0x9876543210987654321098765432109876543210
 */

// Market version configurations
const MARKET_CONFIGS = {
  V1: {
    abiName: "TopCutMarket_V1",
    abiFile: "./abis/TopCutMarket_V1.json",
    handlerFile: "./src/market.ts",
    entities: ["CohortSettled", "PrizesClaimed", "PredictionPosted"],
    eventHandlers: [
      {
        event: "PredictionPosted(indexed address,indexed uint256,uint256)",
        handler: "handlePredictionPosted_V1",
      },
      {
        event: "CohortSettled(uint256,uint256,uint256,uint256)",
        handler: "handleCohortSettled_V1",
      },
      {
        event: "PrizesClaimed(indexed address,uint256)",
        handler: "handlePrizesClaimed",
      },
    ],
  },
  // Add more versions as needed
};

const NETWORKS_FILE = path.join(__dirname, "..", "networks.json");
const SUBGRAPH_FILE = path.join(__dirname, "..", "subgraph.yaml");
const DEFAULT_START_BLOCK = 363495560;
const DEFAULT_NETWORK = "arbitrum-one";

function getMarketEnvVars() {
  const markets = {};

  // Look for environment variables matching patterns:
  // 1. <NETWORK>_TOPCUT_MARKET_V<VERSION>_<NUMBER> (with network prefix)
  // 2. TOPCUT_MARKET_V<VERSION>_<NUMBER> (backward compatibility)
  Object.keys(process.env).forEach((key) => {
    let match, network, version, marketNumber;

    // Try pattern with network prefix first
    match = key.match(/^([A-Z]+)_TOPCUT_MARKET_V(\d+)_(\d+)$/);
    if (match) {
      [, network, version, marketNumber] = match;
    } else {
      // Try pattern without network prefix (backward compatibility)
      match = key.match(/^TOPCUT_MARKET_V(\d+)_(\d+)$/);
      if (match) {
        [, version, marketNumber] = match;
        network = "BTC"; // Default to BTC for backward compatibility
      }
    }

    if (match) {
      const address = process.env[key];

      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.warn(`Warning: Invalid address for ${key}: ${address}`);
        return;
      }

      const versionKey = `V${version}`;
      if (!MARKET_CONFIGS[versionKey]) {
        console.warn(
          `Warning: Unsupported market version ${versionKey} for ${key}`
        );
        return;
      }

      const marketKey = `${network}_V${version}_${marketNumber}`;
      markets[marketKey] = {
        name: `TopCutMarket_V${version}_${marketNumber}`,
        address: address,
        network: network,
        version: versionKey,
        marketNumber: parseInt(marketNumber),
        config: MARKET_CONFIGS[versionKey],
      };
    }
  });

  return markets;
}

function updateNetworksJson(markets) {
  console.log("Updating networks.json...");

  const networksData = JSON.parse(fs.readFileSync(NETWORKS_FILE, "utf8"));

  // Ensure the network exists
  if (!networksData[DEFAULT_NETWORK]) {
    networksData[DEFAULT_NETWORK] = {};
  }

  // Add new markets
  Object.values(markets).forEach((market) => {
    if (networksData[DEFAULT_NETWORK][market.name]) {
      console.log(`  - ${market.name} already exists, updating address...`);
    } else {
      console.log(`  - Adding ${market.name}...`);
    }

    networksData[DEFAULT_NETWORK][market.name] = {
      address: market.address,
    };
  });

  // Write back to file with proper formatting
  fs.writeFileSync(NETWORKS_FILE, JSON.stringify(networksData, null, 2) + "\n");
  console.log("✅ networks.json updated successfully");
}

function generateDataSourceYaml(market) {
  const config = market.config;

  const eventHandlersYaml = config.eventHandlers
    .map(
      (eh) => `        - event: ${eh.event}\n          handler: ${eh.handler}`
    )
    .join("\n");

  return `  - kind: ethereum
    name: ${market.name}
    network: ${DEFAULT_NETWORK}
    source:
      address: "${market.address}"
      abi: ${config.abiName}
      startBlock: ${DEFAULT_START_BLOCK}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - ${config.entities.join("\n        - ")}
      abis:
        - name: ${config.abiName}
          file: ${config.abiFile}
      eventHandlers:
${eventHandlersYaml}
      file: ${config.handlerFile}`;
}

function updateSubgraphYaml(markets) {
  console.log("Updating subgraph.yaml...");

  let subgraphContent = fs.readFileSync(SUBGRAPH_FILE, "utf8");

  // Find existing markets to determine where to insert new ones
  const existingMarkets = [];
  const marketRegex = /name: (TopCutMarket_V\d+_\d+)/g;
  let match;
  while ((match = marketRegex.exec(subgraphContent)) !== null) {
    existingMarkets.push(match[1]);
  }

  // Add new markets
  Object.entries(markets).forEach(([marketKey, market]) => {
    if (existingMarkets.includes(market.name)) {
      console.log(
        `  - ${market.name} already exists in subgraph.yaml, skipping...`
      );
      return;
    }

    console.log(`  - Adding ${market.name} to subgraph.yaml...`);

    // Find the end of the dataSources section (before any templates if they exist)
    const dataSourceYaml = generateDataSourceYaml(market);

    // Insert before the end of the file
    subgraphContent = subgraphContent.trimEnd() + "\n" + dataSourceYaml + "\n";
  });

  fs.writeFileSync(SUBGRAPH_FILE, subgraphContent);
  console.log("✅ subgraph.yaml updated successfully");
}

function validateFiles() {
  if (!fs.existsSync(NETWORKS_FILE)) {
    throw new Error(`networks.json not found at ${NETWORKS_FILE}`);
  }

  if (!fs.existsSync(SUBGRAPH_FILE)) {
    throw new Error(`subgraph.yaml not found at ${SUBGRAPH_FILE}`);
  }

  // Validate networks.json is valid JSON
  try {
    JSON.parse(fs.readFileSync(NETWORKS_FILE, "utf8"));
  } catch (e) {
    throw new Error(`Invalid JSON in networks.json: ${e.message}`);
  }
}

function validateMarketConfigs(markets) {
  const missingFiles = [];

  Object.values(markets).forEach((market) => {
    const config = market.config;
    const abiPath = path.join(
      __dirname,
      "..",
      config.abiFile.replace("./", "")
    );
    const handlerPath = path.join(
      __dirname,
      "..",
      config.handlerFile.replace("./", "")
    );

    if (!fs.existsSync(abiPath)) {
      missingFiles.push(`ABI file: ${config.abiFile} (for ${market.name})`);
    }

    if (!fs.existsSync(handlerPath)) {
      console.warn(
        `⚠️  Handler file not found: ${config.handlerFile} (for ${market.name})`
      );
      console.warn("   You may need to create this file manually.");
    }
  });

  if (missingFiles.length > 0) {
    throw new Error(
      `Missing required files:\n  - ${missingFiles.join(
        "\n  - "
      )}\n\nPlease add the required ABI files before running this script.`
    );
  }
}

function main() {
  try {
    console.log("🚀 TopCut Market Addition Script");
    console.log("================================");

    validateFiles();

    const markets = getMarketEnvVars();

    if (Object.keys(markets).length === 0) {
      console.log("❌ No market environment variables found!");
      console.log("\nSupported environment variable formats:");
      console.log("1. <NETWORK>_TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS>");
      console.log(
        "2. TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS> (defaults to BTC network)"
      );
      console.log(
        "\nSupported versions:",
        Object.keys(MARKET_CONFIGS).join(", ")
      );
      console.log("\nExamples:");
      console.log(
        "export BTC_TOPCUT_MARKET_V1_6=0x1234567890123456789012345678901234567890"
      );
      console.log(
        "export TOPCUT_MARKET_V0_1=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
      );
      console.log(
        "export ETH_TOPCUT_MARKET_V1_1=0x9876543210987654321098765432109876543210"
      );
      return;
    }

    // Validate that required files exist for the markets
    validateMarketConfigs(markets);

    console.log(`Found ${Object.keys(markets).length} market(s) to add:`);
    Object.values(markets).forEach((market) => {
      console.log(`  - ${market.name} (${market.version}): ${market.address}`);
    });
    console.log("");

    // Create backup files
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(NETWORKS_FILE, `${NETWORKS_FILE}.backup.${timestamp}`);
    fs.copyFileSync(SUBGRAPH_FILE, `${SUBGRAPH_FILE}.backup.${timestamp}`);
    console.log(`📁 Backup files created with timestamp: ${timestamp}`);
    console.log("");

    updateNetworksJson(markets);
    updateSubgraphYaml(markets);

    console.log("");
    console.log("🎉 All done! Next steps:");
    console.log("1. Run: npm run codegen");
    console.log("2. Run: npm run build");
    console.log("3. Run: npm run deploy");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getMarketEnvVars,
  updateNetworksJson,
  updateSubgraphYaml,
  validateMarketConfigs,
  MARKET_CONFIGS,
};
