export function cloneStateSnapshot<TValue>(value: TValue): TValue {
  return structuredClone(value);
}

export function cloneOptionalStateSnapshot<TValue>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : cloneStateSnapshot(value);
}

export function cloneStateSnapshotArray<TValue>(values: readonly TValue[]): TValue[] {
  return values.map((value) => cloneStateSnapshot(value));
}
