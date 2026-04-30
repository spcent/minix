export function cloneStateSnapshot<TValue>(value: TValue): TValue {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => cloneStateSnapshot(entry)) as TValue;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as TValue;
  }

  if (value && typeof value === "object") {
    const cloned: Record<PropertyKey, unknown> = {};
    for (const [key, fieldValue] of Object.entries(value)) {
      cloned[key] = cloneStateSnapshot(fieldValue);
    }
    return cloned as TValue;
  }

  return value;
}

export function cloneOptionalStateSnapshot<TValue>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : cloneStateSnapshot(value);
}

export function cloneStateSnapshotArray<TValue>(values: readonly TValue[]): TValue[] {
  return values.map((value) => cloneStateSnapshot(value));
}
