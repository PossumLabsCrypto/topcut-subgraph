import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import { MarketTrades, SettledCohorts, Trade } from "../generated/schema";

import {
  CohortSettled as CohortSettledEvent_V1,
  PredictionPosted as PredictionPostedEvent_V1,
  TopCutMarket_V1,
} from "../generated/TopCutMarket_V1_1/TopCutMarket_V1";

import {
  CohortSettled as CohortSettledEvent_V2,
  PredictionPosted as PredictionPostedEvent_V2,
  TopCutMarket_V2,
} from "../generated/TopCutMarket_V2_1/TopCutMarket_V2";
import {
  CohortSettled as CohortSettledEvent_V3,
  PredictionPosted as PredictionPostedEvent_V3,
} from "../generated/TopCutMarket_V3_1/TopCutMarket_V3";

export function handlePredictionPosted_V1(
  event: PredictionPostedEvent_V1
): void {
  let marketContract = TopCutMarket_V1.bind(event.address);
  let tradeDuration = marketContract.TRADE_DURATION();
  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime.plus(tradeDuration)
  );
}

export function handlePredictionPosted_V2(
  event: PredictionPostedEvent_V2
): void {
  let marketContract = TopCutMarket_V2.bind(event.address);
  let tradeDuration = marketContract.TRADE_DURATION();
  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime.plus(tradeDuration)
  );
}
export function handlePredictionPosted_V3(
  event: PredictionPostedEvent_V3
): void {
  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime
  );
}

// *************************************************
// ***************************************
// *****************************
// NOTE: In Future updates, PredictionPosted_V1 and PredictionPosted_V2 might come with the correct settlementTime. The common function should always work as intended.

// export function handlePredictionPosted_V3(
//   event: PredictionPostedEvent_V#
// ): void {
//   handlePredictionPostedCommon(
//     event.address,
//     event.transaction.hash,
//     event.params.user,
//     event.params.price,
//     event.params.settlementTime // Assuming V3 has the correct settlementTime
//   );
// }

// *****************************
// ***************************************
// *************************************************

export function handleCohortSettled_V1(event: CohortSettledEvent_V1): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    null // V1 doesn't have settlementPrice
  );
}

export function handleCohortSettled_V2(event: CohortSettledEvent_V2): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    event.params.settlementPrice // V2 has settlementPrice
  );
}

export function handleCohortSettled_V3(event: CohortSettledEvent_V3): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    event.params.settlementPrice // V3 has settlementPrice
  );
}

// Common implementation functions
function handlePredictionPostedCommon(
  address: Address,
  txHash: Bytes,
  user: Address,
  price: BigInt,
  settlementTime: BigInt
): void {
  const marketAddress = address;
  if (!marketAddress) {
    return;
  }

  let marketTrades = MarketTrades.load(marketAddress);
  if (!marketTrades) {
    marketTrades = new MarketTrades(marketAddress);
  }

  const trade = new Trade(txHash.toHex());
  trade.trader = user;
  trade.price = price;
  trade.settlementTime = settlementTime;
  trade.market = marketAddress;
  trade.isActive = true;

  trade.save();
  marketTrades.save();
}

function handleCohortSettledCommon(
  address: Address,
  txHash: Bytes,
  settlementTime: BigInt,
  cohortSize: BigInt,
  winners: BigInt,
  settlementPrice: BigInt | null
): void {
  const marketAddress = address;
  if (!marketAddress) {
    return;
  }

  let marketTrades = MarketTrades.load(marketAddress);
  if (!marketTrades) {
    return;
  }
  if (cohortSize.isZero() && winners.isZero()) {
    // If cohortSize and winners are zero, we can skip creating a SettledCohort
    // This is useful for cases where the cohort is settled without any winners and the first settled Cohort which is empty by default.
    return;
  }

  const newSettledCohort = new SettledCohorts(txHash.toHex());
  newSettledCohort.market = marketAddress;
  newSettledCohort.settlementTime = settlementTime;
  newSettledCohort.cohortSize = cohortSize;
  newSettledCohort.winners = winners;
  newSettledCohort.settlementPrice = settlementPrice;
  newSettledCohort.save();

  let trades = marketTrades.trades.load();

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    if (!trade) {
      continue;
    }

    if (trade.settlementTime.le(settlementTime) && trade.isActive) {
      trade.isActive = false;
      trade.save();
    }
  }

  marketTrades.save();
}
