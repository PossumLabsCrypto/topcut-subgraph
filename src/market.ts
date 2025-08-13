import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
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

export function handlePrizesClaimed(event: PrizeClaimedEvent): void {
  const trader = event.params.user;
  const claimAmount = event.params.claimedAmount;

  let userClaims = UserPaidAndClaimed.load(trader);
  if (!userClaims) {
    userClaims = new UserPaidAndClaimed(trader);
    userClaims.claimed = BigInt.fromI32(0);
    userClaims.paid = BigInt.fromI32(0);
  }

  userClaims.claimed = userClaims.claimed.plus(claimAmount);
  userClaims.save();
}

export function handlePredictionPosted_V1(
  event: PredictionPostedEvent_V1
): void {
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

  {
    let marketTradeSize = MarketTradeSize.load(marketAddress);
    if (!marketTradeSize) {
      marketTradeSize = new MarketTradeSize(marketAddress);
      const marketContract = TopCutMarket_V1.bind(marketAddress);
      const tradeSize = marketContract.TRADE_SIZE();
      marketTradeSize.tradeSize = tradeSize;
      marketTradeSize.save();
    }

    {
      let userClaims = UserPaidAndClaimed.load(user);
      if (!userClaims) {
        userClaims = new UserPaidAndClaimed(user);
        userClaims.claimed = BigInt.fromI32(0);
        userClaims.paid = BigInt.fromI32(0);
      }

      // Update the paid amount for the user
      userClaims.paid = userClaims.paid.plus(marketTradeSize.tradeSize);
      userClaims.save();
    }
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
