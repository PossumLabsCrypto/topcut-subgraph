import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  ClaimsPerMarket,
  MarketTrades,
  MarketTradeSize,
  SettledCohorts,
  Trade,
  UserPaidAndClaimed,
} from "../generated/schema";

import {
  CohortSettled as CohortSettledEvent_V1,
  PredictionPosted as PredictionPostedEvent_V1,
  PrizesClaimed as PrizeClaimedEvent,
  TopCutMarket_V1,
} from "../generated/TopCutMarket_V1_1/TopCutMarket_V1";

import {
  CohortSettled as OldMarketsCohortSettledEvent,
  PredictionPosted as OldMarketsPredictionPostedEvent,
  OldMarkets,
} from "../generated/OldMarkets_1/OldMarkets";
import {
  CohortSettled as OldMarketsCohortSettledEvent_V2,
  PredictionPosted as OldMarketsPredictionPostedEvent_V2,
  OldMarkets_V2,
} from "../generated/OldMarkets_5/OldMarkets_V2";

export function handleOldPredictionPosted(
  event: OldMarketsPredictionPostedEvent
): void {
  let marketContract = OldMarkets.bind(event.address);
  let tradeDuration = marketContract.TRADE_DURATION();

  let tradeSize = marketContract.TRADE_SIZE();
  updateMarketTradeSize(event.address, event.params.user, tradeSize);

  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime.plus(tradeDuration)
  );
}
export function handleOldPredictionPosted_V2(
  event: OldMarketsPredictionPostedEvent_V2
): void {
  let marketContract = OldMarkets_V2.bind(event.address);
  let tradeDuration = marketContract.TRADE_DURATION();

  let tradeSize = marketContract.TRADE_SIZE();
  updateMarketTradeSize(event.address, event.params.user, tradeSize);

  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime.plus(tradeDuration)
  );
}

export function handleOldCohortSettled(
  event: OldMarketsCohortSettledEvent
): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    null // Old markets do not have settlementPrice
  );
}

export function handleOldCohortSettled_V2(
  event: OldMarketsCohortSettledEvent_V2
): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    event.params.settlementPrice // V3 has settlementPrice
  );
}

export function handlePredictionPosted_V1(
  event: PredictionPostedEvent_V1
): void {
  let marketContract = TopCutMarket_V1.bind(event.address);

  let tradeSize = marketContract.TRADE_SIZE();
  updateMarketTradeSize(event.address, event.params.user, tradeSize);

  handlePredictionPostedCommon(
    event.address,
    event.transaction.hash,
    event.params.user,
    event.params.price,
    event.params.settlementTime
  );
}

export function handleCohortSettled_V1(event: CohortSettledEvent_V1): void {
  handleCohortSettledCommon(
    event.address,
    event.transaction.hash,
    event.params.settlementTime,
    event.params.cohortSize,
    event.params.winners,
    event.params.settlementPrice
  );
}

export function handlePrizesClaimed(event: PrizeClaimedEvent): void {
  const trader = event.params.user;
  const claimAmount = event.params.claimedAmount;
  const marketAddress = event.address;

  let userClaims = UserPaidAndClaimed.load(trader);
  let claimsPerMarket = ClaimsPerMarket.load(marketAddress.concat(trader));
  if (!userClaims) {
    userClaims = new UserPaidAndClaimed(trader);
  }
  if (!claimsPerMarket) {
    claimsPerMarket = new ClaimsPerMarket(marketAddress.concat(trader));
    claimsPerMarket.claimed = BigInt.fromI32(0);
    claimsPerMarket.user = trader;
    claimsPerMarket.market = marketAddress;
    claimsPerMarket.paid = BigInt.fromI32(0);
  }

  claimsPerMarket.claimed = claimsPerMarket.claimed.plus(claimAmount);
  claimsPerMarket.save();

  userClaims.save();
}

// Common implementation functions
function updateMarketTradeSize(
  marketAddress: Address,
  user: Address,
  tradeSize: BigInt
): void {
  let marketTradeSize = MarketTradeSize.load(marketAddress);
  if (!marketTradeSize) {
    marketTradeSize = new MarketTradeSize(marketAddress);
    marketTradeSize.tradeSize = tradeSize;
    marketTradeSize.save();
  }

  {
    let userClaims = UserPaidAndClaimed.load(user);
    let claimsPerMarket = ClaimsPerMarket.load(marketAddress.concat(user));
    if (!userClaims) {
      userClaims = new UserPaidAndClaimed(user);
    }
    if (!claimsPerMarket) {
      claimsPerMarket = new ClaimsPerMarket(marketAddress.concat(user));
      claimsPerMarket.claimed = BigInt.fromI32(0);
      claimsPerMarket.user = user;
      claimsPerMarket.market = marketAddress;
      claimsPerMarket.paid = BigInt.fromI32(0);
    }

    // Update the paid amount for the user
    claimsPerMarket.paid = claimsPerMarket.paid.plus(marketTradeSize.tradeSize);
    claimsPerMarket.save();
    userClaims.save();
  }
}

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
