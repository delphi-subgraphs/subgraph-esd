import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts"

import { 
  Meta,
  EpochSnapshot, 
  FundsToBeFrozen,
  EsdSupplyHistory,
  LpUniV2TokenHistory,
  AddressInfo
} from '../generated/schema'

import { 
  DollarContract,
  Transfer as DollarTransfer
} from '../generated/DaoContract/DollarContract'

import { 
  Upgraded as UpgradeableUpgraded
} from '../generated/UpgradeableContract/UpgradeableContract'

// Dao Contract
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
  CouponExpiration as DaoCouponExpiration,
} from '../generated/DaoContract/DaoContract'


// TODO(elfedy): Do we need to have a separate contract object per contract calling it? or
// can they be the same entity on different contracts as long as they have the same name
// and an abi is provided for them in subgraph.yaml
import { LpContract as DaoCallLpContract } from '../generated/DaoContract/LpContract'

import { DollarContract as DaoCallDollarContract } from '../generated/DaoContract/DollarContract'

import { UniswapV2PairContract } from '../generated/DaoContract/UniswapV2PairContract'

import {
  DaoContract as UpgradeableCallDaoContract,
} from '../generated/UpgradeableContract/DaoContract'

// LP Contract
import { 
  LpContract as TemplateLpContract,
} from '../generated/templates'

import { 
  Deposit as LpDeposit,
  Withdraw as LpWithdraw,
  Provide as LpProvide,
  Bond as LpBond,  
  Unbond as LpUnbond,
  Claim as LpClaim,
} from '../generated/templates/LpContract/LpContract'

import {
  impDaoExitLockupEpochs,
  impLpExitLockupEpochs,
  impApplyBondedSupply,
  impApplyCouponExpirationSupply,
} from './implementations'

/*
 *** CONSTANTS
 */
let BI_ZERO = BigInt.fromI32(0)

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

/*
 *** DOLLAR
 */

export function handleDollarTransfer(event: DollarTransfer): void {
  let transferFrom = event.params.from
  let transferTo = event.params.to
  let transferAmount = event.params.value

  log.debug(
    '[{}]: Transfer {} from address {} to {}',
    [event.block.number.toString(), transferAmount.toString(), transferFrom.toHexString(), transferTo.toHexString()])
  // Deduct amount from sender
  if(transferFrom.toHexString() != ADDRESS_ZERO_HEX && transferAmount > BI_ZERO) {
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
  if(transferTo.toHexString() != ADDRESS_ZERO_HEX && transferAmount > BI_ZERO) {
    let toAddressInfo = AddressInfo.load(transferTo.toHexString())
    if (toAddressInfo == null) {
      toAddressInfo = addressInfoNew(transferTo.toHexString())
    }

    toAddressInfo.esdBalance += transferAmount
    toAddressInfo.save()
  }
}

/*
 *** UPGRADEABLE
 */

export function handleUpgradeableUpgraded(event: UpgradeableUpgraded): void {
  let meta = Meta.load("current")
  if (meta == null) {
    meta = new Meta("current")
    meta.lpAddress = ADDRESS_ZERO_HEX 
  }

  // Check if there's a new pool for contract. If there is, add
  // to meta and start listening to its events
  let daoContract = UpgradeableCallDaoContract.bind(ADDRESS_ESD_DAO)
  let currentPool = daoContract.pool()

  if(currentPool.toHexString() != meta.lpAddress) {
    log.info(
      "[{}]: Creating new pool contract for address [{}]",
      [event.block.number.toString(), currentPool.toHexString()]
    )
    meta.lpAddress = currentPool.toHexString()
    meta.save()
    TemplateLpContract.create(currentPool)
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
  currentEpochSnapshot.block = event.block.number

  // Compute amounts that go back to frozen state on the epoch
  let fundsToBeFrozen = fundsToBeFrozenForEpoch(epoch)

  currentEpochSnapshot.daoBondedEsdsFluid -= fundsToBeFrozen.daoBondedEsdsFluidToFrozen
  currentEpochSnapshot.daoBondedEsdsLocked -= fundsToBeFrozen.daoBondedEsdsLockedToFrozen
  currentEpochSnapshot.daoBondedEsdsFrozen += (fundsToBeFrozen.daoBondedEsdsFluidToFrozen + fundsToBeFrozen.daoBondedEsdsLockedToFrozen)

  currentEpochSnapshot.daoStagedEsdFluid -= fundsToBeFrozen.daoStagedEsdFluidToFrozen
  currentEpochSnapshot.daoStagedEsdLocked -= fundsToBeFrozen.daoStagedEsdLockedToFrozen
  currentEpochSnapshot.daoStagedEsdFrozen += (fundsToBeFrozen.daoStagedEsdFluidToFrozen + fundsToBeFrozen.daoStagedEsdLockedToFrozen)

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
    esdSupplyHistory.lpLockedTotal = totalLpEsd 
    esdSupplyHistory.totalSupply = totalSupplyEsd
    esdSupplyHistory.save()

    // lpTokenHistory
    let daoContract = DaoContract.bind(ADDRESS_ESD_DAO)
    let uniswapContract = UniswapV2PairContract.bind(ADDRESS_UNISWAP_PAIR)
    let totalLpUniV2 = uniswapContract.totalSupply()
    let totalLpBonded = BigInt.fromI32(0)
    let totalLpStaged = BigInt.fromI32(0)
    let lpContractAddress = daoContract.pool()
    if(lpContractAddress) {
      let lpContract = DaoCallLpContract.bind(lpContractAddress)
      totalLpBonded = lpContract.totalBonded()
      totalLpStaged = lpContract.totalStaged()
    }

    let lpTokenHistory = new LpUniV2TokenHistory(historyEpoch.toString())
    lpTokenHistory.epoch = historyEpoch
    lpTokenHistory.totalSupply = totalLpUniV2
    lpTokenHistory.totalBonded = totalLpBonded
    lpTokenHistory.totalStaged = totalLpStaged
    lpTokenHistory.save()
  }
}

export function handleDaoDeposit(event: DaoDeposit): void {
  let depositAmount = event.params.value
  let depositAddress = event.params.account
  if(depositAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(depositAddress, event.block, 'Deposit')
    if(addressInfo == null) {
      log.error(
        '[{}]: Got deposit from previously non existing address {}',
        [event.block.number.toString(), depositAddress.toHexString()]
      )
      return
    }
    applyDaoDepositDelta(addressInfo, depositAmount, event.block)
  }
}

export function handleDaoWithdraw(event: DaoWithdraw): void {
  let withdrawAmount = event.params.value
  let withdrawAddress = event.params.account
  if(withdrawAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(withdrawAddress, event.block, 'Withdraw')
    let deltaStagedEsd = withdrawAmount.neg()
    applyDaoDepositDelta(addressInfo, deltaStagedEsd, event.block)
  }
}

// Apply Dao Withdraw/Deposit from account represented by AddressInfo
// Positive deltaStagedEsd amount means Deposit, Negative amount means Withdraw
function applyDaoDepositDelta(addressInfo: AddressInfo, deltaStagedEsd: BigInt, block: ethereum.Block): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()

  currentEpochSnapshot.daoStagedEsdTotal += deltaStagedEsd
  addressInfo.daoStagedEsd += deltaStagedEsd
  let accountStatus = addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch)
  if (accountStatus == "locked") {
    currentEpochSnapshot.daoStagedEsdLocked += deltaStagedEsd

    // Add amount to funds unlocked 
    let fundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
  } if (accountStatus == "fluid") {
    log.error(
      "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}",
      [block.number.toString(), addressInfo.id, currentEpochSnapshot.epoch.toString()]
    )
  } else {
    currentEpochSnapshot.daoStagedEsdFrozen += deltaStagedEsd
  }
  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoBond(event: DaoBond): void {
  let account = event.params.account
  let deltaStagedEsd = event.params.valueUnderlying.neg()
  let deltaBondedEsds = event.params.value
  if(deltaStagedEsd < BI_ZERO || deltaBondedEsds > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(account, event.block, 'Bond')
    applyDaoBondingDeltas(addressInfo, deltaStagedEsd, deltaBondedEsds, event.block)
  }
}

export function handleDaoUnbond(event: DaoUnbond): void {
  let account = event.params.account
  let deltaStagedEsd = event.params.valueUnderlying
  let deltaBondedEsds = event.params.value.neg()
  if(deltaStagedEsd > BI_ZERO || deltaBondedEsds > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(account, event.block, 'Unbond')
    applyDaoBondingDeltas(addressInfo, deltaStagedEsd, deltaBondedEsds, event.block)
  }
}

// Apply Dao Bond/Unbond from account represented by AddressInfo
// Positive amount means bond, Negative amount means unbond
function applyDaoBondingDeltas(addressInfo: AddressInfo, deltaStagedEsd: BigInt, deltaBondedEsds: BigInt, block: ethereum.Block): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let currentEpoch = currentEpochSnapshot.epoch

  let previousAccountStatus = addressInfoDaoStatus(addressInfo, currentEpoch)
  let fluidUntilEpoch = currentEpoch + impDaoExitLockupEpochs(block)

  // Frozen/Fluid status: all account dao funds get (or stay) fluid
  // Modify aggregated values accordingly
  if(previousAccountStatus == 'fluid') {
    // Account funds stay fluid
    currentEpochSnapshot.daoStagedEsdFluid += deltaStagedEsd
    currentEpochSnapshot.daoBondedEsdsFluid += deltaBondedEsds

    // Account funds will freeze on a later epoch now
    let previousFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoFluidUntilEpoch)
    previousFundsToBeFrozen.daoStagedEsdFluidToFrozen -= addressInfo.daoStagedEsd
    previousFundsToBeFrozen.daoBondedEsdsFluidToFrozen -= addressInfo.daoBondedEsds
    previousFundsToBeFrozen.save()
  } else if(previousAccountStatus == "frozen") {
    // Account funds move from frozen to fluid
    currentEpochSnapshot.daoStagedEsdFrozen -= addressInfo.daoStagedEsd
    currentEpochSnapshot.daoBondedEsdsFrozen -= addressInfo.daoBondedEsds
    currentEpochSnapshot.daoStagedEsdFluid += (addressInfo.daoStagedEsd + deltaStagedEsd)
    currentEpochSnapshot.daoBondedEsdsFluid += (addressInfo.daoBondedEsds + deltaBondedEsds)
  } else {
    log.error(
      "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}", 
      [block.number.toString(), addressInfo.id, currentEpoch.toString()]
    )
  }

  // Staged/Bonded status: Delta staged goes from bonded esd to staged esd
  currentEpochSnapshot.daoStagedEsdTotal += deltaStagedEsd
  currentEpochSnapshot.daoBondedEsdTotal -= deltaStagedEsd
  addressInfo.daoStagedEsd += deltaStagedEsd

  // Delta ESDS get minted as totalBonded
  addressInfo.daoBondedEsds += deltaBondedEsds
  currentEpochSnapshot.daoBondedEsdsTotal += deltaBondedEsds

  // Funds are now fluid. Will become frozen after lockup period
  addressInfo.daoFluidUntilEpoch = fluidUntilEpoch
  let fundsToBeFrozen = fundsToBeFrozenForEpoch(fluidUntilEpoch)
  fundsToBeFrozen.daoStagedEsdFluidToFrozen += addressInfo.daoStagedEsd
  fundsToBeFrozen.daoBondedEsdsFluidToFrozen += addressInfo.daoBondedEsds
  fundsToBeFrozen.save()

  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleDaoVote(event: DaoVote): void {
  let voteAddress = event.params.account
  let voteCandidate = event.params.candidate
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

  log.warning(
    "[{}]: handling vote for candidate {} start {} period {} new locked {}",
    [event.block.number.toString(), voteCandidate.toHexString(), candidateStart.toString(), candidatePeriod.toString(), newDaoLockedUntilEpoch.toString()]
  )

  if(newDaoLockedUntilEpoch > addressInfo.daoLockedUntilEpoch) {
    let daoStatus = addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch)
    if(daoStatus == 'locked') {
      // Funds were locked until a previous Epoch
      let oldFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
      oldFundsToBeFrozen.daoStagedEsdLockedToFrozen -= addressInfo.daoStagedEsd
      oldFundsToBeFrozen.daoBondedEsdsLockedToFrozen -= addressInfo.daoBondedEsds
      oldFundsToBeFrozen.save()
    } else if(daoStatus == 'fluid') {
      // Funds were fluid now they are locked
      let oldFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoFluidUntilEpoch)
      oldFundsToBeFrozen.daoStagedEsdFluidToFrozen -= addressInfo.daoStagedEsd
      oldFundsToBeFrozen.daoBondedEsdsFluidToFrozen -= addressInfo.daoBondedEsds
      oldFundsToBeFrozen.save()
    }

    let newFundsToBeFrozen = fundsToBeFrozenForEpoch(newDaoLockedUntilEpoch)
    newFundsToBeFrozen.daoStagedEsdLockedToFrozen += addressInfo.daoStagedEsd
    newFundsToBeFrozen.daoBondedEsdsLockedToFrozen += addressInfo.daoBondedEsds
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

  let newRedeemable = event.params.newRedeemable
  let newBonded = event.params.newBonded
  currentEpochSnapshot = impApplyBondedSupply(currentEpochSnapshot, newRedeemable, newBonded, event.block)
  currentEpochSnapshot.save()
}

export function handleDaoSupplyNeutral(event: DaoSupplyNeutral): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot.oraclePrice = BigInt.fromI32(1).pow(18)
  currentEpochSnapshot.save()
}

export function handleDaoCouponExpiration(event: DaoCouponExpiration): void {
  let newBonded = event.params.newBonded
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot = impApplyCouponExpirationSupply(currentEpochSnapshot, newBonded, event.block)
  currentEpochSnapshot.save()
}

/*
 *** ORACLE POOL
 */

export function handleLpDeposit(event: LpDeposit): void {
  let depositAmount = event.params.value
  let depositAddress = event.params.account
  if(depositAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(depositAddress, event.block, 'Deposit')
    if(addressInfo == null) {
      log.error(
        '[{}]: Got deposit from previously non existing address {}',
        [event.block.number.toString(), depositAddress.toHexString()]
      )
      return
    }
    applyLpDepositDelta(addressInfo, depositAmount, event.block)
  }
}

export function handleLpWithdraw(event: LpWithdraw): void {
  let withdrawAmount = event.params.value
  let withdrawAddress = event.params.account
  if(withdrawAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(withdrawAddress, event.block, 'Withdraw')
    let deltaStagedUniV2 = withdrawAmount.neg()
    applyDaoDepositDelta(addressInfo, deltaStagedUniV2, event.block)
  }
}

// Apply Lp Withdraw/Deposit from account represented by AddressInfo
// Positive deltaStagedUniV2 amount means Deposit, Negative amount means Withdraw
function applyLpDepositDelta(addressInfo: AddressInfo, deltaStagedUniV2: BigInt, block: ethereum.Block): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()

  currentEpochSnapshot.lpStagedUniV2Total += deltaStagedUniV2
  addressInfo.lpStagedUniV2 += deltaStagedUniV2
  let accountStatus = addressInfoLpStatus(addressInfo, currentEpochSnapshot.epoch)
  if (accountStatus == "fluid") {
    log.error(
      "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}",
      [block.number.toString(), addressInfo.id, currentEpochSnapshot.epoch.toString()]
    )
  } else {
    currentEpochSnapshot.lpStagedUniV2Frozen += deltaStagedUniV2
  }
  currentEpochSnapshot.save()
  addressInfo.save()
}


export function handleLpBond(event: LpBond): void {
  let account = event.params.account
  let deltaStagedUniV2 = event.params.value.neg()
  if(deltaStagedUniV2 < BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(account, event.block, 'Bond')
    applyLpBondingDeltas(addressInfo, deltaStagedUniV2, BI_ZERO, event.block)
  }
}

export function handleLpUnbond(event: LpUnbond): void {
  let account = event.params.account
  let deltaStagedUniV2 = event.params.value.neg()
  let newClaimableEsd = event.params.newClaimable
  if(deltaStagedUniV2 > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(account, event.block, 'Unbond')
    applyLpBondingDeltas(addressInfo, deltaStagedUniV2, newClaimableEsd, event.block)
  }
}

// Apply Lp Bond/Unbond from account represented by AddressInfo
function applyLpBondingDeltas(addressInfo: AddressInfo, deltaStagedUniV2: BigInt, newClaimableEsd: BigInt, block: ethereum.Block): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let currentEpoch = currentEpochSnapshot.epoch

  let previousAccountStatus = addressInfoLpStatus(addressInfo, currentEpoch)
  let fluidUntilEpoch = currentEpoch + impLpExitLockupEpochs(block)

  // Frozen/Fluid status: all account dao funds get (or stay) fluid
  // Modify aggregated values accordingly
  if(previousAccountStatus == 'fluid') {
    // Account funds stay fluid
    currentEpochSnapshot.lpStagedUniV2Fluid += deltaStagedUniV2
    currentEpochSnapshot.lpBondedUniV2Fluid -= deltaStagedUniV2

    // Account funds will freeze on a later epoch now
    let previousFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.lpFluidUntilEpoch)
    previousFundsToBeFrozen.lpStagedUniV2FluidToFrozen -= addressInfo.lpStagedUniV2
    previousFundsToBeFrozen.lpBondedUniV2FluidToFrozen -= addressInfo.lpBondedUniV2
    previousFundsToBeFrozen.lpClaimableEsdFluidToFrozen -= addressInfo.lpClaimableEsd
    previousFundsToBeFrozen.save()
  } else if(previousAccountStatus == "frozen") {
    // Account funds move from frozen to fluid
    currentEpochSnapshot.lpStagedUniV2Frozen -= addressInfo.lpStagedUniV2
    currentEpochSnapshot.lpBondedUniV2Frozen -= addressInfo.lpBondedUniV2
    currentEpochSnapshot.lpClaimableEsdFrozen -= addressInfo.lpClaimableEsd
    currentEpochSnapshot.lpStagedUniV2Fluid += (addressInfo.lpStagedUniV2 + deltaStagedUniV2)
    currentEpochSnapshot.lpBondedUniV2Fluid += (addressInfo.lpBondedUniV2 - deltaStagedUniV2)
    currentEpochSnapshot.lpClaimableEsdFluid += (addressInfo.lpClaimableEsd + newClaimableEsd)
  } else {
    log.error(
      "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}", 
      [block.number.toString(), addressInfo.id, currentEpoch.toString()]
    )
  }

  // Staged/Bonded status
  currentEpochSnapshot.lpStagedUniV2Total += deltaStagedUniV2
  currentEpochSnapshot.lpBondedUniV2Total -= deltaStagedUniV2
  addressInfo.lpStagedUniV2 += deltaStagedUniV2
  addressInfo.lpBondedUniV2 -= deltaStagedUniV2

  // Claimable Status
  addressInfo.lpClaimableEsd += newClaimableEsd
  currentEpochSnapshot.lpClaimableEsdTotal += newClaimableEsd
  // Rewarded = pool balance - total claimable
  currentEpochSnapshot.lpRewardedEsdTotal -= newClaimableEsd

  // Funds are now fluid. Will become frozen after lockup period
  addressInfo.lpFluidUntilEpoch = fluidUntilEpoch
  let fundsToBeFrozen = fundsToBeFrozenForEpoch(fluidUntilEpoch)
  fundsToBeFrozen.lpStagedUniV2FluidToFrozen += addressInfo.lpStagedUniV2
  fundsToBeFrozen.lpBondedUniV2FluidToFrozen += addressInfo.lpBondedUniV2
  fundsToBeFrozen.lpBondedUniV2FluidToFrozen += addressInfo.lpClaimableEsd
  fundsToBeFrozen.save()

  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleLpClaim(event: LpClaim): void {
  let account = event.params.account
  let value = event.params.value
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let addressInfo = mustLoadAddressInfo(account, event.block, 'Claim')

  addressInfo.lpClaimableEsd -= value
  currentEpochSnapshot.lpClaimableEsdTotal -= value
  // Only frozen
  currentEpochSnapshot.lpClaimableEsdFrozen -= value

  currentEpochSnapshot.save()
  addressInfo.save()
}

export function handleLpProvide(event: LpProvide): void {
  let account = event.params.account
  let value = event.params.newUniv2
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  let addressInfo = mustLoadAddressInfo(account, event.block, 'Provide')

  addressInfo.lpBondedUniV2 += 
  currentEpochSnapshot.lpBondedUniV2Total += value
  // Only frozen
  currentEpochSnapshot.lpBondedUniV2Frozen += value
  
  currentEpochSnapshot.save()
  addressInfo.save()
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
    epochSnapshot.block = BigInt.fromI32(10722554)

    epochSnapshot.expiredCoupons = BigInt.fromI32(0)
    epochSnapshot.outstandingCoupons = BigInt.fromI32(0)
    epochSnapshot.couponsExpiration = BigInt.fromI32(0)
    epochSnapshot.oraclePrice = BigInt.fromI32(0)
    epochSnapshot.bootstrappingAt = false

    epochSnapshot.daoBondedEsdTotal = BigInt.fromI32(0)
    epochSnapshot.daoBondedEsdsTotal = BigInt.fromI32(0)
    epochSnapshot.daoBondedEsdsFrozen = BigInt.fromI32(0)
    epochSnapshot.daoBondedEsdsFluid = BigInt.fromI32(0)
    epochSnapshot.daoBondedEsdsLocked = BigInt.fromI32(0)

    epochSnapshot.daoStagedEsdTotal = BigInt.fromI32(0)
    epochSnapshot.daoStagedEsdFrozen = BigInt.fromI32(0)
    epochSnapshot.daoStagedEsdFluid = BigInt.fromI32(0)
    epochSnapshot.daoStagedEsdLocked = BigInt.fromI32(0)

    epochSnapshot.lpBondedUniV2Total = BigInt.fromI32(0)
    epochSnapshot.lpBondedUniV2Frozen = BigInt.fromI32(0)
    epochSnapshot.lpBondedUniV2Fluid = BigInt.fromI32(0)

    epochSnapshot.lpStagedUniV2Total = BigInt.fromI32(0)
    epochSnapshot.lpStagedUniV2Frozen = BigInt.fromI32(0)
    epochSnapshot.lpStagedUniV2Fluid = BigInt.fromI32(0)

    epochSnapshot.lpClaimableEsdTotal = BigInt.fromI32(0)
    epochSnapshot.lpClaimableEsdFrozen = BigInt.fromI32(0)
    epochSnapshot.lpClaimableEsdFluid = BigInt.fromI32(0)

    epochSnapshot.lpRewardedEsdTotal = BigInt.fromI32(0)
  }

  return <EpochSnapshot>epochSnapshot
}

function epochSnapshotCopyCurrent(currentEpochSnapshot: EpochSnapshot): void {
  let epochSnapshot = new EpochSnapshot(currentEpochSnapshot.epoch.toString())
  epochSnapshot.epoch = currentEpochSnapshot.epoch
  epochSnapshot.timestamp = currentEpochSnapshot.timestamp
  epochSnapshot.block = currentEpochSnapshot.block

  epochSnapshot.expiredCoupons = currentEpochSnapshot.expiredCoupons
  epochSnapshot.outstandingCoupons = currentEpochSnapshot.outstandingCoupons
  epochSnapshot.couponsExpiration = currentEpochSnapshot.couponsExpiration
  epochSnapshot.oraclePrice = currentEpochSnapshot.oraclePrice
  epochSnapshot.bootstrappingAt = currentEpochSnapshot.bootstrappingAt

  epochSnapshot.daoBondedEsdTotal = currentEpochSnapshot.daoBondedEsdTotal
  epochSnapshot.daoBondedEsdsTotal = currentEpochSnapshot.daoBondedEsdsTotal
  epochSnapshot.daoBondedEsdsFrozen = currentEpochSnapshot.daoBondedEsdsFrozen
  epochSnapshot.daoBondedEsdsFluid = currentEpochSnapshot.daoBondedEsdsFluid
  epochSnapshot.daoBondedEsdsLocked = currentEpochSnapshot.daoBondedEsdsLocked

  epochSnapshot.daoStagedEsdTotal = currentEpochSnapshot.daoStagedEsdTotal
  epochSnapshot.daoStagedEsdFrozen = currentEpochSnapshot.daoStagedEsdFrozen
  epochSnapshot.daoStagedEsdFluid = currentEpochSnapshot.daoStagedEsdFluid
  epochSnapshot.daoStagedEsdLocked = currentEpochSnapshot.daoStagedEsdLocked

  epochSnapshot.lpBondedUniV2Total = currentEpochSnapshot.lpBondedUniV2Total
  epochSnapshot.lpBondedUniV2Frozen = currentEpochSnapshot.lpBondedUniV2Frozen
  epochSnapshot.lpBondedUniV2Fluid = currentEpochSnapshot.lpBondedUniV2Fluid

  epochSnapshot.lpStagedUniV2Total = currentEpochSnapshot.lpStagedUniV2Total
  epochSnapshot.lpStagedUniV2Frozen = currentEpochSnapshot.lpStagedUniV2Frozen
  epochSnapshot.lpStagedUniV2Fluid = currentEpochSnapshot.lpStagedUniV2Fluid

  epochSnapshot.lpClaimableEsdTotal = currentEpochSnapshot.lpClaimableEsdTotal
  epochSnapshot.lpClaimableEsdFrozen = currentEpochSnapshot.lpClaimableEsdFrozen
  epochSnapshot.lpClaimableEsdFluid = currentEpochSnapshot.lpClaimableEsdFluid

  epochSnapshot.lpRewardedEsdTotal = currentEpochSnapshot.lpRewardedEsdTotal

  epochSnapshot.save()
}

function fundsToBeFrozenForEpoch(epoch: BigInt): FundsToBeFrozen {
  let fundsToBeFrozen = FundsToBeFrozen.load(epoch.toString())

  if(fundsToBeFrozen == null) {
    fundsToBeFrozen = new FundsToBeFrozen(epoch.toString())
    fundsToBeFrozen.epoch = epoch
    fundsToBeFrozen.daoStagedEsdFluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoStagedEsdLockedToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoBondedEsdsFluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.daoBondedEsdsLockedToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.lpStagedUniV2FluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.lpBondedUniV2FluidToFrozen = BigInt.fromI32(0)
    fundsToBeFrozen.lpClaimableEsdFluidToFrozen = BigInt.fromI32(0)
  }

  return <FundsToBeFrozen>fundsToBeFrozen
}

function addressInfoNew(id: string): AddressInfo {
  let addressInfo = new AddressInfo(id) 

  addressInfo.esdBalance = BigInt.fromI32(0)
  addressInfo.uniV2Balance = BigInt.fromI32(0)

  addressInfo.daoBondedEsds = BigInt.fromI32(0)
  addressInfo.daoStagedEsd = BigInt.fromI32(0)
  addressInfo.daoLockedUntilEpoch = BigInt.fromI32(0)
  addressInfo.daoFluidUntilEpoch = BigInt.fromI32(0)

  addressInfo.lpBondedUniV2 = BigInt.fromI32(0)
  addressInfo.lpStagedUniV2 = BigInt.fromI32(0)
  addressInfo.lpClaimableEsd = BigInt.fromI32(0)
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

function addressInfoLpStatus(addressInfo: AddressInfo, epoch: BigInt): string {
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
