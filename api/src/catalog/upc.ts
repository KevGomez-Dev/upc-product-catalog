export function isUpc(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === 12 &&
    /^[0-9]{12}$/.test(value)
  );
}

export function hasValidUpcCheckDigit(upc: string): boolean {
  const sum = Array.from(upc).reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1),
    0,
  );
  return sum % 10 === 0;
}
