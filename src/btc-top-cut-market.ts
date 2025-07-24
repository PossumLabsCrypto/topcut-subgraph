import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  CohortSettled as CohortSettledEvent,
  PredictionPosted as PredictionPostedEvent,
} from "../generated/BTC_TopCutMarket1/BTC_TopCutMarket";
import {
  MarketTrades,
  SettledCohorts,
  Trade,
  TradeHistory,
} from "../generated/schema";

export function handlePredictionPosted(event: PredictionPostedEvent): void {
  const marketHex = event.address;
  const marketAddress = marketHex ? marketHex : null;
  if (!marketAddress) {
    return; // Handle the case where the market address is not available
  }
  let marketTrades = MarketTrades.load(marketAddress);
  if (!marketTrades) {
    marketTrades = new MarketTrades(marketAddress);
  }

  const trade = new Trade(event.transaction.hash.toHex());
  const tradeHistory = new TradeHistory(event.transaction.hash.toHex());
  trade.trader = event.params.user;
  tradeHistory.trader = event.params.user;

  trade.price = event.params.price;
  tradeHistory.price = event.params.price;

  trade.settlementTime = event.params.settlementTime;
  tradeHistory.settlementTime = event.params.settlementTime;

  trade.market = marketAddress;
  tradeHistory.market = marketAddress;

  tradeHistory.isActive = true;

  trade.save();
  tradeHistory.save();

  marketTrades.save();
}

export function handleCohortSettled(event: CohortSettledEvent): void {
  const marketHex = event.address;

  const marketAddress = marketHex ? marketHex : null;
  if (!marketAddress) {
    return; // Handle the case where the market address is not available
  }
  let marketTrades = MarketTrades.load(marketAddress);
  if (!marketTrades) {
    return; // No trades to settle
  }

  {
    const newSettledCohort = new SettledCohorts(event.transaction.hash.toHex());
    newSettledCohort.market = marketAddress;
    newSettledCohort.settlementTime = event.params.settlementTime;
    newSettledCohort.cohortSize = event.params.cohortSize;
    newSettledCohort.winners = event.params.winners;
    newSettledCohort.save();
  }

  let trades = marketTrades.trades.load();
  const settlementTime = event.params.settlementTime;

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    if (!trade) {
      continue; // Skip if trade is null
    }
    const tradeSettlementTime = trade.settlementTime;
    let tradeHistory = TradeHistory.load(trade.id);

    if (tradeHistory) {
      tradeHistory.isActive = false;
      tradeHistory.save();
    }

    if (tradeSettlementTime.lt(settlementTime)) {
      store.remove("Trade", trade.id);
    }
  }

  marketTrades.save();
}
