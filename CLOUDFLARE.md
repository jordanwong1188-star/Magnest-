# Magnanest Cloudflare storefront

This source exports the user-selected live Netlify version at https://magnanest-store.netlify.app/, published deployment `6abedb69b74072c9764cfe00` (October 1, 2026). Its typography, layout, responsive gallery, cart persistence, upsells, and 12-shelf cart limit are retained.

Netlify image transformations have been exported as local WebP assets in all existing responsive sizes. Cloudflare does not need Netlify Image CDN. `export-manifest.json` records the source image mapping.

Build: `node scripts/build-cloudflare.mjs`. Output: `dist`. Deploy from `main`. No dependencies or payment credentials are needed for this static storefront.

Stripe account: Magnanest (`acct_1UQbFWB9mDibMqy4`). Public fixed-bundle Payment Links for quantities 1–12 are in `checkout-config.js`. All prices remain **USD**, matching the selected Netlify version. One shelf is $24.95 plus $2.99 shipping (12%, rounded to cents). Two shelves are $42.42 and three are $56.14; quantities 3–12 retain the existing 25% bundle formula. Shipping is free for 2+. All links require a shipping address in Canada or the USA. Customers cannot adjust quantities inside Stripe; quantity changes belong in the storefront.

Orders and payment status must be reviewed in the Magnanest Stripe Dashboard for manual fulfillment. Supplier fulfillment is not automated. Payment-event webhooks for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, with signature validation and duplicate protection, are required when implementing automated order handling; the browser confirmation is never an order-fulfillment trigger. Never ship a pending asynchronous payment.

Bank payouts remain subject to Stripe identity verification. The Stripe business profile's product description needs correcting from AI automation to physical magnetic kitchen storage shelves in the Dashboard; account-profile writes are not exposed by the connected integration.

The unused CAD Payment Links from the earlier source version were deactivated.
