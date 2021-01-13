import { Deposit, Unbond, Withdraw,   Contract,
  Advance,
  CouponExpiration,
  CouponPurchase,
  CouponRedemption,
  SupplyDecrease,
  SupplyIncrease,
  SupplyNeutral,
  Vote,
  Bond } from './../generated/DAOContract/Contract';
import { EpochSnapshot, DAOBalance, BalanceStats, LPBalance } from './../generated/schema';
import { BigInt, Address } from "@graphprotocol/graph-ts"

import {
  LPContract,
} from "../generated/DAOContract/LPContract"
import {
  DollarContract,
} from "../generated/DAOContract/DollarContract"
import {
  UniswapV2PairContract,
} from "../generated/DAOContract/UniswapV2PairContract"
import { Epoch, LpTokenHistory, EsdSupplyHistory } from "../generated/schema"
import { log } from '@graphprotocol/graph-ts'

// epochs needed to expire the coupons
let COUPON_EXPIRATION = BigInt.fromI32(90)

// Uniswap Pool
let UNISWAP_PAIR_CONTRACT_ADDRESS = Address.fromString('0x88ff79eb2bc5850f27315415da8685282c7610f9')

// Dollar ERC20 Contract
let DOLLAR_CONTRACT_ADDRESS = Address.fromString('36F3FD68E7325a35EB768F1AedaAe9EA0689d723')

// Dollar DAO Contract
let DOLLAR_DAO_CONTRACT = Address.fromString('443D2f2755DB5942601fa062Cc248aAA153313D3');

export function handleAdvance(event: Advance): void {
  let epochId = event.params.epoch.toString()

  // init new Epoch
  let epoch = new Epoch(epochId);

  // set meta data
  epoch.startTimestamp = event.params.timestamp
  epoch.startBlock = event.params.block
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  epoch.startDAOTotalBonded = contract.totalBonded()
  epoch.startDAOTotalStaged = contract.totalStaged()
  epoch.startTotalDebt = contract.totalDebt()
  epoch.startTotalRedeemable = contract.totalRedeemable()
  epoch.startTotalCoupons = contract.totalCoupons()
  epoch.startTotalNet = contract.totalNet()
  epoch.bootstrappingAt = contract.bootstrappingAt(event.params.epoch)
  epoch.couponsExpiration = event.params.epoch + COUPON_EXPIRATION

  let poolStakingAddress = contract.pool() 

  let startLPTotalBondedTokens = BigInt.fromI32(0)
  let startLPTotalStagedTokens = BigInt.fromI32(0)
  if(poolStakingAddress) {
    let lpContract = LPContract.bind(poolStakingAddress)
    startLPTotalBondedTokens = lpContract.totalBonded()
    startLPTotalStagedTokens = lpContract.totalStaged()
  }

  let dollarContract = DollarContract.bind(DOLLAR_CONTRACT_ADDRESS)
  let startTotalLPESD = dollarContract.balanceOf(UNISWAP_PAIR_CONTRACT_ADDRESS)
  let totalSupplyESD = dollarContract.totalSupply()
  let startTotalDAOESD = dollarContract.balanceOf(DOLLAR_DAO_CONTRACT);

  let uniswapContract = UniswapV2PairContract.bind(UNISWAP_PAIR_CONTRACT_ADDRESS)
  let startTotalLPTokens = uniswapContract.totalSupply()

  if(startTotalLPTokens > BigInt.fromI32(0)) {
    epoch.startLPTotalBondedESD = (startLPTotalBondedTokens * startTotalLPESD) / startTotalLPTokens
    epoch.startLPTotalStagedESD = (startLPTotalStagedTokens * startTotalLPESD) / startTotalLPTokens

  }

  epoch.startLPTotalStagedTokens = startLPTotalStagedTokens
  epoch.startLPTotalBondedTokens = startLPTotalBondedTokens
  epoch.startTotalLPTokens = startTotalLPTokens
  epoch.startTotalLPESD = startTotalLPESD
  epoch.save()

  // get history for previous epoch
  if(event.params.epoch.toString() != "1") {
    let previousEpoch = event.params.epoch.minus(BigInt.fromI32(1));
    let tokenhistory = new LpTokenHistory(previousEpoch.toString())
    tokenhistory.epoch = previousEpoch.toString()
    tokenhistory.id = previousEpoch.toString()
    tokenhistory.totalStaged = startLPTotalStagedTokens
    tokenhistory.totalBonded = startLPTotalBondedTokens
    tokenhistory.totalSupply = startTotalLPTokens
    tokenhistory.save()
  
    let esdSupplyHistory = new EsdSupplyHistory(previousEpoch.toString())
    esdSupplyHistory.epoch = previousEpoch.toString()
    esdSupplyHistory.id = previousEpoch.toString()
    esdSupplyHistory.totalSupply = totalSupplyESD
    esdSupplyHistory.lockedViaLP = startTotalLPESD
    esdSupplyHistory.lockedViaDAO = startTotalDAOESD
    esdSupplyHistory.save()
  }
  // Init Stats for new Epoch
  let bondedDAO = getStats(event.params.epoch, "dao", "bonded");
  bondedDAO.total = contract.totalBonded();

  // Switch Locked to Frozen after 9 Epochs
  if(event.params.epoch.gt(BigInt.fromI32(9)) && bondedDAO.locked.gt(BigInt.fromI32(0))) {
    let lockedStats1 = BalanceStats.load("dao-" + event.params.epoch.minus(BigInt.fromI32(10)).toString() + "-bonded");
    let lockedStats2 = BalanceStats.load("dao-" + event.params.epoch.minus(BigInt.fromI32(9)).toString() + "-bonded");
    let diff = lockedStats2.locked.minus(lockedStats1.locked)
    bondedDAO.locked = bondedDAO.locked.minus(diff)
    bondedDAO.frozen = bondedDAO.frozen.plus(diff)
  }

  bondedDAO.save()
  let stagedDAO = getStats(event.params.epoch, "dao", "staged");
  stagedDAO.total = contract.totalStaged();
  stagedDAO.save()
  let bondedLP = getStats(event.params.epoch, "lp", "bonded");
  let stagedLP = getStats(event.params.epoch, "lp", "staged");

  // Create Datamodell based on Schema
  let daoBalance = new DAOBalance(epochId);
  daoBalance.id = epochId;
  daoBalance.bonded = "dao-" + epochId + "-bonded";
  daoBalance.staged = "dao-" + epochId + "-staged";
  daoBalance.save();

  // init epoch new snapshot
  let epochSnapShots = new EpochSnapshot(epochId);
  epochSnapShots.id = epochId
  epochSnapShots.epoch = event.params.epoch;
  epochSnapShots.timestamp = event.params.timestamp;
  epochSnapShots.dao = epochId;
  epochSnapShots.save();
}

/**
 * increaseSupply(lessRedeemable);
 * @param event 
 */
export function handleCouponExpiration(event: CouponExpiration): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.outstandingCoupons = BigInt.fromI32(0)
  epoch.expiredCoupons = event.params.couponsExpired
  epoch.save()


  let stats = getStats(event.params.epoch, "dao", "bonded")
  stats.frozen = stats.frozen.plus(event.params.newBonded);
  stats.save();  

  // 

}

/**
 * burnFromAccount(msg.sender, dollarAmount);
 * @param event 
 */
export function handleCouponPurchase(event: CouponPurchase): void {
  let epochId = event.params.epoch.toString()
  let epoch = Epoch.load(epochId)
  if (epoch == null) {
    epoch = new Epoch(epochId)
  }

  let couponAmount = event.params.couponAmount
  epoch.outstandingCoupons = epoch.outstandingCoupons + couponAmount
  epoch.save()

  // Burns ESD but not ESDS... So nothing changes?

}

/**
 * redeemToAccount(msg.sender, couponAmount);
 * @param event 
 */
export function handleCouponRedemption(event: CouponRedemption): void {
  let epochId = event.params.epoch.toString()
  let epoch = Epoch.load(epochId)
  if (epoch == null) {
    epoch = new Epoch(epochId)
  }
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)

  
  let couponAmount = event.params.couponAmount
  epoch.outstandingCoupons = epoch.outstandingCoupons - couponAmount
  epoch.save()

  // // + staged ? 
  // let stats = getStats(event.params.epoch, "dao", "staged")
  // stats.frozen = stats.frozen + couponAmount;
  // stats.total = contract.totalStaged()
  // stats.delta = stats.total - stats.frozen - stats.fluid - stats.locked
  // stats.save();
}

export function handleSupplyDecrease(event: SupplyDecrease): void {
  let epochId = event.params.epoch.toString()
  let multiplier = 95;
  if(event.params.epoch.gt(BigInt.fromI32(86))) {
    multiplier = 20;
  }
  let epoch = new Epoch(epochId)
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  epoch.oraclePrice = event.params.price
  epoch.deltaSupply = -event.params.newDebt
  epoch.save()

  // do nothing?
}

export function handleSupplyIncrease(event: SupplyIncrease): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)

  epoch.oraclePrice = event.params.price
  epoch.deltaSupply = event.params.newRedeemable + event.params.lessDebt + event.params.newBonded
  epoch.save()

  // 5% minted to Pool (20% if epoch > 86)
  let multiplier = event.params.epoch.gt(BigInt.fromI32(86)) ? BigInt.fromI32(20) : BigInt.fromI32(5);
  let poolAmount = event.params.newBonded.times(multiplier).div(BigInt.fromI32(100)) // 20%

  // 2.5% is minted to treasury if epoch > 213
  let treasuryAmount = event.params.epoch.gt(BigInt.fromI32(213)) ? event.params.newBonded.times(BigInt.fromI32(250)).div(BigInt.fromI32(10000)) : BigInt.fromI32(0)  
  
  // rest is minted to dao
  let daoAmount = event.params.newBonded.minus(poolAmount).minus(treasuryAmount);
  
  let stats = getStats(event.params.epoch, "dao", "bonded")
  stats.total = contract.totalBonded()
  stats.frozen = stats.frozen.plus(daoAmount) // somehow not working upon epoch 214
  stats.frozen = stats.total.minus(stats.fluid).minus(stats.locked) // quickfix
  stats.delta = stats.total - stats.frozen - stats.fluid - stats.locked
  stats.save();

  // @TODO add poolamount to LP
  
}

export function handleSupplyNeutral(event: SupplyNeutral): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.oraclePrice = BigInt.fromI32(1).pow(18)
  epoch.deltaSupply = BigInt.fromI32(0)
  epoch.save()

  // do nothing?
}

/**
 * incrementBalanceOfStaged(msg.sender, value);
 * @param event 
 */
export function handleDeposit(event: Deposit): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()

  let balanceStaged = getStats(epoch, "dao", "staged")
  balanceStaged.fluid = balanceStaged.fluid.plus(event.params.value);
  balanceStaged.total =  contract.totalStaged()
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
}

/**
 * decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
 */
export function handleWithdraw(event: Withdraw): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()
  let epochId = epoch.toString()
  let balanceStaged = getStats(epoch, "dao", "staged")

  // @TODO: fluid or frozen? -> check user status
  if(balanceStaged.frozen >= event.params.value) {
    balanceStaged.frozen = balanceStaged.frozen.minus(event.params.value);
  } else {
    balanceStaged.fluid = balanceStaged.fluid.minus(event.params.value);
  }
  
  balanceStaged.total = contract.totalStaged()
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
}

/**
 * incrementBalanceOf(msg.sender, balance);
 * incrementTotalBonded(value);
 * decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
 * @param event 
 */
export function handleBond(event: Bond): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()
  let epochId = epoch.toString()
  // incrementTotalBonded(value);
  let balanceBonded = getStats(epoch, "dao", "bonded")
  balanceBonded.fluid = balanceBonded.fluid.plus(event.params.valueUnderlying);
  balanceBonded.total = contract.totalBonded()
  balanceBonded.delta = balanceBonded.total - balanceBonded.frozen - balanceBonded.fluid - balanceBonded.locked
  balanceBonded.save();

  // decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
  let balanceStaged = getStats(epoch, "dao", "staged")

  // can bond on fluid or/and frozen
  let status = contract.statusOf(event.params.account) // 0 = Frozen, 1 = Fluid, 2 = Locked
  if(BigInt.fromI32(0).equals(BigInt.fromI32(status))) { // Frozen
    balanceStaged.frozen = balanceStaged.frozen.minus(event.params.valueUnderlying);
  } else if(BigInt.fromI32(1).equals(BigInt.fromI32(status))) { // Fluid
    // can be partially fluid and frozen
    if(balanceStaged.fluid >= event.params.valueUnderlying) {
      balanceStaged.fluid = balanceStaged.fluid.minus(event.params.valueUnderlying);
    } else {
      // cant say at this moment how much is frozen and fluid, therefore set fluid to zero and take rest from frozen
      let diff = event.params.valueUnderlying.minus(balanceStaged.fluid);
      balanceStaged.fluid = BigInt.fromI32(0);
      balanceStaged.frozen = balanceStaged.frozen.minus(diff);
    }
  } else { // locked
    // log.warning("bond locked at epoch {}", [epochId])
  }

  balanceStaged.total = contract.totalStaged()
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
}

/**
 *  incrementBalanceOfStaged(msg.sender, staged);
 *  decrementTotalBonded(staged, "Bonding: insufficient total bonded");
 * @param event 
 */
export function handleUnbond(event: Unbond): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()
  let epochId = epoch.toString()
  
  // decrementTotalBonded(staged, "Bonding: insufficient total bonded");
  let balanceBonded = getStats(epoch, "dao", "bonded")
   // use fluid if not enough frozen (because you can bond whether you are in frozen or fluid state)
   // depends on user state @TODO add accountinfo
  let statusOfUser = contract.statusOf(event.params.account)
  let bondedOfUser = contract.balanceOfBonded(event.params.account)
  if(BigInt.fromI32(0).equals(BigInt.fromI32(statusOfUser))) { // Frozen
      balanceBonded.frozen = balanceBonded.frozen.minus(event.params.valueUnderlying);
  } else if(BigInt.fromI32(1).equals(BigInt.fromI32(statusOfUser))) { // Fluid
    if (balanceBonded.fluid >= event.params.valueUnderlying) {
      balanceBonded.fluid = balanceBonded.fluid.minus(event.params.valueUnderlying);
    } else {
      // cant say at this moment how much is frozen and fluid, therefore set fluid to zero and take rest from frozen
      let diff = event.params.valueUnderlying.minus(balanceBonded.fluid);
      balanceBonded.fluid = BigInt.fromI32(0);
      balanceBonded.frozen = balanceBonded.frozen.minus(diff);
    }
  } else { // Locked
    log.warning("unbond locked at epoch {}", [epochId])
  }
  
  balanceBonded.total = contract.totalBonded()
  balanceBonded.delta = balanceBonded.total - (balanceBonded.frozen + balanceBonded.fluid + balanceBonded.locked)
  balanceBonded.save();

  // incrementBalanceOfStaged(msg.sender, staged);
  let balanceStaged = getStats(epoch, "dao", "staged")
  balanceStaged.fluid = balanceStaged.fluid.plus(event.params.valueUnderlying);
  balanceStaged.total = contract.totalStaged()
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
}

/**
 * Move Funds from Fluid or Frozen to Locked (Staged or Bonded)
 * @param event 
 */
export function handleVote(event: Vote): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()

  let balanceBonded = getStats(epoch, "dao", "bonded")
  let balanceStaged = getStats(epoch, "dao", "staged")
  let dollarContract = DollarContract.bind(DOLLAR_CONTRACT_ADDRESS)
  let daoESD = dollarContract.balanceOf(DOLLAR_DAO_CONTRACT)
  let underlyingBonded = daoESD.times(event.params.bonded).div(contract.totalSupply())

  // can be frozen, fluid (bonded and staged)
  let accountBonded = contract.balanceOfBonded(event.params.account)
  let accountStaged = contract.balanceOfStaged(event.params.account)

  // let diff = accountStaged - accountBonded
  // if(diff > 0) {
  //   balanceStaged.frozen = balanceStaged.fro
  // }
  
  balanceBonded.frozen = balanceBonded.frozen.minus(accountBonded);
  balanceBonded.locked = balanceBonded.locked.plus(accountBonded);

  
  balanceBonded.total = contract.totalBonded()
  balanceBonded.delta = balanceBonded.total - (balanceBonded.locked + balanceBonded.fluid + balanceBonded.frozen)
  // balanceBonded.save()
}

export function handleDepositLP(event: Deposit): void {
  // let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  // let epoch = contract.epoch()
  // let lpContract = LPContract.bind(event.address);
  // let balance = BalanceStats.load("lp-" + epoch.toString() + "-staged")
  // balance.frozen = balance.frozen.plus(event.params.value);
  // balance.total = lpContract.totalStaged()
  // balance.save();
  // log.warning("Handled deposit lp of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.value.toString(), epoch.toString()]);
}

export function handleBondLP(event: Bond): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let lpContract = LPContract.bind(event.address);
  // let epoch = contract.epoch()
  // let balanceStaged = BalanceStats.load("lp-" + epoch.toString() + "-staged");
  // balanceStaged.frozen = event.params.valueUnderlying
  // balanceStaged.total = contract.totalStaged()
  // balanceStaged.save();

  // let id = "lp-" + epoch.toString() + "-bonded"
  // let balance = BalanceStats.load(id);
  // balance.frozen = balance.frozen.plus(event.params.valueUnderlying);
  // balance.total = contract.totalBonded()
  // balance.id = id
  // balance.save();
  // log.warning("Handled bond lp of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.valueUnderlying.toString(), epoch.toString()]);
}

export function handleUnbondLP(event: Unbond): void {
  // let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  // let epoch = contract.epoch()
  // let balanceBonded = BalanceStats.load("lp-" + epoch.toString() + "-bonded");
  // balanceBonded.total = contract.totalBonded()
  // // Fluid / Frozen?

  // let balanceStaged = BalanceStats.load("lp-" + epoch.toString() + "-staged");
  // balanceStaged.total = contract.totalStaged()
  // balanceStaged.frozen = balanceStaged.frozen.plus(event.params.valueUnderlying)

  // balanceStaged.save();
  // log.warning("Handled unbond lp of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.valueUnderlying.toString(), epoch.toString()]);
  // // let balance = BalanceStats.load("lp-" + epoch.toString() + "-staged");
  // // balance.frozen.plus(event.params.value);
  // // balance.total = contract.totalStaged();
  // // balance.save();
}

export function handleVoteLP(event: Vote): void {
  // let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  // let epoch = contract.epoch()
  // log.warning("Handle Vote lp of {} with {} bonded at epoch {}", [event.params.account.toHexString(), event.params.bonded.toString(), epoch.toString()]);
}

export function handleWithdrawLP(event: Withdraw): void {
  // let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  // let epoch = contract.epoch()
  // log.warning("Handle Withdraw lp of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.value.toString(), epoch.toString()]);
}

export function getStats(epoch: BigInt, cat: string, event: string): BalanceStats | null {
  let stats = BalanceStats.load(cat + "-" +epoch.toString() + "-" + event);
  if(stats == null) {
    stats = new BalanceStats(cat + "-" +epoch.toString() + "-" + event);
  
    // Start with 0 on First Epoch
    if(epoch.toString() == "1") {
      stats.total = BigInt.fromI32(0);
      stats.frozen = BigInt.fromI32(0);
      stats.fluid = BigInt.fromI32(0);
      stats.locked = BigInt.fromI32(0);
      stats.delta = BigInt.fromI32(0);
      stats.save();
      return stats;
    }

    // @TODO: lock = previousLock - lockFromEpoch-9

    // move Fluid to Frozen on new Epoch
    let previousStats = BalanceStats.load(cat + "-" + epoch.minus(BigInt.fromI32(1)).toString() + "-" + event);
    stats.total = previousStats.total
    stats.frozen = previousStats.frozen.plus(previousStats.fluid)
    stats.fluid = BigInt.fromI32(0)
    stats.locked = previousStats.locked

    stats.delta = stats.total - (stats.frozen + stats.fluid + stats.locked)
    stats.save();
  }
  
  return stats;
}