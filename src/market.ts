import { store } from "@graphprotocol/graph-ts";
import { MarketTrades, SettledCohorts, Trade } from "../generated/schema";

import {
  CohortSettled as CohortSettledEvent_V1,
  PredictionPosted as PredictionPostedEvent_V1,
} from "../generated/TopCutMarket_V1_1/TopCutMarket_V1";

import {
  CohortSettled as CohortSettledEvent_V2,
  PredictionPosted as PredictionPostedEvent_V2,
} from "../generated/TopCutMarket_V2_1/TopCutMarket_V2";

type TPredictionPostedEvent =
  | PredictionPostedEvent_V1
  | PredictionPostedEvent_V2;
type TCohortSettledEvent = CohortSettledEvent_V1 | CohortSettledEvent_V2;

export function handlePredictionPosted(event: TPredictionPostedEvent): void {
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
  trade.trader = event.params.user;

  trade.price = event.params.price;

  trade.settlementTime = event.params.settlementTime;

  trade.market = marketAddress;

  trade.isActive = true;

  trade.save();

  marketTrades.save();
}

export function handleCohortSettled(event: TCohortSettledEvent): void {
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
    // Explicitly handle settlementPrice
    if (event instanceof CohortSettledEvent_V2) {
      newSettledCohort.settlementPrice = event.params.settlementPrice;
    } else {
      // V1 events don't have settlementPrice, leave as null
      newSettledCohort.settlementPrice = null;
    }
    newSettledCohort.save();
  }

  let trades = marketTrades.trades.load();
  const settlementTime = event.params.settlementTime;

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    if (!trade) {
      continue; // Skip if trade is null
    }

    if (trade.settlementTime.lt(settlementTime) && trade.isActive) {
      trade.isActive = false;
      trade.save();
    }
  }

  marketTrades.save();
}
