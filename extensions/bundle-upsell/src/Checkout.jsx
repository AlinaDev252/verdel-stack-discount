import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { bundleOffer } from './offer.js';

const FORMULAS = `query Formulas($country: CountryCode) @inContext(country: $country) {
  products(first: 50, query: "tag:formula") {
    nodes {
      id
      title
      availableForSale
      featuredImage { url altText }
      selectedOrFirstAvailableVariant { id price { amount } }
    }
  }
}`;

const RECOMMENDATIONS = `query Recommendations($productId: ID!) {
  productRecommendations(productId: $productId) { id }
}`;

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [formulas, setFormulas] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);
  const { i18n } = shopify;
  const country = shopify.localization.country.value?.isoCode;

  useEffect(() => {
    shopify
      .query(FORMULAS, { variables: { country } })
      .then(({ data }) => setFormulas(/** @type {any} */ (data)?.products.nodes ?? []));
  }, [country]);

  const offer = formulas
    ? bundleOffer({
        lines: shopify.lines.value,
        formulas,
        recommended,
        b2b: Boolean(shopify.buyerIdentity?.purchasingCompany?.value),
      })
    : null;
  const anchorId = offer?.anchorId;

  useEffect(() => {
    if (!anchorId) return;
    shopify
      .query(RECOMMENDATIONS, { variables: { productId: anchorId } })
      .then(({ data }) => {
        const products = /** @type {any} */ (data)?.productRecommendations ?? [];
        setRecommended(products.map((product) => product.id));
      });
  }, [anchorId]);

  if (!offer || !shopify.instructions.value.lines.canAddCartLine) return null;

  const { product } = offer;

  async function add() {
    setAdding(true);
    setFailed(false);
    const result = await shopify.applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: offer.variantId,
      quantity: 1,
    });
    setAdding(false);
    if (result.type === 'error') setFailed(true);
  }

  return (
    <s-stack gap="base">
      <s-stack gap="small-300">
        <s-text type="strong">{i18n.translate('heading', { amount: i18n.formatCurrency(offer.saving) })}</s-text>
        <s-text color="subdued">{i18n.translate('terms')}</s-text>
      </s-stack>
      <s-grid gridTemplateColumns="auto 1fr auto" gap="base" alignItems="center">
        <s-product-thumbnail src={product.featuredImage?.url} alt={product.featuredImage?.altText ?? ''} />
        <s-stack gap="none">
          <s-text>{product.title}</s-text>
          <s-text color="subdued">{i18n.formatCurrency(offer.price)}</s-text>
        </s-stack>
        <s-button
          variant="secondary"
          loading={adding}
          accessibilityLabel={`${i18n.translate('add')} ${product.title}`}
          onClick={add}
        >
          {i18n.translate('add')}
        </s-button>
      </s-grid>
      {failed && <s-text tone="critical">{i18n.translate('error', { title: product.title })}</s-text>}
    </s-stack>
  );
}
