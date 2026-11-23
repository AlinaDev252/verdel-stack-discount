import { DiscountClass, ProductDiscountSelectionStrategy } from '../generated/api';

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  const noDiscount = { operations: [] };
  if (!input.discount.discountClasses.includes(DiscountClass.Product)) return noDiscount;
  if (input.cart.buyerIdentity?.purchasingCompany) return noDiscount;

  const formulaLines = input.cart.lines.filter(
    (line) =>
      line.merchandise.__typename === 'ProductVariant' &&
      line.merchandise.product.hasAnyTag &&
      !line.sellingPlanAllocation
  );
  const formulas = new Set(formulaLines.map((line) => line.merchandise.product.id));
  if (formulas.size < 2) return noDiscount;

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: 'Stack discount',
              targets: formulaLines.map((line) => ({ cartLine: { id: line.id } })),
              value: { percentage: { value: 10 } },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
