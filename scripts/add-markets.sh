#!/bin/bash

# TopCut Market Addition Script
# This script helps you add new TopCut markets by setting environment variables
# and running the Node.js script

set -e

echo "🚀 TopCut Market Addition Helper"
echo "==============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "networks.json" ] || [ ! -f "subgraph.yaml" ]; then
    echo "❌ Error: Please run this script from the topcut-graph project root directory"
    sleep 20
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    sleep 20
    exit 1
fi

# Function to validate Ethereum address
validate_address() {
    local address=$1
    if [[ ! $address =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        echo "❌ Invalid Ethereum address: $address"
        echo "   Addresses must be 42 characters long and start with 0x"
        return 1
    fi
    return 0
}

# Check for environment variables
found_markets=false
echo "🔍 Checking for market environment variables..."

for var in $(env | grep '^BTC_TOPCUT_MARKET_' | cut -d= -f1 | sort -V); do
    value=${!var}
    market_num=$(echo $var | sed 's/BTC_TOPCUT_MARKET_//')
    
    if validate_address "$value"; then
        echo "  ✅ $var = $value"
        found_markets=true
    else
        echo "  ❌ $var = $value (invalid)"
        sleep 20
    exit 1
    fi
done

if [ "$found_markets" = false ]; then
    echo ""
    echo "❌ No BTC_TOPCUT_MARKET_* environment variables found!"
    echo ""
    echo "Please set environment variables in the format:"
    echo "  export BTC_TOPCUT_MARKET_<NUMBER>=<ADDRESS>"
    echo ""
    echo "Examples:"
    echo "  export BTC_TOPCUT_MARKET_6=0x1234567890123456789012345678901234567890"
    echo "  export BTC_TOPCUT_MARKET_7=0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
    echo ""
    echo "You can also create a .env file with these variables and source it:"
    echo "  echo 'BTC_TOPCUT_MARKET_6=0x1234...' > markets.env"
    echo "  source markets.env"
    echo "  ./scripts/add-markets.sh"
    sleep 20
    exit 1
fi

echo ""
echo "📝 Running market addition script..."
node scripts/add-markets.js

echo ""
echo "🎯 Quick validation - checking if markets were added:"
echo ""

# Quick validation
for var in $(env | grep '^BTC_TOPCUT_MARKET_' | cut -d= -f1 | sort -V); do
    market_num=$(echo $var | sed 's/BTC_TOPCUT_MARKET_//')
    market_name="BTC_TopCutMarket${market_num}"
    
    if grep -q "\"$market_name\":" networks.json; then
        echo "  ✅ $market_name found in networks.json"
    else
        echo "  ❌ $market_name NOT found in networks.json"
    fi
    
    if grep -q "name: $market_name" subgraph.yaml; then
        echo "  ✅ $market_name found in subgraph.yaml"
    else
        echo "  ❌ $market_name NOT found in subgraph.yaml"
    fi
done

echo ""
echo "💡 Pro tip: You can view the changes with:"
echo "  git diff networks.json subgraph.yaml"
