import {
  PredictionPosted as PredictionPostedEvent,
} from "../generated/BTC_TopCutMarket/BTC_TopCutMarket"
import {
  MarketTrades, Trade,
} from "../generated/schema"

export function handlePredictionPosted(event: PredictionPostedEvent): void {
  const marketHex = event.address;
  const marketAddress = marketHex ? marketHex : null;
    if (!marketAddress) {
        return; // Handle the case where the market address is not available
    }
  let marketTrades = MarketTrades.load(marketAddress)
  if (!marketTrades) {
    marketTrades = new MarketTrades(marketAddress);
  }
  const trade = new Trade(event.transaction.hash.toHex());
  trade.trader = event.params.user;
  trade.price = event.params.price;
  trade.settlementTime = event.params.settlementTime;
  trade.market = marketAddress;
  trade.save();
  marketTrades.save();
}
