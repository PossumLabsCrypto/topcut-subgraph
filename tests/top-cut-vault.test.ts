import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AffiliatePointsUpdated } from "../generated/schema"
import { AffiliatePointsUpdated as AffiliatePointsUpdatedEvent } from "../generated/TopCutVault/TopCutVault"
import { handleAffiliatePointsUpdated } from "../src/top-cut-vault"
import { createAffiliatePointsUpdatedEvent } from "./top-cut-vault-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let nftID = BigInt.fromI32(234)
    let affiliatePoints = BigInt.fromI32(234)
    let newAffiliatePointsUpdatedEvent = createAffiliatePointsUpdatedEvent(
      nftID,
      affiliatePoints
    )
    handleAffiliatePointsUpdated(newAffiliatePointsUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AffiliatePointsUpdated created and stored", () => {
    assert.entityCount("AffiliatePointsUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AffiliatePointsUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "nftID",
      "234"
    )
    assert.fieldEquals(
      "AffiliatePointsUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "affiliatePoints",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
