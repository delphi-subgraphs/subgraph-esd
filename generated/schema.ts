// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Meta extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Meta entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Meta entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Meta", id.toString(), this);
  }

  static load(id: string): Meta | null {
    return store.get("Meta", id) as Meta | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get lpAddress(): string {
    let value = this.get("lpAddress");
    return value.toString();
  }

  set lpAddress(value: string) {
    this.set("lpAddress", Value.fromString(value));
  }
}

export class EpochSnapshot extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save EpochSnapshot entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save EpochSnapshot entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("EpochSnapshot", id.toString(), this);
  }

  static load(id: string): EpochSnapshot | null {
    return store.get("EpochSnapshot", id) as EpochSnapshot | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt {
    let value = this.get("epoch");
    return value.toBigInt();
  }

  set epoch(value: BigInt) {
    this.set("epoch", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get block(): BigInt {
    let value = this.get("block");
    return value.toBigInt();
  }

  set block(value: BigInt) {
    this.set("block", Value.fromBigInt(value));
  }

  get expiredCoupons(): BigInt {
    let value = this.get("expiredCoupons");
    return value.toBigInt();
  }

  set expiredCoupons(value: BigInt) {
    this.set("expiredCoupons", Value.fromBigInt(value));
  }

  get outstandingCoupons(): BigInt {
    let value = this.get("outstandingCoupons");
    return value.toBigInt();
  }

  set outstandingCoupons(value: BigInt) {
    this.set("outstandingCoupons", Value.fromBigInt(value));
  }

  get couponsExpiration(): BigInt {
    let value = this.get("couponsExpiration");
    return value.toBigInt();
  }

  set couponsExpiration(value: BigInt) {
    this.set("couponsExpiration", Value.fromBigInt(value));
  }

  get oraclePrice(): BigInt {
    let value = this.get("oraclePrice");
    return value.toBigInt();
  }

  set oraclePrice(value: BigInt) {
    this.set("oraclePrice", Value.fromBigInt(value));
  }

  get bootstrappingAt(): boolean {
    let value = this.get("bootstrappingAt");
    return value.toBoolean();
  }

  set bootstrappingAt(value: boolean) {
    this.set("bootstrappingAt", Value.fromBoolean(value));
  }

  get daoBondedEsdTotal(): BigInt {
    let value = this.get("daoBondedEsdTotal");
    return value.toBigInt();
  }

  set daoBondedEsdTotal(value: BigInt) {
    this.set("daoBondedEsdTotal", Value.fromBigInt(value));
  }

  get daoBondedEsdsTotal(): BigInt {
    let value = this.get("daoBondedEsdsTotal");
    return value.toBigInt();
  }

  set daoBondedEsdsTotal(value: BigInt) {
    this.set("daoBondedEsdsTotal", Value.fromBigInt(value));
  }

  get daoBondedEsdsFrozen(): BigInt {
    let value = this.get("daoBondedEsdsFrozen");
    return value.toBigInt();
  }

  set daoBondedEsdsFrozen(value: BigInt) {
    this.set("daoBondedEsdsFrozen", Value.fromBigInt(value));
  }

  get daoBondedEsdsFluid(): BigInt {
    let value = this.get("daoBondedEsdsFluid");
    return value.toBigInt();
  }

  set daoBondedEsdsFluid(value: BigInt) {
    this.set("daoBondedEsdsFluid", Value.fromBigInt(value));
  }

  get daoBondedEsdsLocked(): BigInt {
    let value = this.get("daoBondedEsdsLocked");
    return value.toBigInt();
  }

  set daoBondedEsdsLocked(value: BigInt) {
    this.set("daoBondedEsdsLocked", Value.fromBigInt(value));
  }

  get daoStagedEsdTotal(): BigInt {
    let value = this.get("daoStagedEsdTotal");
    return value.toBigInt();
  }

  set daoStagedEsdTotal(value: BigInt) {
    this.set("daoStagedEsdTotal", Value.fromBigInt(value));
  }

  get daoStagedEsdFrozen(): BigInt {
    let value = this.get("daoStagedEsdFrozen");
    return value.toBigInt();
  }

  set daoStagedEsdFrozen(value: BigInt) {
    this.set("daoStagedEsdFrozen", Value.fromBigInt(value));
  }

  get daoStagedEsdFluid(): BigInt {
    let value = this.get("daoStagedEsdFluid");
    return value.toBigInt();
  }

  set daoStagedEsdFluid(value: BigInt) {
    this.set("daoStagedEsdFluid", Value.fromBigInt(value));
  }

  get daoStagedEsdLocked(): BigInt {
    let value = this.get("daoStagedEsdLocked");
    return value.toBigInt();
  }

  set daoStagedEsdLocked(value: BigInt) {
    this.set("daoStagedEsdLocked", Value.fromBigInt(value));
  }

  get lpBondedUniV2Total(): BigInt {
    let value = this.get("lpBondedUniV2Total");
    return value.toBigInt();
  }

  set lpBondedUniV2Total(value: BigInt) {
    this.set("lpBondedUniV2Total", Value.fromBigInt(value));
  }

  get lpBondedUniV2Frozen(): BigInt {
    let value = this.get("lpBondedUniV2Frozen");
    return value.toBigInt();
  }

  set lpBondedUniV2Frozen(value: BigInt) {
    this.set("lpBondedUniV2Frozen", Value.fromBigInt(value));
  }

  get lpBondedUniV2Fluid(): BigInt {
    let value = this.get("lpBondedUniV2Fluid");
    return value.toBigInt();
  }

  set lpBondedUniV2Fluid(value: BigInt) {
    this.set("lpBondedUniV2Fluid", Value.fromBigInt(value));
  }

  get lpStagedUniV2Total(): BigInt {
    let value = this.get("lpStagedUniV2Total");
    return value.toBigInt();
  }

  set lpStagedUniV2Total(value: BigInt) {
    this.set("lpStagedUniV2Total", Value.fromBigInt(value));
  }

  get lpStagedUniV2Frozen(): BigInt {
    let value = this.get("lpStagedUniV2Frozen");
    return value.toBigInt();
  }

  set lpStagedUniV2Frozen(value: BigInt) {
    this.set("lpStagedUniV2Frozen", Value.fromBigInt(value));
  }

  get lpStagedUniV2Fluid(): BigInt {
    let value = this.get("lpStagedUniV2Fluid");
    return value.toBigInt();
  }

  set lpStagedUniV2Fluid(value: BigInt) {
    this.set("lpStagedUniV2Fluid", Value.fromBigInt(value));
  }

  get lpClaimableTotal(): BigInt {
    let value = this.get("lpClaimableTotal");
    return value.toBigInt();
  }

  set lpClaimableTotal(value: BigInt) {
    this.set("lpClaimableTotal", Value.fromBigInt(value));
  }

  get lpClaimableFrozen(): BigInt {
    let value = this.get("lpClaimableFrozen");
    return value.toBigInt();
  }

  set lpClaimableFrozen(value: BigInt) {
    this.set("lpClaimableFrozen", Value.fromBigInt(value));
  }

  get lpClaimableFluid(): BigInt {
    let value = this.get("lpClaimableFluid");
    return value.toBigInt();
  }

  set lpClaimableFluid(value: BigInt) {
    this.set("lpClaimableFluid", Value.fromBigInt(value));
  }

  get lpRewardedTotal(): BigInt {
    let value = this.get("lpRewardedTotal");
    return value.toBigInt();
  }

  set lpRewardedTotal(value: BigInt) {
    this.set("lpRewardedTotal", Value.fromBigInt(value));
  }
}

export class FundsToBeFrozen extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save FundsToBeFrozen entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save FundsToBeFrozen entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("FundsToBeFrozen", id.toString(), this);
  }

  static load(id: string): FundsToBeFrozen | null {
    return store.get("FundsToBeFrozen", id) as FundsToBeFrozen | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt {
    let value = this.get("epoch");
    return value.toBigInt();
  }

  set epoch(value: BigInt) {
    this.set("epoch", Value.fromBigInt(value));
  }

  get daoStagedEsdFluidToFrozen(): BigInt {
    let value = this.get("daoStagedEsdFluidToFrozen");
    return value.toBigInt();
  }

  set daoStagedEsdFluidToFrozen(value: BigInt) {
    this.set("daoStagedEsdFluidToFrozen", Value.fromBigInt(value));
  }

  get daoStagedEsdLockedToFrozen(): BigInt {
    let value = this.get("daoStagedEsdLockedToFrozen");
    return value.toBigInt();
  }

  set daoStagedEsdLockedToFrozen(value: BigInt) {
    this.set("daoStagedEsdLockedToFrozen", Value.fromBigInt(value));
  }

  get daoBondedEsdsFluidToFrozen(): BigInt {
    let value = this.get("daoBondedEsdsFluidToFrozen");
    return value.toBigInt();
  }

  set daoBondedEsdsFluidToFrozen(value: BigInt) {
    this.set("daoBondedEsdsFluidToFrozen", Value.fromBigInt(value));
  }

  get daoBondedEsdsLockedToFrozen(): BigInt {
    let value = this.get("daoBondedEsdsLockedToFrozen");
    return value.toBigInt();
  }

  set daoBondedEsdsLockedToFrozen(value: BigInt) {
    this.set("daoBondedEsdsLockedToFrozen", Value.fromBigInt(value));
  }

  get lpStagedUniV2FluidToFrozen(): BigInt {
    let value = this.get("lpStagedUniV2FluidToFrozen");
    return value.toBigInt();
  }

  set lpStagedUniV2FluidToFrozen(value: BigInt) {
    this.set("lpStagedUniV2FluidToFrozen", Value.fromBigInt(value));
  }

  get lpBondedUniV2FluidToFrozen(): BigInt {
    let value = this.get("lpBondedUniV2FluidToFrozen");
    return value.toBigInt();
  }

  set lpBondedUniV2FluidToFrozen(value: BigInt) {
    this.set("lpBondedUniV2FluidToFrozen", Value.fromBigInt(value));
  }
}

export class FutureClaimableEsd extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save FutureClaimableEsd entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save FutureClaimableEsd entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("FutureClaimableEsd", id.toString(), this);
  }

  static load(id: string): FutureClaimableEsd | null {
    return store.get("FutureClaimableEsd", id) as FutureClaimableEsd | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt {
    let value = this.get("epoch");
    return value.toBigInt();
  }

  set epoch(value: BigInt) {
    this.set("epoch", Value.fromBigInt(value));
  }

  get lpClaimableTotal(): BigInt {
    let value = this.get("lpClaimableTotal");
    return value.toBigInt();
  }

  set lpClaimableTotal(value: BigInt) {
    this.set("lpClaimableTotal", Value.fromBigInt(value));
  }
}

export class EsdSupplyHistory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save EsdSupplyHistory entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save EsdSupplyHistory entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("EsdSupplyHistory", id.toString(), this);
  }

  static load(id: string): EsdSupplyHistory | null {
    return store.get("EsdSupplyHistory", id) as EsdSupplyHistory | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt {
    let value = this.get("epoch");
    return value.toBigInt();
  }

  set epoch(value: BigInt) {
    this.set("epoch", Value.fromBigInt(value));
  }

  get daoLockedTotal(): BigInt {
    let value = this.get("daoLockedTotal");
    return value.toBigInt();
  }

  set daoLockedTotal(value: BigInt) {
    this.set("daoLockedTotal", Value.fromBigInt(value));
  }

  get lpLockedTotal(): BigInt {
    let value = this.get("lpLockedTotal");
    return value.toBigInt();
  }

  set lpLockedTotal(value: BigInt) {
    this.set("lpLockedTotal", Value.fromBigInt(value));
  }

  get totalSupply(): BigInt {
    let value = this.get("totalSupply");
    return value.toBigInt();
  }

  set totalSupply(value: BigInt) {
    this.set("totalSupply", Value.fromBigInt(value));
  }
}

export class LpUniV2TokenHistory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save LpUniV2TokenHistory entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save LpUniV2TokenHistory entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("LpUniV2TokenHistory", id.toString(), this);
  }

  static load(id: string): LpUniV2TokenHistory | null {
    return store.get("LpUniV2TokenHistory", id) as LpUniV2TokenHistory | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt {
    let value = this.get("epoch");
    return value.toBigInt();
  }

  set epoch(value: BigInt) {
    this.set("epoch", Value.fromBigInt(value));
  }

  get totalStaged(): BigInt {
    let value = this.get("totalStaged");
    return value.toBigInt();
  }

  set totalStaged(value: BigInt) {
    this.set("totalStaged", Value.fromBigInt(value));
  }

  get totalBonded(): BigInt {
    let value = this.get("totalBonded");
    return value.toBigInt();
  }

  set totalBonded(value: BigInt) {
    this.set("totalBonded", Value.fromBigInt(value));
  }

  get totalSupply(): BigInt {
    let value = this.get("totalSupply");
    return value.toBigInt();
  }

  set totalSupply(value: BigInt) {
    this.set("totalSupply", Value.fromBigInt(value));
  }
}

export class AddressInfo extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AddressInfo entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AddressInfo entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AddressInfo", id.toString(), this);
  }

  static load(id: string): AddressInfo | null {
    return store.get("AddressInfo", id) as AddressInfo | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get esdBalance(): BigInt {
    let value = this.get("esdBalance");
    return value.toBigInt();
  }

  set esdBalance(value: BigInt) {
    this.set("esdBalance", Value.fromBigInt(value));
  }

  get uniV2Balance(): BigInt {
    let value = this.get("uniV2Balance");
    return value.toBigInt();
  }

  set uniV2Balance(value: BigInt) {
    this.set("uniV2Balance", Value.fromBigInt(value));
  }

  get daoBondedEsds(): BigInt {
    let value = this.get("daoBondedEsds");
    return value.toBigInt();
  }

  set daoBondedEsds(value: BigInt) {
    this.set("daoBondedEsds", Value.fromBigInt(value));
  }

  get daoStagedEsd(): BigInt {
    let value = this.get("daoStagedEsd");
    return value.toBigInt();
  }

  set daoStagedEsd(value: BigInt) {
    this.set("daoStagedEsd", Value.fromBigInt(value));
  }

  get daoLockedUntilEpoch(): BigInt {
    let value = this.get("daoLockedUntilEpoch");
    return value.toBigInt();
  }

  set daoLockedUntilEpoch(value: BigInt) {
    this.set("daoLockedUntilEpoch", Value.fromBigInt(value));
  }

  get daoFluidUntilEpoch(): BigInt {
    let value = this.get("daoFluidUntilEpoch");
    return value.toBigInt();
  }

  set daoFluidUntilEpoch(value: BigInt) {
    this.set("daoFluidUntilEpoch", Value.fromBigInt(value));
  }

  get lpBondedUniV2(): BigInt {
    let value = this.get("lpBondedUniV2");
    return value.toBigInt();
  }

  set lpBondedUniV2(value: BigInt) {
    this.set("lpBondedUniV2", Value.fromBigInt(value));
  }

  get lpStagedUniV2(): BigInt {
    let value = this.get("lpStagedUniV2");
    return value.toBigInt();
  }

  set lpStagedUniV2(value: BigInt) {
    this.set("lpStagedUniV2", Value.fromBigInt(value));
  }

  get lpClaimable(): BigInt {
    let value = this.get("lpClaimable");
    return value.toBigInt();
  }

  set lpClaimable(value: BigInt) {
    this.set("lpClaimable", Value.fromBigInt(value));
  }

  get lpRewarded(): BigInt {
    let value = this.get("lpRewarded");
    return value.toBigInt();
  }

  set lpRewarded(value: BigInt) {
    this.set("lpRewarded", Value.fromBigInt(value));
  }

  get lpFluidUntilEpoch(): BigInt {
    let value = this.get("lpFluidUntilEpoch");
    return value.toBigInt();
  }

  set lpFluidUntilEpoch(value: BigInt) {
    this.set("lpFluidUntilEpoch", Value.fromBigInt(value));
  }
}
