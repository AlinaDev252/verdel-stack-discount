# Verdel stack discount

Two pieces for the Verdel demo store. A Shopify Function gives 10% off when a shopper buys two or more different formulas together. A checkout block offers the second formula when the cart holds only one. The theme's "Find your formulas" quiz builds the stack before checkout.

## The rule

The cart gets the discount when it holds at least two different products tagged `formula`, bought one-time. Then every one-time formula line gets 10% off, shown as "Bundle discount".

No discount when:

- the cart holds one formula, even in a larger quantity or on two lines
- a formula is on a subscription. Those lines already get 15% off, and the two don't add up.
- the buyer orders for a company (B2B). Those buyers get catalog prices instead.

Other products in the cart are left alone.

## The checkout offer

When the cart holds exactly one one-time formula, checkout shows a block under the line items: "Add a second formula, save $6.20", one product and an Add button. Adding it unlocks the Bundle discount and the block goes away.

- It suggests what Shopify's product recommendations pair with the formula in the cart. If none of those is a formula in stock, it takes the first formula in stock that isn't in the cart.
- The saving in the heading is 10% of each line, rounded per line, the same way the function rounds. The promise matches the discount to the cent.
- It stays hidden for subscription-only carts, carts that already qualify, and B2B buyers. The B2B check reads the buyer's company, which needs protected customer data access on a live store.

Checkout UI extensions only run on Shopify Plus stores. Development stores can run them for testing, which is how this one runs.

## How it's built

- `extensions/stack-discount/src/cart_lines_discounts_generate_run.graphql` asks Shopify for each line's product tag, selling plan and the buyer's company.
- `extensions/stack-discount/src/cart_lines_discounts_generate_run.js` applies the rule and returns one product discount.
- The function targets `cart.lines.discounts.generate.run` on API version 2026-07.
- `extensions/bundle-upsell/src/offer.js` decides whether to show the offer, which formula and how much it saves. It's plain JavaScript with no Shopify imports, so it tests on its own.
- `extensions/bundle-upsell/src/Checkout.jsx` loads the formulas through the Storefront API, renders the block with Polaris checkout components and adds the line. It targets `purchase.checkout.cart-line-list.render-after`.

## Tests

Each file in `extensions/stack-discount/tests/fixtures` is a cart and the discount it should get. The test builds the function to WebAssembly, runs every cart through it, and checks the input and output against Shopify's schema.

`extensions/bundle-upsell/tests` covers the offer: which formula it picks, the rounding, and every case where it stays hidden.

```
npm install
npm test
```

`npm test` runs both. Node 22.15 or newer.

## Deploy

```
npm run deploy
```

Then install the app on the store and create an automatic discount that uses the "Bundle discount" function. For the offer, open Settings → Checkout → Customize, click the Apps icon and add "Bundle offer". It sits under the line items.
