export function cloneDomainSnapshot<TValue>(value: TValue): TValue {
  return structuredClone(value);
}

export function cloneOptionalDomainSnapshot<TValue>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : cloneDomainSnapshot(value);
}

export function cloneDomainSnapshotArray<TValue>(values: readonly TValue[]): TValue[] {
  return values.map((value) => cloneDomainSnapshot(value));
}
