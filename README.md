# Empty Set Dollar
The dollar protocol is operated by a DAO that governs and operates the supply of its stablecoin ESD, a fully decentralized self-stabilizing dollar.

## Terminologies

**Bonding** - Bonding is the act of locking your ESD token in the Empty Set Dollar DAO / LP tokens in the pool contract, to gain benefits such as voting or rewards.

**Staging** - Tokens must pass through a staging phase when entering the DAO or the pool contract. When the tokens are staged they will be available to bond. This state is used to control the deposit and withdrawal of tokens. 

**Epoch** - Dollar's DAO splits time into distinct `epochs` of roughly 8 hours (28,800 Seconds) to simplify logic around governance, supply regulation, and flash loan resistance. Users are allowed to interact with the DAO by bonding or unbonding ESD or LP just once per epoch.

**Coupons** - Coupons are offered by the protocol as an incentive to voluntarily burn ESD. The amount of ESD burned multiplied by the premium are issued in place of the burned ESD via coupons. When the money supply grows again the coupon holder may redeem their coupon for ESD at a one-to-one ratio. 

## Networks and Performance
This subgraph can be found on The Graph Hosted Service at [https://thegraph.com/explorer/subgraph/cryptowhaler/ufmsvxjvx](https://thegraph.com/explorer/subgraph/cryptowhaler/ufmsvxjvx). All monetary values are given in 10^18 


You can also run this subgraph locally, if you wish. Instructions for that can be found in The Graph Documentation.

## Getting started with querying
Below are some of the queries supported by the Subgraph. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the querying api.

The following query returns the protocol state for a particular `epoch`. The returned paramters are briefly described below - 

 - epoch : The epoch number 
 - expiringCoupons : Number of coupons that expire during the current Epoch
 - couponsExpiration : Epoch when the Coupons emitted during the target epoch will expire.
 - oraclePrice : The price taken from the Uniswap price oracle at the start of the epoch.
 - daoBondedEsdTotal : ESD balance bonded at the end of the epoch 
 - daoBondedEsdsTotal : ESDS balance bonded at the end of the epoch
 - daoBondedEsdsFrozen : ESDS balance frozen at the end of the epoch
 - daoBondedEsdsFluid : ESDS balance fluid at the end of the epoch
 - daoBondedEsdsLocked : ESDS balance locked at the end of the epoch
 - daoStagedEsdTotal : ESD balance staged at the end of the epoch
 - daoStagedEsdFrozen : ESD balance frozen at the end of the epoch 
 - daoStagedEsdFluid : ESD balance fluid at the end of the epoch
 - daoStagedEsdFrozen : ESD balance frozen at the end of the epoch  
 - lpBondedUniV2Total : LP tokens (Uniswap pool) balance bonded at the end of the epoch 
 - lpBondedUniV2Frozen : LP tokens (Uniswap pool) balance frozen at the end of the epoch
 - lpBondedUniV2Fluid : LP tokens (Uniswap pool) balance fluid at the end of the epoch
 - lpStagedUniV2Total : Total Staged LP tokens balance bonded at the end of the epoch
 - lpStagedUniV2Frozen : Total Frozen Staged LP tokens balance bonded at the end of the epoch
 - lpStagedUniV2Fluid : Total Fluid Staged LP tokens balance bonded at the end of the epoch
 - lpClaimableEsdTotal : Total ESD tokens claimable by the LP token holders
 - lpClaimableEsdFrozen : Frozen ESD tokens claimable by the LP token holders
 - lpClaimableEsdFluid : Fluid ESD tokens claimable by the LP token holders
 - lpRewardedEsdTotal : Total ESD tokens rewarded to the LP holders


```
{
  epochSnapshots(first: 5) {
    id
    epoch
    timestamp
    block

    expiredCoupons
    couponsExpiration
    oraclePrice

    daoBondedEsdTotal 
    daoBondedEsdsTotal 

    daoBondedEsdsFrozen
    daoBondedEsdsFluid
    daoBondedEsdsLocked
    
    daoStagedEsdTotal 
    daoStagedEsdFrozen
    daoStagedEsdFluid
    daoStagedEsdFrozen 
    
    lpBondedUniV2Total
    lpBondedUniV2Frozen
    lpBondedUniV2Fluid
    
    lpStagedUniV2Total
    lpStagedUniV2Frozen
    lpStagedUniV2Fluid
    
    lpClaimableEsdTotal
    lpClaimableEsdFrozen
    lpClaimableEsdFluid
    lpRewardedEsdTotal
  }
}
```

The following query returns the funds that go back from locked/fluid to frozen on the target epoch. The parameters are briefly described below - 
  - epoch : The epoch number 
  - daoStagedEsdFluidToFrozen : ESD balance Staged that goes back from fluid to frozen state at the start of the epoch
  - daoStagedEsdLockedToFrozen : ESD balance Staged that goes back from locked to frozen state at the start of the epoch
  - daoBondedEsdsFluidToFrozen : Bonded ESDS balance that goes back from fluid to frozen state at the start of the epoch
  - daoBondedEsdsLockedToFrozen : Bonded ESDS balance that goes back from locked to frozen state at the start of the epoch
  - lpStagedUniV2FluidToFrozen : Staged LP tokens that goes back from fluid to frozen state at the start of the epoch
  - lpBondedUniV2FluidToFrozen : Bonded LP tokens that goes back from fluid to frozen state at the start of the epoch
  - lpClaimableEsdFluidToFrozen : Claimable ESD balance that goes back from fluid to frozen state at the start of the epoch

```
{
  fundsToBeFrozens(first: 5) {
    id
    epoch
    daoStagedEsdFluidToFrozen
    daoStagedEsdLockedToFrozen
    daoBondedEsdsFluidToFrozen
    daoBondedEsdsLockedToFrozen
    lpStagedUniV2FluidToFrozen
    lpBondedUniV2FluidToFrozen
    lpClaimableEsdFluidToFrozen    
  }
}
```

The following query returns the ESD supply history. The parameters are briefly described below - 
  - epoch : The epoch number 
  - daoLockedTotal : Total DAO tokens locked
  - lpLockedTotal : Total LP tokens locked
  - totalSupply : Total ESD supply

```
{
  esdSupplyHistories(first: 5) {
    id
    epoch
    daoLockedTotal
    lpLockedTotal
    totalSupply
  }
}
```

The following query returns the LP Token history. The parameters are briefly described below - 
  - epoch : The epoch number 
  - totalStaged : Total LP tokens staged at the end of the epoch
  - totalBonded : Total LP tokens bonded at the end of the epoch
  - totalSupply : LP tokens total supply

```
{
  lpUniV2TokenHistories(first: 5) {
    id
    epoch
    totalStaged
    totalBonded
    totalSupply
  }
}
```
The following query returns the current balances for user address. The parameters are briefly described below - 
  - id : The epoch number 
  - esdBalance : ESD token balance
  - uniV2Balance : LP tokens balance
  - daoBondedEsds : Bonded tokens balance
  - daoStagedEsd : Staged tokens balance
  - daoLockedUntilEpoch : Balance locked 
  - daoFluidUntilEpoch : Balance fluid
  - lpBondedUniV2 : LP tokens currently bonded
  - lpStagedUniV2 : LP tokens currently staged
  - lpClaimableEsd : LP tokens currently claimable
  - lpFluidUntilEpoch : LP tokens fluid

```
{
  addressInfos(first: 5) {
    id
    esdBalance
    uniV2Balance
    daoBondedEsds
    daoStagedEsd
    daoLockedUntilEpoch
    daoFluidUntilEpoch
    lpBondedUniV2
    lpStagedUniV2
    lpClaimableEsd
    lpFluidUntilEpoch
  }
}
```


## Contract Events Mapped by the SubGraph
SubGraph currently listens to the following events to update the state of the indexed data.

#### UpgradeableContract
        - Upgraded(indexed address) 

#### UniswapV2PairContract
        - Transfer(indexed address,indexed address,uint256)

#### DollarContract
        - Transfer(indexed address,indexed address,uint256)

#### DaoContract
        - Advance(indexed uint256,uint256,uint256)
        - Deposit(indexed address,uint256)
        - Withdraw(indexed address,uint256)
        - Bond(indexed address,uint256,uint256,uint256)
        - Unbond(indexed address,uint256,uint256,uint256)
        - Vote(indexed address,indexed address,uint8,uint256)
        - StabilityReward(indexed uint256,uint256,uint256)
        - SupplyDecrease(indexed uint256,uint256,uint256)
        - SupplyIncrease(indexed uint256,uint256,uint256,uint256,uint256)
        - SupplyNeutral(indexed uint256)
        - CouponExpiration(indexed uint256,uint256,uint256,uint256,uint256)

#### LpContract
        - Deposit(indexed address,uint256)
        - Withdraw(indexed address,uint256)
        - Provide(indexed address,uint256,uint256,uint256)
        - Bond(indexed address,uint256,uint256)
        - Unbond(indexed address,uint256,uint256,uint256)
        - Claim(indexed address,uint256)


## Contract Upgrades
The subgraph has been kept in sync with the development of ESD.
