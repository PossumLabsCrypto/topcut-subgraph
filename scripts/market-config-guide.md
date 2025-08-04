# Market Configuration Guide

This guide explains how to add new market versions to the dynamic add-markets script.

## Adding a New Market Version

### 1. Add ABI File

First, add your new ABI file to the `abis/` directory:

```
abis/TopCutMarket_V2.json  # Example for V2
```

### 2. Create Handler File (Optional)

Create a new handler file if needed:

```
src/market.ts  # Example for V2
```

### 3. Update Market Configuration

In `scripts/add-markets.js`, add your new version to the `MARKET_CONFIGS` object:

```javascript
const MARKET_CONFIGS = {
  V1: {
    // ... existing V1 config
  },
  V2: {
    // Add your new version here
    abiName: "TopCutMarket_V2",
    abiFile: "./abis/TopCutMarket_V2.json",
    handlerFile: "./src/market.ts",
    entities: ["CohortSettled", "PrizesClaimed", "PredictionPosted"],
    eventHandlers: [
      {
        event: "PredictionPosted(indexed address,indexed uint256,uint256)",
        handler: "handlePredictionPosted",
      },
      {
        event: "CohortSettled(uint256,uint256,uint256)",
        handler: "handleCohortSettled",
      },
      // Add more event handlers as needed
    ],
  },
  // Add more versions as needed
};
```

### 4. Set Environment Variables

Use the new version in your environment variables:

```bash
export BTC_TOPCUT_MARKET_V2_1=0x1234567890123456789012345678901234567890
export ETH_TOPCUT_MARKET_V2_1=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
```

### 5. Run the Script

```bash
node scripts/add-markets.js
```

## Environment Variable Pattern

The script supports environment variables with this pattern:

```
<NETWORK>_TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS>
```

Examples:

- `BTC_TOPCUT_MARKET_V1_6` - Bitcoin market, version 1, instance 6
- `ETH_TOPCUT_MARKET_V2_1` - Ethereum market, version 2, instance 1
- `MATIC_TOPCUT_MARKET_V1_3` - Polygon market, version 1, instance 3

## Configuration Properties

### Required Properties:

- `abiName`: The name of the ABI (must match the name in the ABI file)
- `abiFile`: Path to the ABI JSON file
- `handlerFile`: Path to the TypeScript handler file
- `entities`: Array of GraphQL entities
- `eventHandlers`: Array of event handler configurations

### Event Handler Configuration:

- `event`: The event signature (e.g., "PredictionPosted(indexed address,indexed uint256,uint256)")
- `handler`: The handler function name (e.g., "handlePredictionPosted")

## Notes

- The script will validate that ABI files exist before proceeding
- Handler files are checked but only show warnings if missing
- Existing markets in networks.json and subgraph.yaml will be skipped
- Backup files are automatically created before any changes
