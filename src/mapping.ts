import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts"

import { 
  EpochSnapshot, 
  EsdSupplyHistory,
  LpTokenHistory
} from './../generated/schema';

import { 
  DollarContract ,
  Transfer as DollarTransfer
} from "../generated/DAOContract/DollarContract"

import {
  DaoContract,
  Advance as DaoAdvance,
  Deposit as DaoDeposit,
  Withdraw as DaoWithdraw,
  Bond as DaoBond  
  Unbond as DaoUnbond,
  CouponExpiration as DaoCouponExpiration,
  CouponPurchase as DaoCouponPurchase,
  CouponRedemption as DaoCouponRedemption,
  SupplyDecrease as DaoSupplyDecrease,
  SupplyIncrease as DaoSupplyIncrease,
  SupplyNeutral as DaoSupplyNeutral,
  Vote as DaoVote
} from './../generated/DAOContract/Contract';

import {
  LPContract,
  Bond as LPBond,
  Unbond as LPUnbond,
  Provide
} from "../generated/DAOContract/LPContract"

import UniswapV2PairContract from "../generated/DAOContract/UniswapV2PairContract"

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
handleDollarTransfer(event: DollarTransfer): void {
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
          transferFrom.toHexString()
          transferAmount.toString()
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
      toAddressInfo = new AddressInfo(transferTo.toHexString)
      toAddressInfo.esdBalance = 0
    }

    toAddressInfo.esdBalance += transferAmount
  }
}


/*
 *** DAO
 */
export function handleDaoAdvance(event: Advance): void {
  // set epoch timestamp
  let epoch = event.params.epoch
  let epochSnapshot = new EpochSnapshot(epoch.toString())
  epochSnapshot.epoch = epoch
  epochSnapshot.timestamp = event.params.timestamp
  epochSnapshot.save()

  // Fill in balances for history entities
  // Values at the end of the epoch (begining of the next one) are taken
  if(epoch > BigInt.fromI32(1)) {
    let historyEpoch =  epoch - 1

    let dollarContract = DollarContract.bind(ContractAddresses.esdDollar)
    let totalSupplyEsd = dollarContract.totalSupply()
    let totalLpEsd = dollarContract.balanceOf(ContractAddresses.uniswapPair)
    let totalDaoEsd = dollarContract.balanceOf(ContractAddresses.esdDao);
    let esdSupplyHistory = new EsdSupplyHistory(historyEpoch.toString())
    esdSupplyHistory.epoch = historyEpoch
    esdSupplyHistory.daoLockedTotal = totalDaoEsd 
    esdSupplyHistory.lpLockedTotal = totalDaoEsd 
    esdSupplyHistory.totalSupply = totalSuplyEsd

    let uniswapContract = UniswapV2PairContract.bind(ContractAddresses.uniswapPair)
    let totalLpTokens = uniswapContract.totalSupply()
    let lpTokenHistory = new lpTokenHistory(historyEpoch.toString())
    lpTokenHistory.epoch = historyEpoch
    lpTokenHistory.totalSuppy = totalLpTokens
  }
}

export function daoHandleBond(event: Bond): void {
}

export function handleCouponExpiration(event: CouponExpiration): void {
  let epochId = event.params.epoch.toString()
  let epoch = new Epoch(epochId)
  epoch.outstandingCoupons = BigInt.fromI32(0)
  epoch.expiredCoupons = event.params.couponsExpired
  epoch.save()


  let stats = getStats(event.params.epoch, "dao", "bonded")
  stats.frozen = stats.frozen.plus(event.params.newBonded);
  stats.save();  

  // @TODO: Add to EpochSnapshots LP Epoch Stats

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

  let lpStats = getStats(event.params.epoch, "lp", "bonded")
  lpStats.total = contract.totalBonded()
  lpStats.frozen = lpStats.frozen.plus(poolAmount) // somehow not working upon epoch 214
  lpStats.frozen = lpStats.total.minus(lpStats.fluid).minus(lpStats.locked) // quickfix
  lpStats.delta = lpStats.total - lpStats.frozen - lpStats.fluid - lpStats.locked
  stats.save();
  
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
  // Basically can only withdraw frozen
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
    // should not occur because of onlyFluidOrFrozen modifier
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
    // should not occur because of onlyFluidOrFrozen modifier
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
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()
  let lpContract = LPContract.bind(event.address);
  let balanceStaged = getStats(epoch, "lp", "staged")
  balanceStaged.fluid = balanceStaged.fluid.plus(event.params.value);
  balanceStaged.total =  getStagedLP(event.address)
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
  if(balanceStaged.delta != BigInt.fromI32(0)) {
    log.warning("deposit staged delta unequal epoch {}", [epoch.toString()])
  }
}

export function handleWithdrawLP(event: Withdraw): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let epoch = contract.epoch()
  let lpContract = LPContract.bind(event.address);

  let balanceStaged = getStats(epoch, "lp", "staged")

  // @TODO: fluid or frozen? -> check user status
  if(balanceStaged.frozen >= event.params.value) {
    balanceStaged.frozen = balanceStaged.frozen.minus(event.params.value);
  } else {
    balanceStaged.fluid = balanceStaged.fluid.minus(event.params.value);
  }
  
  balanceStaged.total = getStagedLP(event.address)
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
  if(balanceStaged.delta != BigInt.fromI32(0)) {
    log.warning("withdraw staged delta unequal epoch {}", [epoch.toString()])
  }
}

export function handleBondLP(event: LPBond): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let lpContract = LPContract.bind(event.address);
  let epoch = contract.epoch()
  let epochId = epoch.toString()


  // incrementTotalBonded(value);
  let balanceBonded = getStats(epoch, "lp", "bonded")
  balanceBonded.fluid = balanceBonded.fluid.plus(event.params.value);
  balanceBonded.total = getBondedLP(event.address)
  balanceBonded.delta = balanceBonded.total - balanceBonded.frozen - balanceBonded.fluid - balanceBonded.locked
  balanceBonded.save();
  if(balanceBonded.delta != BigInt.fromI32(0)) {
    log.warning("bond bonded delta unequal epoch {}", [epoch.toString()])
  }


  // decrementBalanceOfStaged(msg.sender, value, "Bonding: insufficient staged balance");
  let balanceStaged = getStats(epoch, "lp", "staged")
  // can bond on fluid or/and frozen
  let status = lpContract.statusOf(event.params.account) // 0 = Frozen, 1 = Fluid, 2 = Locked
  if(BigInt.fromI32(0).equals(BigInt.fromI32(status))) { // Frozen
    balanceStaged.frozen = balanceStaged.frozen.minus(event.params.value);
  } else if(BigInt.fromI32(1).equals(BigInt.fromI32(status))) { // Fluid
    // can be partially fluid and frozen
    if(balanceStaged.fluid >= event.params.value) {
      balanceStaged.fluid = balanceStaged.fluid.minus(event.params.value);
    } else {
      // cant say at this moment how much is frozen and fluid, therefore set fluid to zero and take rest from frozen
      let diff = event.params.value.minus(balanceStaged.fluid);
      balanceStaged.fluid = BigInt.fromI32(0);
      balanceStaged.frozen = balanceStaged.frozen.minus(diff);
    }
  } else { // locked
    // should not occur because of onlyFluidOrFrozen modifier
  }

  balanceStaged.total = getStagedLP(event.address)
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
  if(balanceStaged.delta != BigInt.fromI32(0)) {
    log.warning("bond staged delta unequal epoch {}", [epoch.toString()])
  }
}

export function handleUnbondLP(event: LPUnbond): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let lpContract = LPContract.bind(event.address);
  let epoch = contract.epoch()
  let epochId = epoch.toString()
  
  // decrementTotalBonded(staged, "Bonding: insufficient total bonded");
  let balanceBonded = getStats(epoch, "lp", "bonded")
   // use fluid if not enough frozen (because you can bond whether you are in frozen or fluid state)
   // depends on user state @TODO add accountinfo
  let statusOfUser = lpContract.statusOf(event.params.account)
  if(BigInt.fromI32(0).equals(BigInt.fromI32(statusOfUser))) { // Frozen
      balanceBonded.frozen = balanceBonded.frozen.minus(event.params.value);
  } else if(BigInt.fromI32(1).equals(BigInt.fromI32(statusOfUser))) { // Fluid
    if (balanceBonded.fluid >= event.params.value) {
      balanceBonded.fluid = balanceBonded.fluid.minus(event.params.value);
    } else {
      // cant say at this moment how much is frozen and fluid, therefore set fluid to zero and take rest from frozen
      let diff = event.params.value.minus(balanceBonded.fluid);
      balanceBonded.fluid = BigInt.fromI32(0);
      balanceBonded.frozen = balanceBonded.frozen.minus(diff);
    }
  } else { // Locked
    // should not occur because of onlyFluidOrFrozen modifier
  }
  
  balanceBonded.total = getBondedLP(event.address)
  balanceBonded.delta = balanceBonded.total - (balanceBonded.frozen + balanceBonded.fluid + balanceBonded.locked)
  balanceBonded.save();
  if(balanceBonded.delta != BigInt.fromI32(0)) {
    log.warning("unbond bonded delta unequal epoch {}", [epoch.toString()])
  }

  // incrementBalanceOfStaged(msg.sender, staged);
  let balanceStaged = getStats(epoch, "lp", "staged")
  balanceStaged.fluid = balanceStaged.fluid.plus(event.params.value);
  balanceStaged.total = getStagedLP(event.address)
  balanceStaged.delta = balanceStaged.total - balanceStaged.frozen - balanceStaged.fluid - balanceStaged.locked
  balanceStaged.save();
  if(balanceStaged.delta != BigInt.fromI32(0)) {
    log.warning("unbond staged delta unequal epoch {}", [epoch.toString()])
  }
}

export function handleVoteLP(event: Vote): void {
  // let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  // let epoch = contract.epoch()
  // log.warning("Handle Vote lp of {} with {} bonded at epoch {}", [event.params.account.toHexString(), event.params.bonded.toString(), epoch.toString()]);
}

/**
 * incrementBalanceOfBonded(msg.sender, newUniv2);
 * @param event 
 */
export function handleProvideLP(event: Provide): void {
  let contract = Contract.bind(DOLLAR_DAO_CONTRACT)
  let lpContract = LPContract.bind(event.address);
  let epoch = contract.epoch()
  let balanceBonded = getStats(epoch, "lp", "bonded")
  balanceBonded.fluid = balanceBonded.fluid.plus(event.params.newUniv2);
  balanceBonded.total = lpContract.totalBonded()
  balanceBonded.delta = balanceBonded.total - (balanceBonded.frozen + balanceBonded.fluid + balanceBonded.locked)
  balanceBonded.save()
}


