import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts"

import { 
  EpochSnapshot, 
  EsdSupplyHistory,
  LpTokenHistory,
  AddressInfo
} from '../generated/schema'

import { 
  DollarContract ,
  Transfer as DollarTransfer
} from '../generated/DAOContract/DollarContract'

import {
  DaoContract,
  Advance as DaoAdvance,
  Deposit as DaoDeposit,
  Withdraw as DaoWithdraw,
  Bond as DaoBond,  
  Unbond as DaoUnbond,
  CouponExpiration as DaoCouponExpiration,
  CouponPurchase as DaoCouponPurchase,
  CouponRedemption as DaoCouponRedemption,
  SupplyDecrease as DaoSupplyDecrease,
  SupplyIncrease as DaoSupplyIncrease,
  SupplyNeutral as DaoSupplyNeutral,
  Vote as DaoVote
} from '../generated/DAOContract/DAOContract'


import { LPContract } from '../generated/DAOContract/LPContract'
import { UniswapV2PairContract } from '../generated/DAOContract/UniswapV2PairContract'

import { ContractAddresses } from './constants'

/*
 *** CONSTANTS
 */

let ADDRESS_ZERO_HEX = '0x0000000000000000000000000000000000000000'

// epochs needed to expire the coupons
let COUPON_EXPIRATION = BigInt.fromI32(90)


/*
 *** DOLLAR
 */
export function handleDollarTransfer(event: DollarTransfer): void {
  let transferFrom = event.params.from
  let transferTo = event.params.to
  let transferAmount = event.params.value

  // Deduct amount from sender
  if(transferFrom.toHexString() != ADDRESS_ZERO_HEX) {
    let fromAddressInfo = AddressInfo.load(transferFrom.toHexString())
    if (fromAddressInfo == null) {
      log.error(
        '[{}]: Got transfer from previously non existing address {}',
        [event.block.number.toString(), transferFrom.toHexString()]
      )
    } else if (fromAddressInfo == null) {
      log.error(
        '[{}]: Got transfer from address {} with insuficient funds value is {} balance is {}',
        [
          event.block.number.toString(),
          transferFrom.toHexString(),
          transferAmount.toString(),
          fromAddress.esdBalance.toString()
        ]
      )
    }

    fromAddressInfo.esdBalance -= transferAmount
  }

  // Add amount to receiver
  if(transferTo.toHexString() != ADDRESS_ZERO_HEX) {
    let toAddressInfo = AddressInfo.load(transferTo.toHexString())
    if (toAddressInfo == null) {
      toAddressInfo = addressInfoNew(transferTo.toHexString)
    }

    toAddressInfo.esdBalance += transferAmount
  }
}


/*
 *** DAO
 */

export function handleDaoAdvance(event: DaoAdvance): void {
  // save current values into previous epoch snapshot
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  if(currentEpochSnapshot.epoch > BigInt.fromI32(0)) {
    epochSnapshotCopyCurrent(currentEpochSnapshot)
  }
  // set epoch timestamp
  let epoch = event.params.epoch
  currentEpochSnapshot.epoch = epoch
  currentEpochSnapshot.timestamp = event.params.timestamp
  currentEpochSnapshot.save()

  // Fill in balances for history entities
  // Values at the end of the epoch (begining of the next one) are taken
  // TODO(Fede): maybe we can have "current" entities here too
  // (or a singleton entity that has all aggregates), but lets
  // leave these for now to benchmark the aggregate values
  if(epoch > BigInt.fromI32(1)) {
    let historyEpoch =  epoch - 1

    // esdSupplyHistory
    let dollarContract = DollarContract.bind(ContractAddresses.esdDollar)
    let totalSupplyEsd = dollarContract.totalSupply()
    let totalLpEsd = dollarContract.balanceOf(ContractAddresses.uniswapPair)
    let totalDaoEsd = dollarContract.balanceOf(ContractAddresses.esdDao);

    let esdSupplyHistory = new EsdSupplyHistory(historyEpoch.toString())
    esdSupplyHistory.epoch = historyEpoch
    esdSupplyHistory.daoLockedTotal = totalDaoEsd 
    esdSupplyHistory.lpLockedTotal = totalDaoEsd 
    esdSupplyHistory.totalSupply = totalSuplyEsd
    esdSupplyHistory.save()

    // lpTokenHistory
    let daoContract = DaoContract.bind(ContractAddress.esdDao)
    let uniswapContract = UniswapV2PairContract.bind(ContractAddresses.uniswapPair)
    let totalLpTokens = uniswapContract.totalSupply()
    let totalLpBonded = BigInt.fromI32(0)
    let totalLpStaged = BigInt.fromI32(0)
    lpContractAddress = daoContract.pool()
    if(lpContractAddress) {
      let lpContractAddress = LPContract.bind(lpContractAddress)
      totalLpBonded = lpContract.totalBonded()
      totalLpStaged = lpContract.totalStaged()
    }

    let lpTokenHistory = new lpTokenHistory(historyEpoch.toString())
    lpTokenHistory.epoch = historyEpoch
    lpTokenHistory.totalSuppy = totalLpTokens
    lpTokenHistory.totalBonded = totalLpBonded
    lpTokenHistory.totalStaged = totalLpStaged
  }
}

export function handleDaoDeposit(event: DaoDeposit): void {
  let depositAmount = event.params.value
  let depositAddress = event.params.account
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  // NOTE(Fede): Should exist in order to deposit
  let addressInfo = AddressInfo.load(depositAddress.toHexString())

  currentEpochSnapshot.daoStagedTotal += depositAmount
  addressInfo.daoStaged += depositAmount

  if (addressInfo.daoStatus == "Locked") {
    currentEpochSnapshot.daoStagedLocked += depositAmount
  } else {
    currentEpochSnapshot.daoStagedFrozen += depositAmount
  }

  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoWithdraw(event: DaoWithdraw): void {
  let withdrawAmount = event.params.value
  let withdrawAddress = event.params.account
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  // NOTE(Fede): Should exist in order to withdraw
  let addressInfo = AddressInfo.load(withdrawAddress.toHexString())

  // TODO: Depending on address info status
  currentEpochSnapshot.daoStagedTotal -= withdrawAmount
  addressInfo.daoStaged -= withdrawAmount

  if (addressInfo.daoStatus == "Locked") {
    currentEpochSnapshot.daoStagedLocked -= withdrawAmount
  } else {
    currentEpochSnapshot.daoStagedFrozen -= withdrawAmount
  }
  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoSupplyDecrease(event: DaoSupplyDecrease): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot.oraclePrice = event.params.price
  currentEpochSnapshot.save()
}

export function handleDaoSupplyIncrease(event: DaoSupplyIncrease): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot.oraclePrice = event.params.price
  currentEpochSnapshot.save()
}

export function handleDaoSupplyNeutral(event: DaoSupplyNeutral): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot.oraclePrice = BigInt.fromI32(1).pow(18)
  currentEpochSnapshot.save()
}


/*
 *** HELPERS
 */

// Current Epoch snapshot has a special id "current" and holds all the aggregate values
function epochSnapshotGetCurrent(): EpochSnapshot {
  let epochSnapshot = EpochSnapshot.load("current")
  if (epochSnashot == null) {
    epochSnapshot = new EpochSnapshot("current")
    epochSnapshot.epoch = BigInt.fromI32(0)
    epochSnapshot.timestamp = BigInt.fromI32(0)

    epochSnapshot.expiredCoupons = BigInt.fromI32(0)
    epochSnapshot.outstandingCoupons = BigInt.fromI32(0)
    epochSnapshot.couponsExpiration = BigInt.fromI32(0)
    epochSnapshot.oraclePrice = BigInt.fromI32(0)
    epochSnapshot.bootstrappingAt = false

    epochSnapshot.daoBondedTotal = BigInt.fromI32(0)
    epochSnapshot.daoBondedFrozen = BigInt.fromI32(0)
    epochSnapshot.daoBondedFluid = BigInt.fromI32(0)
    epochSnapshot.daoBondedLocked = BigInt.fromI32(0)

    epochSnapshot.daoStagedTotal = BigInt.fromI32(0)
    epochSnapshot.daoStagedFrozen = BigInt.fromI32(0)
    epochSnapshot.daoStagedFluid = BigInt.fromI32(0)
    epochSnapshot.daoStagedLocked = BigInt.fromI32(0)

    epochSnapshot.lpBondedTotal = BigInt.fromI32(0)
    epochSnapshot.lpBondedFrozen = BigInt.fromI32(0)
    epochSnapshot.lpBondedFluid = BigInt.fromI32(0)
    epochSnapshot.lpBondedLocked = BigInt.fromI32(0)

    epochSnapshot.lpStagedTotal = BigInt.fromI32(0)
    epochSnapshot.lpStagedFrozen = BigInt.fromI32(0)
    epochSnapshot.lpStagedFluid = BigInt.fromI32(0)
    epochSnapshot.lpStagedLocked = BigInt.fromI32(0)

    epochSnapshot.lpClaimableTotal = BigInt.fromI32(0)
    epochSnapshot.lpClaimableFrozen = BigInt.fromI32(0)
    epochSnapshot.lpClaimableFluid = BigInt.fromI32(0)
    epochSnapshot.lpClaimableLocked = BigInt.fromI32(0)

    epochSnapshot.lpRewardedTotal = BigInt.fromI32(0)
    
    epochSnapshot.save()
  }

  return epochSnapshot
}

function epochSnapshotCopyCurrent(currentEpochSnapshot: EpochSnapshot): void {
  epochSnapshot = new EpochSnapshot(currentEpochSnapshot.epoch.toString())
  epochSnapshot.epoch = currentEpochSnapshot.epoch
  epochSnapshot.timestamp = currentEpochSnapshot.timestamp

  epochSnapshot.expiredCoupons = currentEpochSnapshot.expiredCoupons
  epochSnapshot.outstandingCoupons = currentEpochSnapshot.outstandingCoupons
  epochSnapshot.couponsExpiration = currentEpochSnapshot.couponsExpiration
  epochSnapshot.oraclePrice = currentEpochSnapshot.oraclePrice
  epochSnapshot.bootstrappingAt = currentEpochSnapshot.bootstrappingAt

  epochSnapshot.daoBondedTotal = currentEpochSnapshot.daoBondedTotal
  epochSnapshot.daoBondedFrozen = currentEpochSnapshot.daoBondedFrozen
  epochSnapshot.daoBondedFluid = currentEpochSnapshot.daoBondedFluid
  epochSnapshot.daoBondedLocked = currentEpochSnapshot.daoBondedLocked

  epochSnapshot.daoStagedTotal = currentEpochSnapshot.daoStagedTotal
  epochSnapshot.daoStagedFrozen = currentEpochSnapshot.daoStagedFrozen
  epochSnapshot.daoStagedFluid = currentEpochSnapshot.daoStagedFluid
  epochSnapshot.daoStagedLocked = currentEpochSnapshot.daoStagedLocked

  epochSnapshot.lpBondedTotal = currentEpochSnapshot.lpBondedTotal
  epochSnapshot.lpBondedFrozen = currentEpochSnapshot.lpBondedFrozen
  epochSnapshot.lpBondedFluid = currentEpochSnapshot.lpBondedFluid
  epochSnapshot.lpBondedLocked = currentEpochSnapshot.lpBondedLocked

  epochSnapshot.lpStagedTotal = currentEpochSnapshot.lpStagedTotal
  epochSnapshot.lpStagedFrozen = currentEpochSnapshot.lpStagedFrozen
  epochSnapshot.lpStagedFluid = currentEpochSnapshot.lpStagedFluid
  epochSnapshot.lpStagedLocked = currentEpochSnapshot.lpStagedLocked

  epochSnapshot.lpClaimableTotal = currentEpochSnapshot.lpClaimableTotal
  epochSnapshot.lpClaimableFrozen = currentEpochSnapshot.lpClaimableFrozen
  epochSnapshot.lpClaimableFluid = currentEpochSnapshot.lpClaimableFluid
  epochSnapshot.lpClaimableLocked = currentEpochSnapshot.lpClaimableLocked

  epochSnapshot.lpRewardedTotal = currentEpochSnapshot.lpRewardedTotal

  epochSnapshot.save()
}

function addressInfoNew(id: string): AddressInfo {
  addressInfo = new AddressInfo(id) 
  addressInfo.esdBalance = BigInt.fromI32(0)
  addressInfo.lpTotalBalance = BigInt.fromI32(0)
  addressInfo.lpBonded = BigInt.fromI32(0)
  addressInfo.lpStaged = BigInt.fromI32(0)
  addressInfo.lpRewarded = BigInt.fromI32(0)
  addressInfo.lpStatus = "Frozen"

  addressInfo.daoClaimable = BigInt.fromI32(0)
  addressInfo.daoBonded = BigInt.fromI32(0)
  addressInfo.daoStaged = BigInt.fromI32(0)
  addressInfo.daoStatus = "Frozen" 
  addressInfo.daoLockedUntilEpoch = BigInt.fromI32(0)

  return addressInfo
}
