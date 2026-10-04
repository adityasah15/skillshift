/** Money is integer minor units (paise). Never floats. */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}
