/** Monthly equivalent from recharge price and validity (days). */
export function monthlyEquivalentFromRecharge(price: number, validityDays: number): number {
  const v = validityDays > 0 ? validityDays : 28;
  return (price * 30) / v;
}
