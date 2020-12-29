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

export class Epoch extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Epoch entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Epoch entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Epoch", id.toString(), this);
  }

  static load(id: string): Epoch | null {
    return store.get("Epoch", id) as Epoch | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get startDAOTotalBonded(): BigInt | null {
    let value = this.get("startDAOTotalBonded");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startDAOTotalBonded(value: BigInt | null) {
    if (value === null) {
      this.unset("startDAOTotalBonded");
    } else {
      this.set("startDAOTotalBonded", Value.fromBigInt(value as BigInt));
    }
  }

  get startDAOTotalStaged(): BigInt | null {
    let value = this.get("startDAOTotalStaged");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startDAOTotalStaged(value: BigInt | null) {
    if (value === null) {
      this.unset("startDAOTotalStaged");
    } else {
      this.set("startDAOTotalStaged", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalDebt(): BigInt | null {
    let value = this.get("startTotalDebt");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalDebt(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalDebt");
    } else {
      this.set("startTotalDebt", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalRedeemable(): BigInt | null {
    let value = this.get("startTotalRedeemable");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalRedeemable(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalRedeemable");
    } else {
      this.set("startTotalRedeemable", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalCoupons(): BigInt | null {
    let value = this.get("startTotalCoupons");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalCoupons(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalCoupons");
    } else {
      this.set("startTotalCoupons", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalNet(): BigInt | null {
    let value = this.get("startTotalNet");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalNet(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalNet");
    } else {
      this.set("startTotalNet", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalLPESD(): BigInt | null {
    let value = this.get("startTotalLPESD");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalLPESD(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalLPESD");
    } else {
      this.set("startTotalLPESD", Value.fromBigInt(value as BigInt));
    }
  }

  get startTotalLPTokens(): BigInt | null {
    let value = this.get("startTotalLPTokens");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTotalLPTokens(value: BigInt | null) {
    if (value === null) {
      this.unset("startTotalLPTokens");
    } else {
      this.set("startTotalLPTokens", Value.fromBigInt(value as BigInt));
    }
  }

  get startLPTotalBondedTokens(): BigInt | null {
    let value = this.get("startLPTotalBondedTokens");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startLPTotalBondedTokens(value: BigInt | null) {
    if (value === null) {
      this.unset("startLPTotalBondedTokens");
    } else {
      this.set("startLPTotalBondedTokens", Value.fromBigInt(value as BigInt));
    }
  }

  get startLPTotalStagedTokens(): BigInt | null {
    let value = this.get("startLPTotalStagedTokens");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startLPTotalStagedTokens(value: BigInt | null) {
    if (value === null) {
      this.unset("startLPTotalStagedTokens");
    } else {
      this.set("startLPTotalStagedTokens", Value.fromBigInt(value as BigInt));
    }
  }

  get startLPTotalBondedESD(): BigInt | null {
    let value = this.get("startLPTotalBondedESD");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startLPTotalBondedESD(value: BigInt | null) {
    if (value === null) {
      this.unset("startLPTotalBondedESD");
    } else {
      this.set("startLPTotalBondedESD", Value.fromBigInt(value as BigInt));
    }
  }

  get startLPTotalStagedESD(): BigInt | null {
    let value = this.get("startLPTotalStagedESD");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startLPTotalStagedESD(value: BigInt | null) {
    if (value === null) {
      this.unset("startLPTotalStagedESD");
    } else {
      this.set("startLPTotalStagedESD", Value.fromBigInt(value as BigInt));
    }
  }

  get startTimestamp(): BigInt | null {
    let value = this.get("startTimestamp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTimestamp(value: BigInt | null) {
    if (value === null) {
      this.unset("startTimestamp");
    } else {
      this.set("startTimestamp", Value.fromBigInt(value as BigInt));
    }
  }

  get startBlock(): BigInt | null {
    let value = this.get("startBlock");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startBlock(value: BigInt | null) {
    if (value === null) {
      this.unset("startBlock");
    } else {
      this.set("startBlock", Value.fromBigInt(value as BigInt));
    }
  }

  get expiredCoupons(): BigInt | null {
    let value = this.get("expiredCoupons");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set expiredCoupons(value: BigInt | null) {
    if (value === null) {
      this.unset("expiredCoupons");
    } else {
      this.set("expiredCoupons", Value.fromBigInt(value as BigInt));
    }
  }

  get outstandingCoupons(): BigInt | null {
    let value = this.get("outstandingCoupons");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set outstandingCoupons(value: BigInt | null) {
    if (value === null) {
      this.unset("outstandingCoupons");
    } else {
      this.set("outstandingCoupons", Value.fromBigInt(value as BigInt));
    }
  }

  get couponsExpiration(): BigInt | null {
    let value = this.get("couponsExpiration");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set couponsExpiration(value: BigInt | null) {
    if (value === null) {
      this.unset("couponsExpiration");
    } else {
      this.set("couponsExpiration", Value.fromBigInt(value as BigInt));
    }
  }

  get oraclePrice(): BigInt | null {
    let value = this.get("oraclePrice");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set oraclePrice(value: BigInt | null) {
    if (value === null) {
      this.unset("oraclePrice");
    } else {
      this.set("oraclePrice", Value.fromBigInt(value as BigInt));
    }
  }

  get deltaSupply(): BigInt | null {
    let value = this.get("deltaSupply");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set deltaSupply(value: BigInt | null) {
    if (value === null) {
      this.unset("deltaSupply");
    } else {
      this.set("deltaSupply", Value.fromBigInt(value as BigInt));
    }
  }

  get bootstrappingAt(): boolean {
    let value = this.get("bootstrappingAt");
    return value.toBoolean();
  }

  set bootstrappingAt(value: boolean) {
    this.set("bootstrappingAt", Value.fromBoolean(value));
  }
}

export class LpTokenHistory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save LpTokenHistory entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save LpTokenHistory entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("LpTokenHistory", id.toString(), this);
  }

  static load(id: string): LpTokenHistory | null {
    return store.get("LpTokenHistory", id) as LpTokenHistory | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt | null {
    let value = this.get("epoch");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set epoch(value: BigInt | null) {
    if (value === null) {
      this.unset("epoch");
    } else {
      this.set("epoch", Value.fromBigInt(value as BigInt));
    }
  }

  get totalStaged(): BigInt | null {
    let value = this.get("totalStaged");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalStaged(value: BigInt | null) {
    if (value === null) {
      this.unset("totalStaged");
    } else {
      this.set("totalStaged", Value.fromBigInt(value as BigInt));
    }
  }

  get totalBonded(): BigInt | null {
    let value = this.get("totalBonded");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalBonded(value: BigInt | null) {
    if (value === null) {
      this.unset("totalBonded");
    } else {
      this.set("totalBonded", Value.fromBigInt(value as BigInt));
    }
  }

  get totalSupply(): BigInt | null {
    let value = this.get("totalSupply");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalSupply(value: BigInt | null) {
    if (value === null) {
      this.unset("totalSupply");
    } else {
      this.set("totalSupply", Value.fromBigInt(value as BigInt));
    }
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

  get epoch(): BigInt | null {
    let value = this.get("epoch");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set epoch(value: BigInt | null) {
    if (value === null) {
      this.unset("epoch");
    } else {
      this.set("epoch", Value.fromBigInt(value as BigInt));
    }
  }

  get lockedViaDAO(): BigInt | null {
    let value = this.get("lockedViaDAO");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set lockedViaDAO(value: BigInt | null) {
    if (value === null) {
      this.unset("lockedViaDAO");
    } else {
      this.set("lockedViaDAO", Value.fromBigInt(value as BigInt));
    }
  }

  get lockedViaLP(): BigInt | null {
    let value = this.get("lockedViaLP");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set lockedViaLP(value: BigInt | null) {
    if (value === null) {
      this.unset("lockedViaLP");
    } else {
      this.set("lockedViaLP", Value.fromBigInt(value as BigInt));
    }
  }

  get totalSupply(): BigInt | null {
    let value = this.get("totalSupply");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalSupply(value: BigInt | null) {
    if (value === null) {
      this.unset("totalSupply");
    } else {
      this.set("totalSupply", Value.fromBigInt(value as BigInt));
    }
  }
}

export class BalanceStats extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save BalanceStats entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save BalanceStats entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("BalanceStats", id.toString(), this);
  }

  static load(id: string): BalanceStats | null {
    return store.get("BalanceStats", id) as BalanceStats | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get total(): BigInt | null {
    let value = this.get("total");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set total(value: BigInt | null) {
    if (value === null) {
      this.unset("total");
    } else {
      this.set("total", Value.fromBigInt(value as BigInt));
    }
  }

  get frozen(): BigInt | null {
    let value = this.get("frozen");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set frozen(value: BigInt | null) {
    if (value === null) {
      this.unset("frozen");
    } else {
      this.set("frozen", Value.fromBigInt(value as BigInt));
    }
  }

  get fluid(): BigInt | null {
    let value = this.get("fluid");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set fluid(value: BigInt | null) {
    if (value === null) {
      this.unset("fluid");
    } else {
      this.set("fluid", Value.fromBigInt(value as BigInt));
    }
  }

  get locked(): BigInt | null {
    let value = this.get("locked");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set locked(value: BigInt | null) {
    if (value === null) {
      this.unset("locked");
    } else {
      this.set("locked", Value.fromBigInt(value as BigInt));
    }
  }
}

export class DAOBalance extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save DAOBalance entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save DAOBalance entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("DAOBalance", id.toString(), this);
  }

  static load(id: string): DAOBalance | null {
    return store.get("DAOBalance", id) as DAOBalance | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get bonded(): string | null {
    let value = this.get("bonded");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set bonded(value: string | null) {
    if (value === null) {
      this.unset("bonded");
    } else {
      this.set("bonded", Value.fromString(value as string));
    }
  }

  get staged(): string | null {
    let value = this.get("staged");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set staged(value: string | null) {
    if (value === null) {
      this.unset("staged");
    } else {
      this.set("staged", Value.fromString(value as string));
    }
  }
}

export class LPBalance extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save LPBalance entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save LPBalance entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("LPBalance", id.toString(), this);
  }

  static load(id: string): LPBalance | null {
    return store.get("LPBalance", id) as LPBalance | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get bonded(): string | null {
    let value = this.get("bonded");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set bonded(value: string | null) {
    if (value === null) {
      this.unset("bonded");
    } else {
      this.set("bonded", Value.fromString(value as string));
    }
  }

  get staged(): string | null {
    let value = this.get("staged");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set staged(value: string | null) {
    if (value === null) {
      this.unset("staged");
    } else {
      this.set("staged", Value.fromString(value as string));
    }
  }

  get reward(): string | null {
    let value = this.get("reward");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set reward(value: string | null) {
    if (value === null) {
      this.unset("reward");
    } else {
      this.set("reward", Value.fromString(value as string));
    }
  }

  get claimable(): BigInt | null {
    let value = this.get("claimable");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set claimable(value: BigInt | null) {
    if (value === null) {
      this.unset("claimable");
    } else {
      this.set("claimable", Value.fromBigInt(value as BigInt));
    }
  }
}

export class EpochSnapshots extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save EpochSnapshots entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save EpochSnapshots entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("EpochSnapshots", id.toString(), this);
  }

  static load(id: string): EpochSnapshots | null {
    return store.get("EpochSnapshots", id) as EpochSnapshots | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt | null {
    let value = this.get("epoch");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set epoch(value: BigInt | null) {
    if (value === null) {
      this.unset("epoch");
    } else {
      this.set("epoch", Value.fromBigInt(value as BigInt));
    }
  }

  get timestamp(): BigInt | null {
    let value = this.get("timestamp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set timestamp(value: BigInt | null) {
    if (value === null) {
      this.unset("timestamp");
    } else {
      this.set("timestamp", Value.fromBigInt(value as BigInt));
    }
  }

  get dao(): string | null {
    let value = this.get("dao");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set dao(value: string | null) {
    if (value === null) {
      this.unset("dao");
    } else {
      this.set("dao", Value.fromString(value as string));
    }
  }

  get lp(): string | null {
    let value = this.get("lp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set lp(value: string | null) {
    if (value === null) {
      this.unset("lp");
    } else {
      this.set("lp", Value.fromString(value as string));
    }
  }
}

export class FutureClaimableESD extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save FutureClaimableESD entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save FutureClaimableESD entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("FutureClaimableESD", id.toString(), this);
  }

  static load(id: string): FutureClaimableESD | null {
    return store.get("FutureClaimableESD", id) as FutureClaimableESD | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get epoch(): BigInt | null {
    let value = this.get("epoch");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set epoch(value: BigInt | null) {
    if (value === null) {
      this.unset("epoch");
    } else {
      this.set("epoch", Value.fromBigInt(value as BigInt));
    }
  }

  get daoClaimable(): BigInt | null {
    let value = this.get("daoClaimable");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set daoClaimable(value: BigInt | null) {
    if (value === null) {
      this.unset("daoClaimable");
    } else {
      this.set("daoClaimable", Value.fromBigInt(value as BigInt));
    }
  }

  get lpClaimable(): BigInt | null {
    let value = this.get("lpClaimable");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set lpClaimable(value: BigInt | null) {
    if (value === null) {
      this.unset("lpClaimable");
    } else {
      this.set("lpClaimable", Value.fromBigInt(value as BigInt));
    }
  }
}
