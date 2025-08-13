# TopCut Market Addition Scripts

This directory contains scripts to automatically add new TopCut markets to your subgraph configuration with support for multiple market versions.

## Files

- `add-markets.js` - Dynamic Node.js script that supports multiple market versions
- `add-markets-from-env.js` - Helper script to load markets from .env files
- `add-markets.sh` - Shell wrapper script with validation and helpful output
- `market-config-guide.md` - Guide for adding new market versions
- `README.md` - This documentation

## Supported Market Versions

- **V1**: Uses `TopCutMarket_V1.json` ABI and `market.ts` handler
- **V0**: Uses `TopCutMarket_V0.json` ABI and `top-cut-market-V0.ts` handler
- More versions can be easily added by updating the `MARKET_CONFIGS` in `add-markets.js`

## Environment Variable Formats

The script supports two environment variable formats:

1. **With Network Prefix**: `<NETWORK>_TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS>`
2. **Simplified Format**: `TOPCUT_MARKET_V<VERSION>_<NUMBER>=<ADDRESS>` (defaults to BTC network)

## Usage

### Method 1: Using Environment Variables (Recommended)

1. Set environment variables for each new market:

   ```bash
   # V1 Markets
   export BTC_TOPCUT_MARKET_V1_6=0x1234567890123456789012345678901234567890
   export ETH_TOPCUT_MARKET_V1_1=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef

   # V0 Markets
   export BTC_TOPCUT_MARKET_V0_1=0x9876543210987654321098765432109876543210

   # Simplified format (defaults to BTC network)
   export TOPCUT_MARKET_V1_7=0x1111111111111111111111111111111111111111
   export TOPCUT_MARKET_V0_2=0x2222222222222222222222222222222222222222
   ```

2. Run the script:
   ```bash
   ./scripts/add-markets.sh
   # or directly
   node scripts/add-markets.js
   ```

### Method 2: Using a `.env` File

1. Create a `.env` file with your market addresses:

   ```bash
   # markets.env
   BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890
   BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
   BTC_TOPCUT_MARKET_8=0x9876543210987654321098765432109876543210
   ```

2. Source the file and run the script:

   ````bash
   ```bash
   # scripts/.env or scripts/markets.env
   TOPCUT_MARKET_V1_1=0x9A5f16c1f2d6b8c9530144aD23Cfa9B3c4717eF1
   TOPCUT_MARKET_V1_2=0xdFDab494A0E8d5Be32116Ec8e0E0e1513F302089
   TOPCUT_MARKET_V0_1=0x8B64Cf63B08f7eB3ad163282bf61d382DfFF0586
   ````

3. Run the helper script:

   ```bash
   # Load from scripts/.env (default)
   node scripts/add-markets-from-env.js

   # Load from custom path
   node scripts/add-markets-from-env.js path/to/your/markets.env

   # Or use the shell wrapper
   source scripts/.env
   ./scripts/add-markets.sh
   ```

### Method 3: Direct Node.js Script

You can also run the Node.js script directly:

```bash
node scripts/add-markets.js
```

## What the Scripts Do

1. **Validates** your environment variables and addresses
2. **Validates** that required ABI files exist for each market version
3. **Creates backup files** of `networks.json` and `subgraph.yaml` with timestamps
4. **Updates `networks.json`** with the new market addresses
5. **Updates `subgraph.yaml`** with new data source definitions
6. **Provides next steps** for codegen, build, and deploy

## Environment Variable Format

- **Pattern**: `BTC_TOPCUT_MARKET_<NUMBER>=<ADDRESS>`
- **Number**: Any positive integer (e.g., 6, 7, 8, 10, 100)
- **Address**: Valid Ethereum address (42 characters, starts with 0x)

## Examples

### Adding Markets 6-8

```bash
export BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890
export BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
export BTC_TOPCUT_MARKET_8=0x9876543210987654321098765432109876543210
./scripts/add-markets.sh
```

### Adding Markets with Gaps

```bash
export BTC_TOPCUT_MARKET_10=0x1111111111111111111111111111111111111111
export BTC_TOPCUT_MARKET_15=0x2222222222222222222222222222222222222222
./scripts/add-markets.sh
```

## Configuration

The scripts use these default values (you can modify them in `add-markets.js`):

- **Network**: `arbitrum-one`
- **Start Block**: `363495560`
- **ABI File**: `./abis/TopCutMarket_V1.json`
- **Handler File**: `./src/market.ts`

## Safety Features

- ✅ **Address validation** - Ensures addresses are valid Ethereum addresses
- ✅ **Automatic backups** - Creates timestamped backups before making changes
- ✅ **Duplicate detection** - Skips markets that already exist
- ✅ **File validation** - Checks that required files exist and are valid
- ✅ **Git-friendly output** - Shows you how to review changes

## Next Steps After Running

After the script completes successfully:

1. **Review changes**:

   ```bash
   git diff networks.json subgraph.yaml
   ```

2. **Generate code**:

   ```bash
   npm run codegen
   ```

3. **Build subgraph**:

   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## Troubleshooting

### "Invalid address" error

Make sure your addresses:

- Are exactly 42 characters long
- Start with `0x`
- Only contain hexadecimal characters (0-9, a-f, A-F)

### "No market environment variables found"

- Check that your variable names match the pattern: `BTC_TOPCUT_MARKET_<NUMBER>`
- Use `env | grep BTC_TOPCUT_MARKET` to see what variables are set
- If using a `.env` file, make sure you ran `source <filename>`

### "File not found" errors

- Make sure you're running the script from the project root directory
- Check that `networks.json` and `subgraph.yaml` exist

## Advanced Usage

### Custom Configuration

You can modify the script constants in `add-markets.js`:

```javascript
const DEFAULT_START_BLOCK = 363495560; // Change start block
const DEFAULT_NETWORK = "arbitrum-one"; // Change network
```

### Programmatic Usage

You can also import and use the functions directly:

```javascript
const {
  getMarketEnvVars,
  updateNetworksJson,
  updateSubgraphYaml,
} = require("./scripts/add-markets.js");

const markets = getMarketEnvVars();
updateNetworksJson(markets);
updateSubgraphYaml(markets);
```
