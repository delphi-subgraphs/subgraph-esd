# ESD Beta
TheGraph subgraph to get ESD data

Data can be queried in the subgraph by Epoch. The id field is the epoch number
All monetary values are given in 10^18 

## Fields
Fields that can be queried for each epoch:
  * id: Epoch number

The totals at the start of each epoch:
  * startTotalBonded
  * startTotalStaged
  * startTotalDebt
  * startTotalRedeemable
  * startTotalCoupons
  * startTotalNet

Block data for when the epoch was started (someone made the advance() call the contract requires:
  * startTimestamp
  * startBlock

Coupon data that reflects the state for the coupons emitted during that epoch:
  * expiredCoupons:  total expired coupons that where purchased during the epoch.
  * outstandingCoupons: total outstanding coupons that were emitted during the epoch 
  * couponsExpiration: expiration epoch for the coupons emitted during the epoch

Data about the supply variation and the price of the oracle
  * oraclePrice: oraclePrice consulted at the beginning of the epoch
  * deltaSupply: Supply variation for the epoch (In response to oracle price)

Misc:
  * bootstrappingAt: Boolean Whether the epoch is from the bootstrapping period or not
