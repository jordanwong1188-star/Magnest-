# MagnaNest — Your counter. Cleared.

Complete visual storefront rebuild for https://magnanest.pages.dev, prepared 16 October 2026.

## Design and product presentation

Ivory, deep moss and citrus, Manrope typography with Lora headline emphasis, generous spacing, readable mobile controls, subtle scroll reveals and reduced-motion support. The product and bundle selection follow the hero, with useful compatibility guidance, lifestyle photography and clear FAQs.

Five new AI-assisted images retain the original two-flat-rail shelf design. Native 1122 ×1402 images have portable 360/720/1122 JPEG versions; all 15 responsive files total about 1.7 MB. Images work directly on Cloudflare without Netlify image endpoints. An accessible zoom viewer gives shoppers a closer look.

Browsing promotions, optional bag upgrade, persistent cart, integer-cent bundle pricing and the mobile buy control remain. There are no invented ratings, reviews, scarcity claims or customer counts.

## Existing commerce retained

The newer production Stripe configuration is preserved unchanged for all quantities 1–12. All amounts are USD. One shelf is $24.95 plus$2.99 shipping (total $27.94); two shelves are $42.42; three are $56.14; shipping is free for 2+. Above three, the existing 25% subtotal calculation remains.

Stripe API verification confirmed the links are active, fixed-quantity and restricted to shipping addresses in Canada/USA, with prices matching the storefront. Charges/payouts reported enabled. No payment or account mutations were performed. Upgrade offers quote payable increases: $14.48 single → duo and $13.72 duo → trio.

Supplier fulfillment remains manual. Payment status must be reviewed in the merchant's Stripe Dashboard. Public checkout URLs contain no credentials; never add secret keys to checkout-config.js.

## Build and publish

Existing Cloudflare settings are retained:
- Production branch: main
- Build command: `node scripts/build-cloudflare.mjs`
- Publish directory: `dist`

The static source also works directly: the folder containing index.html can be opened locally or uploaded to an existing Direct Upload project. If the Cloudflare project uses Git integration, use the existing connection rather than dashboard drag-and-drop. An authenticated Wrangler CLI can deploy an existing build:`npx wrangler pages deploy dist --project-name magnanest`. Confirm the project name in your dashboard.

Official deployment guides:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/get-started/git-integration/

## Verification

The review workflow runs only on magnanest-rebuild-review and records browser screenshots/results separately from the production source. It builds dist, checks responsive layouts, local images/zoom, bundle and shipping totals, fixed Stripe destinations, keyboard interactions and promotions. Stripe navigation in tests is intercepted locally; no payment is created.

Image conversion/downsampling uses UPNG.js and jpeg-js; notices are in IMAGE-TOOL-LICENSES.txt. Obtain an actual supplier sample and authorized product content before relying on dimensions, weight limits or delivery claims. Props in lifestyle images are not included.
