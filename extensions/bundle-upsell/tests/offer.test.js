import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bundleOffer } from '../src/offer.js';

const formula = (id, price, available = true) => ({
  id: `gid://shopify/Product/${id}`,
  title: `No. ${id}`,
  availableForSale: available,
  featuredImage: { url: `https://cdn/${id}.jpg` },
  selectedOrFirstAvailableVariant: { id: `gid://shopify/ProductVariant/${id}0`, price: { amount: String(price) } },
});

const line = (productId, total, sellingPlan) => ({
  merchandise: {
    type: 'variant',
    product: { id: `gid://shopify/Product/${productId}` },
    ...(sellingPlan && { sellingPlan: { id: 'gid://shopify/SellingPlan/1' } }),
  },
  cost: { totalAmount: { amount: total } },
});

const formulas = [formula(1, 42), formula(2, 44), formula(3, 39)];

test('offers the first formula not in the bag when one one-time formula is in it', () => {
  const offer = bundleOffer({ lines: [line(1, 42)], formulas, recommended: [] });
  assert.equal(offer.product.id, 'gid://shopify/Product/2');
  assert.equal(offer.variantId, 'gid://shopify/ProductVariant/20');
  assert.equal(offer.anchorId, 'gid://shopify/Product/1');
});

test('prefers a recommended formula over list order', () => {
  const offer = bundleOffer({ lines: [line(1, 42)], formulas, recommended: ['gid://shopify/Product/3'] });
  assert.equal(offer.product.id, 'gid://shopify/Product/3');
});

test('saving is 10% of each formula line, rounded per line like checkout', () => {
  const offer = bundleOffer({ lines: [line(1, 42.05)], formulas, recommended: [] });
  assert.equal(offer.saving, 8.61);
});

test('no offer when the bag already has two one-time formulas', () => {
  assert.equal(bundleOffer({ lines: [line(1, 42), line(2, 44)], formulas, recommended: [] }), null);
});

test('no offer when the only formula is on a subscription', () => {
  assert.equal(bundleOffer({ lines: [line(1, 42, true)], formulas, recommended: [] }), null);
});

test('never suggests a formula already in the bag on subscription', () => {
  const offer = bundleOffer({ lines: [line(1, 42), line(2, 44, true)], formulas, recommended: [] });
  assert.equal(offer.product.id, 'gid://shopify/Product/3');
});

test('skips sold-out formulas and returns null when none are left', () => {
  const soldOut = [formula(1, 42), formula(2, 44, false)];
  assert.equal(bundleOffer({ lines: [line(1, 42)], formulas: soldOut, recommended: [] }), null);
});

test('no offer for B2B buyers', () => {
  assert.equal(bundleOffer({ lines: [line(1, 42)], formulas, recommended: [], b2b: true }), null);
});

test('ignores non-formula lines', () => {
  assert.equal(bundleOffer({ lines: [line(9, 20)], formulas, recommended: [] }), null);
});
