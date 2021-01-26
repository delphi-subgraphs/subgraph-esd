import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts"

import { 
  EpochSnapshot, 
  FundsToBeFrozen,
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
  Vote as DaoVote,
  SupplyDecrease as DaoSupplyDecrease,
  SupplyIncrease as DaoSupplyIncrease,
  SupplyNeutral as DaoSupplyNeutral,
  Vote as DaoVote
} from '../generated/DAOContract/DAOContract'


import { LpContract as DaoCallLpContract } from '../generated/DAOContract/LpContract'
import { DollarContract as DaoCallDollarContract } from '../generated/DAOContract/DollarContract'
import { UniswapV2PairContract } from '../generated/DAOContract/UniswapV2PairContract'


/*
 *** CONSTANTS
 */

let ADDRESS_ZERO_HEX = '0x0000000000000000000000000000000000000000'
let ADDRESS_UNISWAP_PAIR = Address.fromString('0x88ff79eb2bc5850f27315415da8685282c7610f9')
let ADDRESS_ESD_DOLLAR = Address.fromString('0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723')
let ADDRESS_ESD_DAO = Address.fromString('0x443D2f2755DB5942601fa062Cc248aAA153313D3')
let ADDRESS_ESD_LP1 = Address.fromString('0xdF0Ae5504A48ab9f913F8490fBef1b9333A68e68')
let ADDRESS_ESD_LP2 = Address.fromString('0xA5976897BC0081e3895013B08654DfEc50Bcb33F')
let ADDRESS_ESD_LP3 = Address.fromString('0xBBDA9B2f267b94147cB5b51653237C2F1EE69054')
let ADDRESS_ESD_LP4 = Address.fromString('0x4082D11E506e3250009A991061ACd2176077C88f')

// epochs needed to expire the coupons
let DAO_COUPON_EXPIRATION = BigInt.fromI32(90)

// epochs an account stays fluid after bond/unbond
let DAO_EXIT_LOCKUP_EPOCHS = BigInt.fromI32(15)

/*
 *** DOLLAR
 */
export function handleDollarTransfer(event: DollarTransfer): void {
  let transferFrom = event.params.from
  let transferTo = event.params.to
  let transferAmount = event.params.value

  // Deduct amount from sender
  if(transferFrom.toHexString() != ADDRESS_ZERO_HEX) {
    let fromAddressInfo = mustLoadAddressInfo(transferFrom, event.block, 'Transfer')
    if (fromAddressInfo.esdBalance < transferAmount) {
      log.error(
        '[{}]: Got transfer from address {} with insuficient funds value is {} balance is {}',
        [
          event.block.number.toString(),
          transferFrom.toHexString(),
          transferAmount.toString(),
          fromAddressInfo.esdBalance.toString()
        ]
      )
    }

    fromAddressInfo.esdBalance -= transferAmount
    fromAddressInfo.save()
  }

  // Add amount to receiver
  if(transferTo.toHexString() != ADDRESS_ZERO_HEX) {
    let toAddressInfo = AddressInfo.load(transferTo.toHexString())
    if (toAddressInfo == null) {
      toAddressInfo = addressInfoNew(transferTo.toHexString())
    }

    toAddressInfo.esdBalance += transferAmount
    toAddressInfo.save()
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

  // Compute amounts that go back to frozen state on the epoch
  let fundsToBeFrozen = fundsToBeFrozenForEpoch(epoch)

  currentEpochSnapshot.daoBondedFluid -= fundsToBeFrozen.daoBondedFluidToFrozen
  currentEpochSnapshot.daoBondedLocked += fundsToBeFrozen.daoBondedLockedToFrozen
  currentEpochSnapshot.daoBondedFrozen += (fundsToBeFrozen.daoBondedFluidToFrozen + fundsToBeFrozen.daoBondedLockedToFrozen)

  currentEpochSnapshot.daoStagedFluid -= fundsToBeFrozen.daoStagedFluidToFrozen
  currentEpochSnapshot.daoStagedLocked += fundsToBeFrozen.daoStagedLockedToFrozen
  currentEpochSnapshot.daoStagedFrozen += (fundsToBeFrozen.daoStagedFluidToFrozen + fundsToBeFrozen.daoStagedLockedToFrozen)

  // TODO(Fede): Compute LP amounts

  currentEpochSnapshot.save()

  // Fill in balances for history entities
  // Values at the end of the epoch (begining of the next one) are taken
  // TODO(Fede): maybe we can have "current" entities here too
  // (or a singleton entity that has all aggregates), but lets
  // leave these for now to benchmark the aggregate values
  if(epoch > BigInt.fromI32(1)) {
    let historyEpoch =  epoch - BigInt.fromI32(1)

    // esdSupplyHistory
    let dollarContract = DaoCallDollarContract.bind(ADDRESS_ESD_DOLLAR)
    let totalSupplyEsd = dollarContract.totalSupply()
    let totalLpEsd = dollarContract.balanceOf(ADDRESS_UNISWAP_PAIR)
    let totalDaoEsd = dollarContract.balanceOf(ADDRESS_ESD_DAO);

    let esdSupplyHistory = new EsdSupplyHistory(historyEpoch.toString())
    esdSupplyHistory.epoch = historyEpoch
    esdSupplyHistory.daoLockedTotal = totalDaoEsd 
    esdSupplyHistory.lpLockedTotal = totalDaoEsd 
    esdSupplyHistory.totalSupply = totalSupplyEsd
    esdSupplyHistory.save()

    // lpTokenHistory
    let daoContract = DaoContract.bind(ADDRESS_ESD_DAO)
    let uniswapContract = UniswapV2PairContract.bind(ADDRESS_UNISWAP_PAIR)
    let totalLpTokens = uniswapContract.totalSupply()
    let totalLpBonded = BigInt.fromI32(0)
    let totalLpStaged = BigInt.fromI32(0)
    let lpContractAddress = daoContract.pool()
    if(lpContractAddress) {
      let lpContract = DaoCallLpContract.bind(lpContractAddress)
      totalLpBonded = lpContract.totalBonded()
      totalLpStaged = lpContract.totalStaged()
    }

    let lpTokenHistory = new LpTokenHistory(historyEpoch.toString())
    lpTokenHistory.epoch = historyEpoch
    lpTokenHistory.totalSupply = totalLpTokens
    lpTokenHistory.totalBonded = totalLpBonded
    lpTokenHistory.totalStaged = totalLpStaged
  }
}

export function handleDaoDeposit(event: DaoDeposit): void {
  let depositAmount = event.params.value
  let depositAddress = event.params.account
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let addressInfo = mustLoadAddressInfo(depositAddress, event.block, 'Deposit')

  if(addressInfo == null) {
    log.error(
      '[{}]: Got deposit from previously non existing address {}',
      [event.block.number.toString(), depositAddress.toHexString()]
    )
    return
  }

  currentEpochSnapshot.daoStagedTotal += depositAmount
  addressInfo.daoStaged += depositAmount

  if (addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch) == "locked") {
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
  let addressInfo = mustLoadAddressInfo(withdrawAddress, event.block, 'Withdraw')

  currentEpochSnapshot.daoStagedTotal -= withdrawAmount
  addressInfo.daoStaged -= withdrawAmount

  if (addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch) == "locked") {
    currentEpochSnapshot.daoStagedLocked -= withdrawAmount
  } else {
    currentEpochSnapshot.daoStagedFrozen -= withdrawAmount
  }
  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoBond(event: DaoBond): void {
  let bondAddress = event.params.account
  let bondAmount = event.params.value
  let addressInfo = mustLoadAddressInfo(bondAddress, event.block, 'Bond')
  applyAccountDaoDeltaBond(addressInfo, bondAmount)
}

export function handleDaoUnbond(event: DaoUnbond): void {
  let unbondAddress = event.params.account
  let unbondAmount = event.params.valueUnderlying.neg()
  let addressInfo = mustLoadAddressInfo(unbondAddress, event.block, 'Unbond')
  applyAccountDaoDeltaBond(addressInfo, unbondAmount)
}

// Apply DAO bond/unbond from account represented by AddressInfo
// Positive amount means bond, Negative amount means unbond
function applyAccountDaoDeltaBond(addressInfo: AddressInfo, deltaBond: BigInt): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let currentEpoch = currentEpochSnapshot.epoch

  let previousAccountStatus = addressInfoDaoStatus(addressInfo, currentEpoch)
  let fluidUntilEpoch = currentEpoch + DAO_EXIT_LOCKUP_EPOCHS

  // Frozen/Fluid status: all account dao funds get (or stay) fluid
  // Modify aggregated values accordingly
  if(previousAccountStatus == 'fluid') {
    // Account funds stay fluid
    // Amount bonded moves from stagedFluid to bondedFluid
    currentEpochSnapshot.daoStagedFluid -= deltaBond
    currentEpochSnapshot.daoBondedFluid += deltaBond

    // Account funds will freeze on a later epoch now
    let previousFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoFluidUntilEpoch)
    previousFundsToBeFrozen.daoStagedFluidToFrozen -= addressInfo.daoStaged
    previousFundsToBeFrozen.daoBondedFluidToFrozen -= addressInfo.daoBonded
    previousFundsToBeFrozen.save()
  } else {
    // Account funds move from staged to fluid
    currentEpochSnapshot.daoStagedFrozen -= addressInfo.daoStaged
    currentEpochSnapshot.daoBondedFrozen -= addressInfo.daoBonded
    currentEpochSnapshot.daoStagedFluid += (addressInfo.daoStaged - deltaBond)
    currentEpochSnapshot.daoBondedFluid += (addressInfo.daoBonded + deltaBond)
  }

  // Staged/Bonded status: Amount goes from staged to bonded
  currentEpochSnapshot.daoStagedTotal -= deltaBond
  currentEpochSnapshot.daoBondedTotal += deltaBond
  addressInfo.daoStaged -= deltaBond
  addressInfo.daoBonded += deltaBond

  // Funds will become frozen after lockup period
  addressInfo.daoFluidUntilEpoch = fluidUntilEpoch
  let fundsToBeFrozen = fundsToBeFrozenForEpoch(fluidUntilEpoch)
  fundsToBeFrozen.daoStagedFluidToFrozen += addressInfo.daoStaged
  fundsToBeFrozen.daoBondedFluidToFrozen += addressInfo.daoBonded

  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoVote(event: DaoVote): void {
  let voteAddress = event.params.account
  let voteCandidate = event.params.account
  let addressInfo = mustLoadAddressInfo(voteAddress, event.block, 'Vote')
  let currentEpochSnapshot = epochSnapshotGetCurrent()

  // NOTE(Fede): Event does not have the lockup period, so need to call
  // the contract to calculate. Could just use lockedUntil but it was
  // added late in the contract so not sure how that behaves on early
  // blocks
  let daoContract = DaoContract.bind(event.address)
  let candidateStart = daoContract.startFor(voteCandidate)
  let candidatePeriod = daoContract.periodFor(voteCandidate)
  let newDaoLockedUntilEpoch = candidateStart + candidatePeriod

  if(newDaoLockedUntilEpoch > addressInfo.daoLockedUntilEpoch) {
    let daoStatus = addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch)
    if(daoStatus == 'locked') {
      // Funds were locked until a previous Epoch
      let oldFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
      oldFundsToBeFrozen.daoStagedLockedToFrozen -= addressInfo.daoStaged
      oldFundsToBeFrozen.daoBondedLockedToFrozen -= addressInfo.daoBonded
      oldFundsToBeFrozen.save()
    } else if(daoStatus == 'fluid') {
      // Funds were fluid
      let oldFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoFluidUntilEpoch)
      oldFundsToBeFrozen.daoStagedFluidToFrozen -= addressInfo.daoStaged
      oldFundsToBeFrozen.daoBondedFluidToFrozen -= addressInfo.daoBonded
      oldFundsToBeFrozen.save()
    }

    let newFundsToBeFrozen = fundsToBeFrozenForEpoch(newDaoLockedUntilEpoch)
    newFundsToBeFrozen.daoStagedLockedToFrozen += addressInfo.daoStaged
    newFundsToBeFrozen.daoBondedLockedToFrozen += addressInfo.daoBonded
    addressInfo.daoLockedUntilEpoch = newDaoLockedUntilEpoch

    addressInfo.save()
    newFundsToBeFrozen.save()
  }
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
  if (epochSnapshot == null) {
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

  return <EpochSnapshot>epochSnapshot
}

function epochSnapshotCopyCurrent(currentEpochSnapshot: EpochSnapshot): void {
  let epochSnapshot = new EpochSnapshot(currentEpochSnapshot.epoch.toString())
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

function fundsToBeFrozenForEpoch(epoch: BigInt): FundsToBeFrozen {
  let fundsToBeFrozen = FundsToBeFrozen.load(epoch.toString())

  if(fundsToBeFrozen == null) {
    fundsToBeFrozen = new FundsToBeFrozen(epoch.toString())
    fundsToBeFrozen.epoch = epoch
    fundsToBeFrozen.daoStagedFluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoStagedLockedToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoBondedFluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoBondedLockedToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.lpStagedFluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.lpBondedFluidToFrozen = BigInt.fromI32(0)
  }

  return <FundsToBeFrozen>fundsToBeFrozen
}

function addressInfoNew(id: string): AddressInfo {
  let addressInfo = new AddressInfo(id) 

  addressInfo.esdBalance = BigInt.fromI32(0)

  addressInfo.daoClaimable = BigInt.fromI32(0)
  addressInfo.daoBonded = BigInt.fromI32(0)
  addressInfo.daoStaged = BigInt.fromI32(0)
  addressInfo.daoLockedUntilEpoch = BigInt.fromI32(0)
  addressInfo.daoFluidUntilEpoch = BigInt.fromI32(0)

  addressInfo.lpTotalBalance = BigInt.fromI32(0)
  addressInfo.lpBonded = BigInt.fromI32(0)
  addressInfo.lpStaged = BigInt.fromI32(0)
  addressInfo.lpRewarded = BigInt.fromI32(0)
  addressInfo.lpFluidUntilEpoch = BigInt.fromI32(0)

  return addressInfo
}

function addressInfoDaoStatus(addressInfo: AddressInfo, epoch: BigInt): string {
  if(addressInfo.daoLockedUntilEpoch > epoch) {
    return 'locked'
  }
  if(addressInfo.daoFluidUntilEpoch > epoch) {
    return 'fluid'
  }
  return 'frozen'
}

function mustLoadAddressInfo(address: Address, block: ethereum.Block, operation: String): AddressInfo {
  let addressInfo = AddressInfo.load(address.toHexString())
  if(addressInfo == null) {
    log.error(
      '[{}]: Got {} from previously non existing address {}',
      [block.number.toString(), operation, address.toHexString()]
    )
  }
  return <AddressInfo>addressInfo
}
