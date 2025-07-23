# TopCut Market Addition Scripts

This directory contains scripts to automatically add new TopCut markets to your subgraph configuration.

## Files

- `add-markets.js` - Node.js script that updates `networks.json` and `subgraph.yaml`
- `add-markets.sh` - Shell wrapper script with validation and helpful output
- `README.md` - This documentation

## Usage

### Method 1: Using Environment Variables (Recommended)

1. Set environment variables for each new market:

   ```bash
   export BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890
   export BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
   export BTC_TOPCUT_MARKET_8=0x9876543210987654321098765432109876543210
   ```

2. Run the script:
   ```bash
   ./scripts/add-markets.sh
   ```

### Method 2: Using a `.env` File

1. Create a file with your market addresses:

   ```bash
   # markets.env
   BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890
   BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
   BTC_TOPCUT_MARKET_8=0x9876543210987654321098765432109876543210
   ```

2. Source the file and run the script:
   ```bash
   source markets.env
   ./scripts/add-markets.sh
   ```

### Method 3: Direct Node.js Script

You can also run the Node.js script directly:

```bash
node scripts/add-markets.js
```

## What the Scripts Do

1. **Validates** your environment variables and addresses
2. **Creates backup files** of `networks.json` and `subgraph.yaml` with timestamps
3. **Updates `networks.json`** with the new market addresses
4. **Updates `subgraph.yaml`** with new data source definitions
5. **Provides next steps** for codegen, build, and deploy

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
- **Start Block**: `348072019`
- **ABI File**: `./abis/BTC_TopCutMarket.json`
- **Handler File**: `./src/btc-top-cut-market.ts`

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
const DEFAULT_START_BLOCK = 348072019; // Change start block
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
