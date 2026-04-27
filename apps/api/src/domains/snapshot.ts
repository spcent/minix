export function cloneDomainSnapshot<TValue>(value: TValue): TValue {
  return structuredClone(value);
}

type DefinedDomainFields<TValue, TKey extends keyof TValue> = {
  [TField in TKey]?: Exclude<TValue[TField], undefined>;
};

export function cloneDefinedDomainFields<TValue extends object, TKey extends keyof TValue>(
  value: TValue,
  keys: readonly TKey[],
): DefinedDomainFields<TValue, TKey> {
  const result: DefinedDomainFields<TValue, TKey> = {};

  for (const key of keys) {
    const fieldValue = value[key];
    if (fieldValue !== undefined) {
      (result as Record<PropertyKey, unknown>)[key as PropertyKey] = cloneDomainSnapshot(fieldValue);
    }
  }

  return result;
}

export function cloneOptionalDomainSnapshot<TValue>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : cloneDomainSnapshot(value);
}

export function cloneDomainSnapshotArray<TValue>(values: readonly TValue[]): TValue[] {
  return values.map((value) => cloneDomainSnapshot(value));
}
