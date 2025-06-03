import {
  LoyaltyPointsUpdated as LoyaltyPointsUpdatedEvent,
  LoyaltyRewardDistributed as LoyaltyRewardDistributedEvent,
} from "../generated/TopCutVault/TopCutVault"
import {
  LoyaltyPointsList,
} from "../generated/schema"

export function handleLoyaltyPointsUpdated(
  event: LoyaltyPointsUpdatedEvent
): void {
  const trader = event.params.trader;
  let userEntry = LoyaltyPointsList.load(trader)
  if (!userEntry) {
    userEntry = new LoyaltyPointsList(trader);
  }
  userEntry.loyaltyPoints = event.params.loyaltyPoints;
  userEntry.isActive = true;
  userEntry.save();
}

export function handleLoyaltyRewardDistributed(
  event: LoyaltyRewardDistributedEvent
): void {
  const trader = event.params.trader;
  let userEntry = LoyaltyPointsList.load(trader)
  if (!userEntry) {
    userEntry = new LoyaltyPointsList(trader);
  }
  userEntry.isActive = false;
  userEntry.save();
}
