import {
  AffiliatePointsUpdated as AffiliatePointsUpdatedEvent,
  AffiliateRewardsClaimed as AffiliateRewardsClaimedEvent,
  LoyaltyPointsUpdated as LoyaltyPointsUpdatedEvent,
  LoyaltyRewardDistributed as LoyaltyRewardDistributedEvent,
  RedeemedPSM as RedeemedPSMEvent
} from "../generated/TopCutVault/TopCutVault"
import {
  AffiliatePointsUpdated,
  AffiliateRewardsClaimed,
  LoyaltyPointsUpdated,
  LoyaltyRewardDistributed,
  RedeemedPSM
} from "../generated/schema"

export function handleAffiliatePointsUpdated(
  event: AffiliatePointsUpdatedEvent
): void {
  let entity = new AffiliatePointsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.nftID = event.params.nftID
  entity.affiliatePoints = event.params.affiliatePoints

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAffiliateRewardsClaimed(
  event: AffiliateRewardsClaimedEvent
): void {
  let entity = new AffiliateRewardsClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.nftID = event.params.nftID
  entity.reward = event.params.reward

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoyaltyPointsUpdated(
  event: LoyaltyPointsUpdatedEvent
): void {
  let entity = new LoyaltyPointsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.trader = event.params.trader
  entity.loyaltyPoints = event.params.loyaltyPoints

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoyaltyRewardDistributed(
  event: LoyaltyRewardDistributedEvent
): void {
  let entity = new LoyaltyRewardDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.trader = event.params.trader
  entity.reward = event.params.reward

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedeemedPSM(event: RedeemedPSMEvent): void {
  let entity = new RedeemedPSM(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amountPSM = event.params.amountPSM
  entity.reward = event.params.reward

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
