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
  Upgraded as UpgradeableUpgraded
} from '../generated/UpgradeableContract/UpgradeableContract'

import {
	UniswapV2PairContract,
	Transfer as UniswapV2PairTransfer,
} from '../generated/UniswapV2PairContract/UniswapV2PairContract'

import { 
  DollarContract,
  Transfer as DollarTransfer
} from '../generated/DaoContract/DollarContract'


// Dao Contract
import {
  DaoContract,
  Advance as DaoAdvance,
  Deposit as DaoDeposit,
  Withdraw as DaoWithdraw,
  Bond as DaoBond,  
  Unbond as DaoUnbond,
  Vote as DaoVote,
  StabilityReward as DaoStabilityReward,
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

import { 
  UniswapV2PairContract as DaoCallUniswapV2PairContract
} from '../generated/DaoContract/UniswapV2PairContract'

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
    log.info( "[{}]: Creating new pool contract for address [{}]",[event.block.number.toString(), currentPool.toHexString()])
    meta.lpAddress = currentPool.toHexString()
    meta.save()
    TemplateLpContract.create(currentPool)
  }
}

/*
 *** UNISWAPV2 PAIR
 */
export function handleUniswapV2PairTransfer(event: UniswapV2PairTransfer): void {
  let transferFrom = event.params.from
  let transferTo = event.params.to
  let transferAmount = event.params.value

  // Deduct amount from sender
  if(transferFrom.toHexString() != ADDRESS_ZERO_HEX && transferAmount > BI_ZERO) {
    let fromAddressInfo = mustLoadAddressInfo(transferFrom, event.block, 'Transfer')
    if (fromAddressInfo.uniV2Balance < transferAmount) {
      log.error('[{}]: Got transfer from address {} with insuficient funds value is {} balance is {}',
        [event.block.number.toString(),transferFrom.toHexString(),transferAmount.toString(),fromAddressInfo.uniV2Balance.toString() ])
    }
    fromAddressInfo.uniV2Balance -= transferAmount
    fromAddressInfo.save()
  }

  // Add amount to receiver
  if(transferTo.toHexString() != ADDRESS_ZERO_HEX && transferAmount > BI_ZERO) {
    let toAddressInfo = AddressInfo.load(transferTo.toHexString())
    if (toAddressInfo == null) {
      toAddressInfo = addressInfoNew(transferTo.toHexString())
    }
    toAddressInfo.uniV2Balance += transferAmount
    toAddressInfo.save()
  }
}

/*
 *** DOLLAR
 */
export function handleDollarTransfer(event: DollarTransfer): void {
  let transferFrom = event.params.from
  let transferTo = event.params.to
  let transferAmount = event.params.value

  // Deduct amount from sender
  if(transferFrom.toHexString() != ADDRESS_ZERO_HEX && transferAmount > BI_ZERO) {
    let fromAddressInfo = mustLoadAddressInfo(transferFrom, event.block, 'Transfer')
    if (fromAddressInfo.esdBalance < transferAmount) {
      log.error('[{}]: Got transfer from address {} with insuficient funds value is {} balance is {}',
        [event.block.number.toString(),transferFrom.toHexString(),transferAmount.toString(),fromAddressInfo.esdBalance.toString()]
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

  // Deduct from lp transfer amounts from rewarded
  if(transferFrom == ADDRESS_ESD_LP1 || transferFrom == ADDRESS_ESD_LP2 || transferFrom == ADDRESS_ESD_LP3 || transferFrom == ADDRESS_ESD_LP4) {
    let currentEpoch = epochSnapshotGetCurrent()
    currentEpoch.lpRewardedEsdTotal -= transferAmount
    currentEpoch.save()
  }

  // Add to lp transfer amounts to rewarded
  if(transferTo == ADDRESS_ESD_LP1 || transferTo == ADDRESS_ESD_LP2 || transferTo == ADDRESS_ESD_LP3 || transferTo == ADDRESS_ESD_LP4) {
    let currentEpoch = epochSnapshotGetCurrent()
    currentEpoch.lpRewardedEsdTotal += transferAmount
    currentEpoch.save()
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

  currentEpochSnapshot.daoStagedEsdFluid -= fundsToBeFrozen.daoStagedEsdFluidToFrozen
  currentEpochSnapshot.daoStagedEsdLocked -= fundsToBeFrozen.daoStagedEsdLockedToFrozen
  currentEpochSnapshot.daoStagedEsdFrozen += (fundsToBeFrozen.daoStagedEsdFluidToFrozen + fundsToBeFrozen.daoStagedEsdLockedToFrozen)

  currentEpochSnapshot.daoBondedEsdsFluid -= fundsToBeFrozen.daoBondedEsdsFluidToFrozen
  currentEpochSnapshot.daoBondedEsdsLocked -= fundsToBeFrozen.daoBondedEsdsLockedToFrozen
  currentEpochSnapshot.daoBondedEsdsFrozen += (fundsToBeFrozen.daoBondedEsdsFluidToFrozen + fundsToBeFrozen.daoBondedEsdsLockedToFrozen)

  currentEpochSnapshot.lpStagedUniV2Fluid -= fundsToBeFrozen.lpStagedUniV2FluidToFrozen
  currentEpochSnapshot.lpStagedUniV2Frozen += fundsToBeFrozen.lpStagedUniV2FluidToFrozen

  currentEpochSnapshot.lpBondedUniV2Fluid -= fundsToBeFrozen.lpBondedUniV2FluidToFrozen
  currentEpochSnapshot.lpBondedUniV2Frozen += fundsToBeFrozen.lpBondedUniV2FluidToFrozen

  currentEpochSnapshot.lpClaimableEsdFluid -= fundsToBeFrozen.lpClaimableEsdFluidToFrozen
  currentEpochSnapshot.lpClaimableEsdFrozen += fundsToBeFrozen.lpClaimableEsdFluidToFrozen

  let daoContract = DaoContract.bind(ADDRESS_ESD_DAO)
  currentEpochSnapshot.expiredCoupons = daoContract.couponsExpiration(epoch)

  // Fill in balances for history entities
  // Values at the end of the epoch (begining of the next one) are taken
  // TODO(elfedy): maybe we can have "current" entities here too
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
    let uniswapContract = DaoCallUniswapV2PairContract.bind(ADDRESS_UNISWAP_PAIR)
    let totalLpUniV2 = uniswapContract.totalSupply()
    let totalLpBonded = BigInt.fromI32(0)
    let totalLpStaged = BigInt.fromI32(0)
    let lpContractAddress = daoContract.pool()
    let totalDaoBondedEsd = daoContract.totalBonded()
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

  currentEpochSnapshot.save()
}

export function handleDaoDeposit(event: DaoDeposit): void {
  let depositAmount = event.params.value
  let depositAddress = event.params.account
  if(depositAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(depositAddress, event.block, 'Deposit')
    if(addressInfo == null) {
      log.error('[{}]: Got deposit from previously non existing address {}',[event.block.number.toString(), depositAddress.toHexString()])
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

    let fundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
    fundsToBeFrozen.daoStagedEsdLockedToFrozen += deltaStagedEsd
    fundsToBeFrozen.save()
  } else {
    currentEpochSnapshot.daoStagedEsdFrozen += deltaStagedEsd
  }

  if (accountStatus == "fluid") {
    log.error( "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}",
     [block.number.toString(), addressInfo.id, currentEpochSnapshot.epoch.toString()])
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
  } 
  else if(previousAccountStatus == "frozen") {
    // Account funds move from frozen to fluid
    currentEpochSnapshot.daoStagedEsdFrozen -= addressInfo.daoStagedEsd
    currentEpochSnapshot.daoBondedEsdsFrozen -= addressInfo.daoBondedEsds
    currentEpochSnapshot.daoStagedEsdFluid += (addressInfo.daoStagedEsd + deltaStagedEsd)
    currentEpochSnapshot.daoBondedEsdsFluid += (addressInfo.daoBondedEsds + deltaBondedEsds)
  } 
  else {
    log.error("[{}]: Got Bond/Unbond event on locked status for address {} at epoch {}", 
      [block.number.toString(), addressInfo.id, currentEpoch.toString()])
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

  // NOTE(elfedy): Event does not have the lockup period, so need to call
  // the contract to calculate. Could just use lockedUntil but it was
  // added late in the contract so not sure how that behaves on early blocks
  let daoContract = DaoContract.bind(event.address)
  let candidateStart = daoContract.startFor(voteCandidate)
  let candidatePeriod = daoContract.periodFor(voteCandidate)
  let newDaoLockedUntilEpoch = candidateStart + candidatePeriod

  let daoStatus = addressInfoDaoStatus(addressInfo, currentEpochSnapshot.epoch)
  if(daoStatus == 'locked') {
    if(newDaoLockedUntilEpoch > addressInfo.daoLockedUntilEpoch) {
      // Funds were locked until a previous Epoch
      let oldFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
      oldFundsToBeFrozen.daoStagedEsdLockedToFrozen -= addressInfo.daoStagedEsd
      oldFundsToBeFrozen.daoBondedEsdsLockedToFrozen -= addressInfo.daoBondedEsds
      oldFundsToBeFrozen.save()
    }
  } else {
    // Funds were frozen, now they are locked
    currentEpochSnapshot.daoStagedEsdFrozen -= addressInfo.daoStagedEsd
    currentEpochSnapshot.daoBondedEsdsFrozen -= addressInfo.daoBondedEsds
    currentEpochSnapshot.daoStagedEsdLocked += addressInfo.daoStagedEsd
    currentEpochSnapshot.daoBondedEsdsLocked += addressInfo.daoBondedEsds
    currentEpochSnapshot.save()
  }

  if(daoStatus == 'fluid') {
    log.warning("[{}]: Got Vote event on fluid status for address {} at epoch {}, daoFluidUnitlEpoch {}, daoLockedUntilEpoch {}",
      [event.block.number.toString(), addressInfo.id, currentEpochSnapshot.epoch.toString(), addressInfo.daoFluidUntilEpoch.toString(), addressInfo.daoLockedUntilEpoch.toString()])
  }

  if(newDaoLockedUntilEpoch > addressInfo.daoLockedUntilEpoch) {
    // Funds will be locked until new Epoch
    addressInfo.daoLockedUntilEpoch = newDaoLockedUntilEpoch
    let newFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.daoLockedUntilEpoch)
    newFundsToBeFrozen.daoStagedEsdLockedToFrozen += addressInfo.daoStagedEsd
    newFundsToBeFrozen.daoBondedEsdsLockedToFrozen += addressInfo.daoBondedEsds

    newFundsToBeFrozen.save()
    addressInfo.save()
  }
}

// Since proposal 17: 0xda7780d1bcccf32ac50da8956f9acead5a507576
// Block: 11725853
// https://github.com/emptysetsquad/dollar/pull/19
export function handleDaoStabilityReward(event: DaoStabilityReward): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()
  currentEpochSnapshot.daoBondedEsdTotal += event.params.amount
  currentEpochSnapshot.save()
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
    applyLpDepositDelta(addressInfo, depositAmount, event.block, event.address)
  }
}

export function handleLpWithdraw(event: LpWithdraw): void {
  let withdrawAmount = event.params.value
  let withdrawAddress = event.params.account
  if(withdrawAmount > BI_ZERO) {
    let addressInfo = mustLoadAddressInfo(withdrawAddress, event.block, 'Withdraw')
    let deltaStagedUniV2 = withdrawAmount.neg()
    applyLpDepositDelta(addressInfo, deltaStagedUniV2, event.block, event.address)
  }
}

// Apply Lp Withdraw/Deposit from account represented by AddressInfo
// Positive deltaStagedUniV2 amount means Deposit, Negative amount means Withdraw
function applyLpDepositDelta(addressInfo: AddressInfo, deltaStagedUniV2: BigInt, block: ethereum.Block, targetPoolAddress: Address): void {
  let currentEpochSnapshot = epochSnapshotGetCurrent()

  currentEpochSnapshot.lpStagedUniV2Total += deltaStagedUniV2
  addressInfo.lpStagedUniV2 += deltaStagedUniV2
  let accountStatus = addressInfoLpStatus(addressInfo, currentEpochSnapshot.epoch)
  if (accountStatus == 'fluid') {
    let meta = Meta.load('current')
    log.warning(
      "[{}]: Got Withdraw/Deposit event on fluid status for address {} at epoch {}, lpFluidUnitlEpoch {}, currentPool {}, targetPool {}",
      [block.number.toString(), addressInfo.id, currentEpochSnapshot.epoch.toString(), addressInfo.lpFluidUntilEpoch.toString(), meta.lpAddress, targetPoolAddress.toHexString()]
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
  let deltaStagedUniV2 = event.params.value
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
    currentEpochSnapshot.lpClaimableEsdFluid += newClaimableEsd

    // Account funds will freeze on a later epoch now
    let previousFundsToBeFrozen = fundsToBeFrozenForEpoch(addressInfo.lpFluidUntilEpoch)
    previousFundsToBeFrozen.lpStagedUniV2FluidToFrozen -= addressInfo.lpStagedUniV2
    previousFundsToBeFrozen.lpBondedUniV2FluidToFrozen -= addressInfo.lpBondedUniV2
    previousFundsToBeFrozen.lpClaimableEsdFluidToFrozen -= addressInfo.lpClaimableEsd
    previousFundsToBeFrozen.save()
  } else {
    // Account funds move from frozen to fluid
    currentEpochSnapshot.lpStagedUniV2Frozen -= addressInfo.lpStagedUniV2
    currentEpochSnapshot.lpBondedUniV2Frozen -= addressInfo.lpBondedUniV2
    currentEpochSnapshot.lpClaimableEsdFrozen -= addressInfo.lpClaimableEsd
    currentEpochSnapshot.lpStagedUniV2Fluid += (addressInfo.lpStagedUniV2 + deltaStagedUniV2)
    currentEpochSnapshot.lpBondedUniV2Fluid += (addressInfo.lpBondedUniV2 - deltaStagedUniV2)
    currentEpochSnapshot.lpClaimableEsdFluid += (addressInfo.lpClaimableEsd + newClaimableEsd)
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
  fundsToBeFrozen.lpClaimableEsdFluidToFrozen += addressInfo.lpClaimableEsd

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
  // Rewarded = pool balance - total claimable. This should compensate when
  // The erc20 transfer event is processed
  currentEpochSnapshot.lpRewardedEsdTotal += value

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

  addressInfo.lpBondedUniV2 += value
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
    epochSnapshot.couponsExpiration = BigInt.fromI32(0)
    epochSnapshot.oraclePrice = BigInt.fromI32(0)

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
  epochSnapshot.couponsExpiration = currentEpochSnapshot.couponsExpiration
  epochSnapshot.oraclePrice = currentEpochSnapshot.oraclePrice

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
  if(addressInfo.lpFluidUntilEpoch > epoch) {
    return 'fluid'
  }
  return 'frozen'
}

function mustLoadAddressInfo(address: Address, block: ethereum.Block, operation: String): AddressInfo {
  let addressInfo = AddressInfo.load(address.toHexString())
  if(addressInfo == null) {
    log.error('[{}]: Got {} from previously non existing address {}',[block.number.toString(), operation, address.toHexString()])
  }
  return <AddressInfo>addressInfo
}
