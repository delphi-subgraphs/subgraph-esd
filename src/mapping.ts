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

  // load previous stats / if epoch == 1 set everything to zero
  log.warning("Handle Advance with Epoch {}", [epochId]);

  // Init Stats for new Epoch
  let bonded = initStats(event.params.epoch, "bonded");
  bonded.save();

  let staged = initStats(event.params.epoch, "staged");
  staged.save();

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

export function handleCouponExpiration(event: CouponExpiration): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.outstandingCoupons = BigInt.fromI32(0)
  epoch.expiredCoupons = event.params.couponsExpired
  epoch.save()
}

export function handleCouponPurchase(event: CouponPurchase): void {
  let epochId = event.params.epoch.toString()
  let epoch = Epoch.load(epochId)
  if (epoch == null) {
    epoch = new Epoch(epochId)
  }
  
  let couponAmount = event.params.couponAmount
  epoch.outstandingCoupons = epoch.outstandingCoupons + couponAmount
  epoch.save()
}

export function handleCouponRedemption(event: CouponRedemption): void {
  let epochId = event.params.epoch.toString()
  let epoch = Epoch.load(epochId)
  if (epoch == null) {
    epoch = new Epoch(epochId)
  }
  
  let couponAmount = event.params.couponAmount
  epoch.outstandingCoupons = epoch.outstandingCoupons - couponAmount
  epoch.save()
}

export function handleSupplyDecrease(event: SupplyDecrease): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.oraclePrice = event.params.price
  epoch.deltaSupply = -event.params.newDebt
  epoch.save()
}

export function handleSupplyIncrease(event: SupplyIncrease): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.oraclePrice = event.params.price
  epoch.deltaSupply = event.params.newRedeemable + event.params.lessDebt + event.params.newBonded
  epoch.save()
}

export function handleSupplyNeutral(event: SupplyNeutral): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.oraclePrice = BigInt.fromI32(1).pow(18)
  epoch.deltaSupply = BigInt.fromI32(0)
  epoch.save()
}

export function initStats(epoch: BigInt, event: string): BalanceStats {
  let stats = new BalanceStats("dao-" +epoch.toString() + "-" + event);
  log.warning("Init Stats for EPOCH {} {}", [epoch.toString(), event])
  
  // Start with 0 on First Epoch
  if(epoch.toString() == "1") {
    stats.total = BigInt.fromI32(0);
    stats.frozen = BigInt.fromI32(0);
    stats.fluid = BigInt.fromI32(0);
    stats.locked = BigInt.fromI32(0);
    return stats;
  }

  // move Fluid to Frozen on new Epoch
  let previousStats = BalanceStats.load("dao-" +epoch.minus(BigInt.fromI32(1)).toString() + "-" + event);
  stats.total = previousStats.total
  stats.frozen = previousStats.frozen.plus(previousStats.fluid);
  stats.fluid = BigInt.fromI32(0)
  stats.locked = BigInt.fromI32(0)
  return stats;
}

/**
 * incrementBalanceOfStaged(msg.sender, value);
 * @param event 
 */
export function handleDeposit(event: Deposit): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()

  log.warning("Handle deposit of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.value.toString(), epoch.toString()]);
  
  let balanceStaged = BalanceStats.load("dao-" + epoch.toString() + "-staged");
  balanceStaged.frozen = balanceStaged.frozen.plus(event.params.value);
  balanceStaged.total =  contract.totalStaged()
  balanceStaged.save();
}

/**
 * decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
 */
export function handleWithdraw(event: Withdraw): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()

  log.warning("Handle Withdraw of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.value.toString(), epoch.toString()]);
  let balanceStaged = BalanceStats.load("dao-" + epoch.toString() + "-staged");
  balanceStaged.frozen = balanceStaged.frozen.minus(event.params.value);
  balanceStaged.total = contract.totalStaged()
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

  log.warning("Handle bond of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.valueUnderlying.toString(), epoch.toString()]);
  
  // incrementTotalBonded(value);
  let balanceBonded = BalanceStats.load("dao-" + epoch.toString() + "-bonded");
  balanceBonded.fluid = balanceBonded.fluid.plus(event.params.valueUnderlying);
  balanceBonded.total = contract.totalBonded()
  balanceBonded.save();

  // decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
  let balanceStaged = BalanceStats.load("dao-" + epoch.toString() + "-staged");
  balanceStaged.frozen = balanceStaged.frozen.minus(event.params.valueUnderlying);
  balanceStaged.total = contract.totalStaged()
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

  log.warning("Handle bond of {} with {} Tokens at epoch {}", [event.params.account.toHexString(), event.params.valueUnderlying.toString(), epoch.toString()]);
  
  // decrementTotalBonded(staged, "Bonding: insufficient total bonded");
  let balanceBonded = BalanceStats.load("dao-" + epoch.toString() + "-bonded");
  balanceBonded.frozen = balanceBonded.frozen.minus(event.params.valueUnderlying);
  balanceBonded.total = contract.totalBonded()
  balanceBonded.save();

  // incrementBalanceOfStaged(msg.sender, staged);
  let balanceStaged = BalanceStats.load("dao-" + epoch.toString() + "-staged");
  balanceStaged.fluid = balanceStaged.fluid.plus(event.params.valueUnderlying);
  balanceStaged.total = contract.totalStaged()
  balanceStaged.save();
}

/**
 * Move Funds from Bonded-Frozen to Bonded-Locked
 * @param event 
 */
export function handleVote(event: Vote): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()

  log.warning("Handle Vote of {} with {} bonded at epoch {}", [event.params.account.toHexString(), event.params.bonded.toString(), epoch.toString()]);

  // let balanceBonded = BalanceStats.load("dao-" + epoch.toString() + "-bonded");
  // balanceBonded.frozen = balanceBonded.frozen.minus(event.params);
  // balanceBonded.locked = balanceBonded.locked.plus(event.params.bonded);
  // balanceBonded.save();
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