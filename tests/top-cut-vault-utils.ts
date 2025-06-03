import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AffiliatePointsUpdated,
  AffiliateRewardsClaimed,
  LoyaltyPointsUpdated,
  LoyaltyRewardDistributed,
  RedeemedPSM
} from "../generated/TopCutVault/TopCutVault"

export function createAffiliatePointsUpdatedEvent(
  nftID: BigInt,
  affiliatePoints: BigInt
): AffiliatePointsUpdated {
  let affiliatePointsUpdatedEvent = changetype<AffiliatePointsUpdated>(
    newMockEvent()
  )

  affiliatePointsUpdatedEvent.parameters = new Array()

  affiliatePointsUpdatedEvent.parameters.push(
    new ethereum.EventParam("nftID", ethereum.Value.fromUnsignedBigInt(nftID))
  )
  affiliatePointsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "affiliatePoints",
      ethereum.Value.fromUnsignedBigInt(affiliatePoints)
    )
  )

  return affiliatePointsUpdatedEvent
}

export function createAffiliateRewardsClaimedEvent(
  nftID: BigInt,
  reward: BigInt
): AffiliateRewardsClaimed {
  let affiliateRewardsClaimedEvent = changetype<AffiliateRewardsClaimed>(
    newMockEvent()
  )

  affiliateRewardsClaimedEvent.parameters = new Array()

  affiliateRewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("nftID", ethereum.Value.fromUnsignedBigInt(nftID))
  )
  affiliateRewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward))
  )

  return affiliateRewardsClaimedEvent
}

export function createLoyaltyPointsUpdatedEvent(
  trader: Address,
  loyaltyPoints: BigInt
): LoyaltyPointsUpdated {
  let loyaltyPointsUpdatedEvent = changetype<LoyaltyPointsUpdated>(
    newMockEvent()
  )

  loyaltyPointsUpdatedEvent.parameters = new Array()

  loyaltyPointsUpdatedEvent.parameters.push(
    new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  )
  loyaltyPointsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "loyaltyPoints",
      ethereum.Value.fromUnsignedBigInt(loyaltyPoints)
    )
  )

  return loyaltyPointsUpdatedEvent
}

export function createLoyaltyRewardDistributedEvent(
  trader: Address,
  reward: BigInt
): LoyaltyRewardDistributed {
  let loyaltyRewardDistributedEvent = changetype<LoyaltyRewardDistributed>(
    newMockEvent()
  )

  loyaltyRewardDistributedEvent.parameters = new Array()

  loyaltyRewardDistributedEvent.parameters.push(
    new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  )
  loyaltyRewardDistributedEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward))
  )

  return loyaltyRewardDistributedEvent
}

export function createRedeemedPSMEvent(
  user: Address,
  amountPSM: BigInt,
  reward: BigInt
): RedeemedPSM {
  let redeemedPsmEvent = changetype<RedeemedPSM>(newMockEvent())

  redeemedPsmEvent.parameters = new Array()

  redeemedPsmEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  redeemedPsmEvent.parameters.push(
    new ethereum.EventParam(
      "amountPSM",
      ethereum.Value.fromUnsignedBigInt(amountPSM)
    )
  )
  redeemedPsmEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward))
  )

  return redeemedPsmEvent
}
