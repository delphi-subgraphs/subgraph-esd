// Provides values that vary from implementation to implementation that
// cannot be retrieved through public getters
import { BigInt, ethereum, log } from "@graphprotocol/graph-ts"

import { EpochSnapshot } from "../generated/schema"

// https://github.com/emptysetsquad/dollar/pull/1
// https://etherscan.io/address/0xBe3c2149729a7c001FEfc5b9c1EF829d242dE0CC
//  * Changes oracle pool ratio from %5 to 20% 
let PROPOSAL1_BLOCK = BigInt.fromI32(10911148)

// https://github.com/emptysetsquad/dollar/pull/9
// https://etherscan.io/address/0x4202ffe860a2b77225d446bafb8e346e054da361
//  * Increases lockup epochs for dao and pool
//  * Changes how pool amount share in increase supply is calculated
let PROPOSAL9_BLOCK = BigInt.fromI32(11250300)

// https://github.com/emptysetsquad/dollar/pull/11/files
// https://etherscan.io/address/0xFDad22E653C103Ef4310e4D68E88c8Dc4705F2D1
//  * Adds Treasury
//  * Changes how pool amount share is calculated and adds treasury rewards 
//    to newBonded event amount
let PROPOSAL12_BLOCK = BigInt.fromI32(11413089)

// Epochs that an account gets frozen after being fluid because of bond/unbond
export function impDaoExitLockupEpochs(block: ethereum.Block): BigInt {
  if(block.number < PROPOSAL9_BLOCK) {
    return BigInt.fromI32(1)
  } else {
    return BigInt.fromI32(15)
  }
}

export function getLpExitLockupEpochs(block: ethereum.Block): BigInt {
  if(block.number < PROPOSAL9_BLOCK) {
    return BigInt.fromI32(1)
  } else {
    return BigInt.fromI32(5)
  }
}

// Calculates amounts sent to lp and dao on a supply increase and applies these amounts to
// an epoch snapshot    
export function impApplyBondedSupply(epochSnapshot: EpochSnapshot, newRedeemable: BigInt, newBonded: BigInt, block: ethereum.Block): EpochSnapshot {
  let bondReward = BigInt.fromI32(0)
  if(block.number < PROPOSAL9_BLOCK) {
    // Pool and Bond rewards taken at the end (can apply bondReward directly)
    let poolReward = getOraclePoolShare(newBonded, block)
    bondReward = newBonded - poolReward
    if(bondReward > BigInt.fromI32(0)) {
      epochSnapshot.daoBondedEsdTotal += bondReward
    }
  } else if(block.number < PROPOSAL12_BLOCK) {
    // Pool rewards share taken from an adjusted redeemable amount
    let redeemableBeforePool = newRedeemable / (BigInt.fromI32(1) - (getOraclePoolRatio(block) / BigInt.fromI32(100)))
    let poolRedeemableReward = getOraclePoolShare(redeemableBeforePool, block)
    let bondedAfterRedeemable = newBonded - poolRedeemableReward
    let poolSupplyShare = getOraclePoolShare(bondedAfterRedeemable, block)
    bondReward = bondedAfterRedeemable - poolSupplyShare
  } else {
    // Treasury added in, both tresury and pool share taken
    // from the total newSupply 
    let newSupply = newRedeemable + newBonded
    let poolReward = getOraclePoolShare(newSupply, block)
    let treasuryReward = getTreasuryShare(newSupply, block)
    bondReward = newBonded - poolReward - treasuryReward
  }

  // TODO(Fede): Apply lp bonded, but maybe can just use mints to pool?

  if(bondReward > BigInt.fromI32(0)) {
    epochSnapshot.daoBondedEsdTotal += bondReward
  }
  if(bondReward < BigInt.fromI32(0)) {
    log.error(
      "[{}]: computed negative block reward (epoch supply increase) {} on epoch {}",
      [block.number.toString(), bondReward.toString(), epochSnapshot.epoch.toString()]
    )
  }

  return epochSnapshot
}

export function impApplyCouponExpirationSupply(epochSnapshot: EpochSnapshot, newBonded: BigInt, block: ethereum.Block): EpochSnapshot {
  let poolReward = getOraclePoolShare(newBonded, block)
  let treasuryReward = getTreasuryShare(newBonded, block)
  let bondReward = newBonded - poolReward - treasuryReward

  if(bondReward > BigInt.fromI32(0)) {
    epochSnapshot.daoBondedEsdTotal += bondReward
  }
  if(bondReward < BigInt.fromI32(0)) {
    log.error(
      "[{}]: computed negative block reward (coupon expiration) {} on epoch {}",
      [block.number.toString(), bondReward.toString(), epochSnapshot.epoch.toString()]
    )
  }

  return epochSnapshot

}

function getOraclePoolShare(targetAmount: BigInt, block: ethereum.Block): BigInt {
  return targetAmount * getOraclePoolRatio(block) / BigInt.fromI32(100)
}

function getOraclePoolRatio(block: ethereum.Block): BigInt {
  if(block.number < PROPOSAL1_BLOCK) {
    return BigInt.fromI32(5)
  } else {
    return BigInt.fromI32(20)
  }
}

function getTreasuryShare(targetAmount: BigInt, block: ethereum.Block): BigInt {
  return targetAmount * getTreasuryRatio(block) / BigInt.fromI32(1000)
}

function getTreasuryRatio(block: ethereum.Block): BigInt {
  if(block.number < PROPOSAL12_BLOCK) {
    return BigInt.fromI32(0)
  } else {
    return BigInt.fromI32(250)
  }
}

