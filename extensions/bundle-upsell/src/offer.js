const tenPercentCents = (amount) => Math.round(Math.round(Number(amount) * 100) / 10);

export function bundleOffer({ lines, formulas, recommended, b2b = false }) {
  if (b2b) return null;
  const formulaIds = new Set(formulas.map((product) => product.id));
  const formulaLines = lines.filter(
    (line) => line.merchandise.type === 'variant' && formulaIds.has(line.merchandise.product.id)
  );
  const oneTime = formulaLines.filter((line) => !line.merchandise.sellingPlan);
  if (new Set(oneTime.map((line) => line.merchandise.product.id)).size !== 1) return null;

  const inBag = new Set(formulaLines.map((line) => line.merchandise.product.id));
  const candidates = formulas.filter(
    (product) => product.availableForSale && product.selectedOrFirstAvailableVariant && !inBag.has(product.id)
  );
  const product =
    candidates.find((candidate) => recommended.includes(candidate.id)) ?? candidates[0];
  if (!product) return null;

  const variant = product.selectedOrFirstAvailableVariant;
  const cents = [...oneTime.map((line) => line.cost.totalAmount.amount), variant.price.amount]
    .map(tenPercentCents)
    .reduce((sum, value) => sum + value, 0);
  return { anchorId: oneTime[0].merchandise.product.id, product, variantId: variant.id, price: Number(variant.price.amount), saving: cents / 100 };
}
