// Provides values that vary from implementation to implementation that
// cannot be retrieved through public getters
import {BigInt, ethereum} from "@graphprotocol/graph-ts"

// https://github.com/emptysetsquad/dollar/pull/9
// https://etherscan.io/address/0x4202ffe860a2b77225d446bafb8e346e054da361
let PROPOSAL9_BLOCK = BigInt.fromI32(11250300)

// Epochs that an account gets frozen after being fluid because of bond/unbond
export function getDaoExitLockupEpochs(block: ethereum.Block): BigInt {
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
    return BigInt.fromI32(15)
  }
}

