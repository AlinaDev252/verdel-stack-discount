# Verdel stack discount

A Shopify Function that gives 10% off when a shopper buys two or more different formulas together. It runs on the Verdel demo store, next to the theme's "Help me choose" quiz that builds the stack.

## The rule

The cart gets the discount when it holds at least two different products tagged `formula`, bought one-time. Then every one-time formula line gets 10% off, shown as "Stack discount".

No discount when:

- the cart holds one formula, even in a larger quantity or on two lines
- a formula is on a subscription. Those lines already get 15% off, and the two don't add up.
- the buyer orders for a company (B2B). Those buyers get catalog prices instead.

Other products in the cart are left alone.

## How it's built

- `extensions/stack-discount/src/cart_lines_discounts_generate_run.graphql` asks Shopify for each line's product tag, selling plan and the buyer's company.
- `extensions/stack-discount/src/cart_lines_discounts_generate_run.js` applies the rule and returns one product discount.
- The function targets `cart.lines.discounts.generate.run` on API version 2026-07.

## Tests

Each file in `extensions/stack-discount/tests/fixtures` is a cart and the discount it should get. The test builds the function to WebAssembly, runs every cart through it, and checks the input and output against Shopify's schema.

```
npm install
npm test
```

Node 22.15 or newer.

## Deploy

```
npm run deploy
```

Then install the app on the store and create an automatic discount that uses the "Stack discount" function.
