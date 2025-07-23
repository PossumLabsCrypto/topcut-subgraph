#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Script to automatically add TopCutMarkets to networks.json and subgraph.yaml
 *
 * Usage:
 * 1. Set environment variables with pattern: BTC_TOPCUT_MARKET_<NUMBER>=<ADDRESS>
 * 2. Run: node scripts/add-markets.js
 *
 * Example env vars:
 * BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890
 * BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
 */

const NETWORKS_FILE = path.join(__dirname, "..", "networks.json");
const SUBGRAPH_FILE = path.join(__dirname, "..", "subgraph.yaml");
const DEFAULT_START_BLOCK = 348072019;
const DEFAULT_NETWORK = "arbitrum-one";

function getMarketEnvVars() {
  const markets = {};

  // Look for environment variables matching BTC_TOPCUT_MARKET_<NUMBER>
  Object.keys(process.env).forEach((key) => {
    const match = key.match(/^BTC_TOPCUT_MARKET_(\d+)$/);
    if (match) {
      const marketNumber = parseInt(match[1]);
      const address = process.env[key];

      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.warn(`Warning: Invalid address for ${key}: ${address}`);
        return;
      }

      markets[marketNumber] = {
        name: `BTC_TopCutMarket${marketNumber}`,
        address: address,
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
  return `  - kind: ethereum
    name: ${market.name}
    network: ${DEFAULT_NETWORK}
    source:
      address: "${market.address}"
      abi: BTC_TopCutMarket
      startBlock: ${DEFAULT_START_BLOCK}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - CohortSettled
        - PendingClaims
        - PredictionPosted
      abis:
        - name: BTC_TopCutMarket
          file: ./abis/BTC_TopCutMarket.json
      eventHandlers:
        - event: PredictionPosted(indexed address,indexed uint256,uint256)
          handler: handlePredictionPosted
        - event: CohortSettled(uint256,uint256,uint256)
          handler: handleCohortSettled
      file: ./src/btc-top-cut-market.ts`;
}

function updateSubgraphYaml(markets) {
  console.log("Updating subgraph.yaml...");

  let subgraphContent = fs.readFileSync(SUBGRAPH_FILE, "utf8");

  // Find existing markets to determine where to insert new ones
  const existingMarkets = [];
  const marketRegex = /name: (BTC_TopCutMarket\d+)/g;
  let match;
  while ((match = marketRegex.exec(subgraphContent)) !== null) {
    const marketNum = parseInt(match[1].replace("BTC_TopCutMarket", ""));
    existingMarkets.push(marketNum);
  }

  // Add new markets
  Object.entries(markets).forEach(([marketNumber, market]) => {
    const marketNum = parseInt(marketNumber);

    if (existingMarkets.includes(marketNum)) {
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

function main() {
  try {
    console.log("🚀 TopCut Market Addition Script");
    console.log("================================");

    validateFiles();

    const markets = getMarketEnvVars();

    if (Object.keys(markets).length === 0) {
      console.log("❌ No market environment variables found!");
      console.log("\nPlease set environment variables in the format:");
      console.log("BTC_TOPCUT_MARKET_<NUMBER>=<ADDRESS>");
      console.log("\nExample:");
      console.log(
        "export BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890"
      );
      console.log(
        "export BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
      );
      return;
    }

    console.log(`Found ${Object.keys(markets).length} market(s) to add:`);
    Object.values(markets).forEach((market) => {
      console.log(`  - ${market.name}: ${market.address}`);
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

module.exports = { getMarketEnvVars, updateNetworksJson, updateSubgraphYaml };
