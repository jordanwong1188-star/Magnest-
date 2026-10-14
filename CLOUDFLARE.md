# Cloudflare Pages and Magnanest Stripe checkout

Status: prepared for deployment; no Cloudflare project or Magnanest Stripe account has been connected by this change. Empty checkout configuration intentionally prevents payments.

## Cloudflare Pages
Import this GitHub repository into the existing Cloudflare account. Select the branch containing this change, framework None, build command `node scripts/build-cloudflare.mjs`, output `dist`, and no root-directory override. No npm installation is needed.

Deploy without the Stripe variables first to verify the storefront. Keep the existing Netlify site until the Cloudflare deployment and checkout pass verification. After deployment, use the returned Pages address; update metadata to a custom domain only after it is connected.

## Separate Stripe business
Create or select a separate **Magnanest** business account using the existing Stripe login. Do not rename or reuse Calvren. Complete account activation through Stripe.

Confirm the storefront currency and single-shelf shipping charge before creating prices. Existing product subtotals are 24.95 for 1 shelf, 42.42 for 2, and 56.14 for 3. Bundles of 2 and 3 promise free shipping.

Create one fixed-bundle Payment Link per bundle, quantity 1 (each product represents the full bundle), with adjustable quantities and cross-sells disabled so the cart and checkout stay consistent. Require a shipping address, configure supported destinations and shipping charges, and enable receipts. Confirm that each link belongs to Magnanest, is live, and shows the correct bundle total, currency, shipping, and business name.

Configure and test payment webhooks for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, gated on `payment_status`, with signature verification and duplicate-event protection. Fulfillment must use verified payment events; a browser return URL does not establish payment. Supplier fulfillment is not implemented in this repository.

Only after payment-event handling is ready, set these Cloudflare build environment variables and redeploy:
- `STRIPE_PAYMENT_LINK_1`: single-shelf link.
- `STRIPE_PAYMENT_LINK_2`: two-shelf bundle link.
- `STRIPE_PAYMENT_LINK_3`: three-shelf bundle link.

Payment Links are public checkout URLs. Never place API keys, bank information, or webhook signing secrets in these variables or in the storefront.

The build validates Stripe's host and requires all three links together. Missing links leave checkout disabled. The cart routes checkout by the actual cart quantity, including upsells and quantity changes, and displays “Powered by Stripe” beneath the button when a valid checkout is configured.

## Verification before enabling payments
Use a separate Stripe sandbox to test all bundles, shipping addresses, successful and delayed payments, webhook retries, and order handling. Then inspect the three live checkout pages without submitting a live payment. Deploy production from the verified branch and confirm the Cloudflare URL and assets before any domain cutover.
