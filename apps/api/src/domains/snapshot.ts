export function cloneDomainSnapshot<TValue>(value: TValue): TValue {
  return structuredClone(value);
}

export function cloneDomainSnapshotArray<TValue>(values: readonly TValue[]): TValue[] {
  return values.map((value) => cloneDomainSnapshot(value));
}
