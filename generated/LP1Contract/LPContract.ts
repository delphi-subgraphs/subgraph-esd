// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class Bond extends ethereum.Event {
  get params(): Bond__Params {
    return new Bond__Params(this);
  }
}

export class Bond__Params {
  _event: Bond;

  constructor(event: Bond) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get start(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Claim extends ethereum.Event {
  get params(): Claim__Params {
    return new Claim__Params(this);
  }
}

export class Claim__Params {
  _event: Claim;

  constructor(event: Claim) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class Deposit extends ethereum.Event {
  get params(): Deposit__Params {
    return new Deposit__Params(this);
  }
}

export class Deposit__Params {
  _event: Deposit;

  constructor(event: Deposit) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class Provide extends ethereum.Event {
  get params(): Provide__Params {
    return new Provide__Params(this);
  }
}

export class Provide__Params {
  _event: Provide;

  constructor(event: Provide) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get lessUsdc(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get newUniv2(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Unbond extends ethereum.Event {
  get params(): Unbond__Params {
    return new Unbond__Params(this);
  }
}

export class Unbond__Params {
  _event: Unbond;

  constructor(event: Unbond) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get start(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get newClaimable(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Withdraw extends ethereum.Event {
  get params(): Withdraw__Params {
    return new Withdraw__Params(this);
  }
}

export class Withdraw__Params {
  _event: Withdraw;

  constructor(event: Withdraw) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class LPContract extends ethereum.SmartContract {
  static bind(address: Address): LPContract {
    return new LPContract("LPContract", address);
  }

  balanceOfBonded(account: Address): BigInt {
    let result = super.call(
      "balanceOfBonded",
      "balanceOfBonded(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_balanceOfBonded(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOfBonded",
      "balanceOfBonded(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  balanceOfClaimable(account: Address): BigInt {
    let result = super.call(
      "balanceOfClaimable",
      "balanceOfClaimable(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_balanceOfClaimable(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOfClaimable",
      "balanceOfClaimable(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  balanceOfPhantom(account: Address): BigInt {
    let result = super.call(
      "balanceOfPhantom",
      "balanceOfPhantom(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_balanceOfPhantom(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOfPhantom",
      "balanceOfPhantom(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  balanceOfRewarded(account: Address): BigInt {
    let result = super.call(
      "balanceOfRewarded",
      "balanceOfRewarded(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_balanceOfRewarded(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOfRewarded",
      "balanceOfRewarded(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  balanceOfStaged(account: Address): BigInt {
    let result = super.call(
      "balanceOfStaged",
      "balanceOfStaged(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_balanceOfStaged(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOfStaged",
      "balanceOfStaged(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  dao(): Address {
    let result = super.call("dao", "dao():(address)", []);

    return result[0].toAddress();
  }

  try_dao(): ethereum.CallResult<Address> {
    let result = super.tryCall("dao", "dao():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  dollar(): Address {
    let result = super.call("dollar", "dollar():(address)", []);

    return result[0].toAddress();
  }

  try_dollar(): ethereum.CallResult<Address> {
    let result = super.tryCall("dollar", "dollar():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  paused(): boolean {
    let result = super.call("paused", "paused():(bool)", []);

    return result[0].toBoolean();
  }

  try_paused(): ethereum.CallResult<boolean> {
    let result = super.tryCall("paused", "paused():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  statusOf(account: Address): i32 {
    let result = super.call("statusOf", "statusOf(address):(uint8)", [
      ethereum.Value.fromAddress(account)
    ]);

    return result[0].toI32();
  }

  try_statusOf(account: Address): ethereum.CallResult<i32> {
    let result = super.tryCall("statusOf", "statusOf(address):(uint8)", [
      ethereum.Value.fromAddress(account)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  totalBonded(): BigInt {
    let result = super.call("totalBonded", "totalBonded():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalBonded(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalBonded", "totalBonded():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  totalClaimable(): BigInt {
    let result = super.call("totalClaimable", "totalClaimable():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalClaimable(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "totalClaimable",
      "totalClaimable():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  totalPhantom(): BigInt {
    let result = super.call("totalPhantom", "totalPhantom():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalPhantom(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalPhantom", "totalPhantom():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  totalRewarded(): BigInt {
    let result = super.call("totalRewarded", "totalRewarded():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalRewarded(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "totalRewarded",
      "totalRewarded():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  totalStaged(): BigInt {
    let result = super.call("totalStaged", "totalStaged():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalStaged(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalStaged", "totalStaged():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  univ2(): Address {
    let result = super.call("univ2", "univ2():(address)", []);

    return result[0].toAddress();
  }

  try_univ2(): ethereum.CallResult<Address> {
    let result = super.tryCall("univ2", "univ2():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  usdc(): Address {
    let result = super.call("usdc", "usdc():(address)", []);

    return result[0].toAddress();
  }

  try_usdc(): ethereum.CallResult<Address> {
    let result = super.tryCall("usdc", "usdc():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class BondCall extends ethereum.Call {
  get inputs(): BondCall__Inputs {
    return new BondCall__Inputs(this);
  }

  get outputs(): BondCall__Outputs {
    return new BondCall__Outputs(this);
  }
}

export class BondCall__Inputs {
  _call: BondCall;

  constructor(call: BondCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class BondCall__Outputs {
  _call: BondCall;

  constructor(call: BondCall) {
    this._call = call;
  }
}

export class ClaimCall extends ethereum.Call {
  get inputs(): ClaimCall__Inputs {
    return new ClaimCall__Inputs(this);
  }

  get outputs(): ClaimCall__Outputs {
    return new ClaimCall__Outputs(this);
  }
}

export class ClaimCall__Inputs {
  _call: ClaimCall;

  constructor(call: ClaimCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class ClaimCall__Outputs {
  _call: ClaimCall;

  constructor(call: ClaimCall) {
    this._call = call;
  }
}

export class DepositCall extends ethereum.Call {
  get inputs(): DepositCall__Inputs {
    return new DepositCall__Inputs(this);
  }

  get outputs(): DepositCall__Outputs {
    return new DepositCall__Outputs(this);
  }
}

export class DepositCall__Inputs {
  _call: DepositCall;

  constructor(call: DepositCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class DepositCall__Outputs {
  _call: DepositCall;

  constructor(call: DepositCall) {
    this._call = call;
  }
}

export class EmergencyPauseCall extends ethereum.Call {
  get inputs(): EmergencyPauseCall__Inputs {
    return new EmergencyPauseCall__Inputs(this);
  }

  get outputs(): EmergencyPauseCall__Outputs {
    return new EmergencyPauseCall__Outputs(this);
  }
}

export class EmergencyPauseCall__Inputs {
  _call: EmergencyPauseCall;

  constructor(call: EmergencyPauseCall) {
    this._call = call;
  }
}

export class EmergencyPauseCall__Outputs {
  _call: EmergencyPauseCall;

  constructor(call: EmergencyPauseCall) {
    this._call = call;
  }
}

export class EmergencyWithdrawCall extends ethereum.Call {
  get inputs(): EmergencyWithdrawCall__Inputs {
    return new EmergencyWithdrawCall__Inputs(this);
  }

  get outputs(): EmergencyWithdrawCall__Outputs {
    return new EmergencyWithdrawCall__Outputs(this);
  }
}

export class EmergencyWithdrawCall__Inputs {
  _call: EmergencyWithdrawCall;

  constructor(call: EmergencyWithdrawCall) {
    this._call = call;
  }

  get token(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class EmergencyWithdrawCall__Outputs {
  _call: EmergencyWithdrawCall;

  constructor(call: EmergencyWithdrawCall) {
    this._call = call;
  }
}

export class ProvideCall extends ethereum.Call {
  get inputs(): ProvideCall__Inputs {
    return new ProvideCall__Inputs(this);
  }

  get outputs(): ProvideCall__Outputs {
    return new ProvideCall__Outputs(this);
  }
}

export class ProvideCall__Inputs {
  _call: ProvideCall;

  constructor(call: ProvideCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class ProvideCall__Outputs {
  _call: ProvideCall;

  constructor(call: ProvideCall) {
    this._call = call;
  }
}

export class UnbondCall extends ethereum.Call {
  get inputs(): UnbondCall__Inputs {
    return new UnbondCall__Inputs(this);
  }

  get outputs(): UnbondCall__Outputs {
    return new UnbondCall__Outputs(this);
  }
}

export class UnbondCall__Inputs {
  _call: UnbondCall;

  constructor(call: UnbondCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class UnbondCall__Outputs {
  _call: UnbondCall;

  constructor(call: UnbondCall) {
    this._call = call;
  }
}

export class WithdrawCall extends ethereum.Call {
  get inputs(): WithdrawCall__Inputs {
    return new WithdrawCall__Inputs(this);
  }

  get outputs(): WithdrawCall__Outputs {
    return new WithdrawCall__Outputs(this);
  }
}

export class WithdrawCall__Inputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }

  get value(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class WithdrawCall__Outputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }
}
